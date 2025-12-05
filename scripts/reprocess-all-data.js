#!/usr/bin/env node

/**
 * Script de Retraitement et Validation des Données de Subsides
 * 
 * Ce script charge tous les fichiers JSON sources, les normalise, les valide,
 * détecte les doublons, regroupe les bénéficiaires, et génère des fichiers
 * validés avec des rapports détaillés.
 * 
 * Usage:
 *   node scripts/reprocess-all-data.js [--dry-run] [--year=2023]
 * 
 * Options:
 *   --dry-run    : Simule le retraitement sans créer de fichiers
 *   --year=YYYY  : Traite seulement une année spécifique
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')

// Configuration
const SOURCE_DIR = path.join(__dirname, '../public')
const OUTPUT_DIR = path.join(__dirname, '../public')
const REPORT_DIR = path.join(__dirname, '../reports')
const YEARS = ['2019', '2020', '2021', '2022', '2023', '2024']

// Options de ligne de commande
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const YEAR_FILTER = args.find(arg => arg.startsWith('--year='))?.split('=')[1]

// ============================================================================
// FONCTIONS DE NORMALISATION (répliquent la logique TypeScript)
// ============================================================================

/**
 * Parse un montant depuis différents formats possibles
 */
function parseAmount(value) {
  if (typeof value === 'number') {
    return value
  }
  
  if (typeof value === 'string') {
    // Format européen : "1.234,56" -> 1234.56
    const cleaned = value.replace(/\./g, '').replace(',', '.')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  
  return 0
}

/**
 * Normalise un nom de bénéficiaire (identique à beneficiary-normalizer.ts)
 */
function normalizeBeneficiaryName(name) {
  if (!name || typeof name !== 'string') {
    return ''
  }
  
  let normalized = name.trim()
  
  // 1. Convertir en minuscules
  normalized = normalized.toLowerCase()
  
  // 2. Normaliser Unicode (NFD) et supprimer les accents
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  // 3. Remplacer les points, tirets, slashes, pipes par des espaces
  normalized = normalized.replace(/[.\-\/|_]/g, ' ')
  
  // 4. Supprimer tous les caractères non-alphanumériques (sauf espaces)
  normalized = normalized.replace(/[^a-z0-9\s]/g, ' ')
  
  // 5. Supprimer les suffixes légaux courants
  const legalSuffixes = ['asbl', 'vzw', 'scrl', 'sprl', 'sa', 'nv', 'bv', 'cv', 'sc', 'srl', 'bvba', 'cvba']
  legalSuffixes.forEach(suffix => {
    const suffixRegex = new RegExp(`\\s+${suffix}\\s*$`, 'i')
    normalized = normalized.replace(suffixRegex, '')
  })
  
  // 6. Supprimer les mots communs
  const stopWords = ['de', 'du', 'la', 'le', 'les', 'des', 'van', 'der', 'den', 'het', 'een', 'the', 'of', 'and']
  const words = normalized.split(/\s+/).filter(word => 
    word.length > 0 && !stopWords.includes(word)
  )
  normalized = words.join(' ')
  
  // 7. Normaliser les espaces multiples
  normalized = normalized.replace(/\s+/g, ' ').trim()
  
  return normalized
}

/**
 * Normalise une année (extrait YYYY depuis n'importe quel format)
 */
function normalizeYear(yearValue) {
  if (!yearValue) return null
  const yearStr = String(yearValue).trim()
  // Extraire les 4 premiers chiffres (format YYYY)
  const yearMatch = yearStr.match(/^(\d{4})/)
  return yearMatch ? yearMatch[1] : null
}

/**
 * Normalise un objet de données brut en objet Subside (identique à data-normalizer.ts)
 */
function normalizeSubsideData(item, year) {
  const data = item

  // Extraction du bénéficiaire
  const beneficiaire = String(
    data.beneficiaire_begunstigde || 
    data.nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie || 
    "Non spécifié"
  )

  // Extraction de l'article budgétaire
  const article = String(
    data.article_complet_volledig_artikel || 
    data.article_budgetaire_begrotingsartikel || 
    "Non spécifié"
  )

  // Extraction de l'objet
  const objet = String(
    data.l_objet_de_la_subvention_doel_van_de_subsidie || 
    data.objet_du_subside_doel_van_de_subsidie || 
    "Non spécifié"
  )

  // Extraction du nom de la subvention
  const nomSubside = String(
    data.nom_de_la_subvention_naam_van_de_subsidie || 
    data.nom_du_subside_naam_subsidie || 
    "Non spécifié"
  )

  // Extraction du montant octroyé
  const montant = parseAmount(
    data.montant_octroye_toegekend_bedrag || 
    data.budget_2019_begroting_2019
  )

  // Extraction du montant prévu
  const montantPrevu = parseAmount(
    data.montant_prevu_au_budget_2020_bedrag_voorzien_op_begroting_2020 ||
    data.montant_prevu_au_budget_2021_bedrag_voorzien_op_begroting_2021 ||
    data.montant_prevu_au_budget_2022_bedrag_voorzien_op_begroting_2022 ||
    data.montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023 ||
    data.montant_prevu_au_budget_2024_bedrag_voorzien_op_begroting_2024 ||
    data.budget_2019_begroting_2019
  )

  // Extraction de l'année de début (normalisée)
  const anneeDebutRaw = data.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend ||
    data.annee_budgetaire_debut_octroi_begroting_jaar_begin_toekenning ||
    year
  const anneeDebut = normalizeYear(anneeDebutRaw) || year

  // Extraction de l'année de fin (normalisée)
  const anneeFinRaw = data.l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend ||
    data.annee_budgetaire_fin_octroi_begroting_jaar_einde_van_toekenning ||
    (parseInt(year) + 1).toString()
  const anneeFin = normalizeYear(anneeFinRaw) || (parseInt(year) + 1).toString()

  // Extraction du numéro BCE
  const bceNumber = data.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie 
    ? String(data.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie)
    : (data.numero_bce_kbo_nummer ? String(data.numero_bce_kbo_nummer) : null)

  // Construction de l'objet normalisé
  return {
    nom_de_la_subvention_naam_van_de_subsidie: nomSubside,
    article_complet_volledig_artikel: article,
    beneficiaire_begunstigde: beneficiaire,
    le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie: bceNumber,
    l_objet_de_la_subvention_doel_van_de_subsidie: objet,
    montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023: montantPrevu,
    montant_octroye_toegekend_bedrag: montant,
    l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend: anneeDebut,
    l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend: anneeFin,
    // Champs pour compatibilité
    nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie: beneficiaire,
    article_budgetaire_begrotingsartikel: article,
    montant_prevu_au_budget_2021_bedrag_voorzien_op_begroting_2021: String(montantPrevu),
    // Flags de validation
    _validationStatus: 'valid',
    _originalYear: year,
    _normalizedYear: anneeDebut
  }
}

// ============================================================================
// FONCTIONS DE VALIDATION
// ============================================================================

/**
 * Valide un subside et retourne les problèmes détectés
 */
function validateSubside(subside) {
  const issues = {
    errors: [],
    warnings: []
  }

  // Vérifier le bénéficiaire
  if (!subside.beneficiaire_begunstigde || subside.beneficiaire_begunstigde === 'Non spécifié') {
    issues.warnings.push('Bénéficiaire manquant ou non spécifié')
  }

  // Vérifier le montant
  if (subside.montant_octroye_toegekend_bedrag <= 0) {
    issues.warnings.push('Montant invalide ou nul')
  }

  // Vérifier l'année
  if (!subside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend) {
    issues.warnings.push('Année de début manquante')
  }

  return issues
}

// ============================================================================
// FONCTIONS DE REGROUPEMENT
// ============================================================================

/**
 * Regroupe les bénéficiaires par numéro BCE
 */
function groupByBCE(subsides) {
  const groups = new Map()
  
  subsides.forEach((subside) => {
    const bce = subside.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie
    
    if (!bce || bce.trim() === '') {
      return
    }
    
    const bceKey = bce.trim()
    const existing = groups.get(bceKey)
    
    if (existing) {
      existing.originalNames.add(subside.beneficiaire_begunstigde)
      existing.count += 1
      existing.totalAmount += subside.montant_octroye_toegekend_bedrag
      existing.subsides.push(subside)
    } else {
      groups.set(bceKey, {
        key: bceKey,
        displayName: subside.beneficiaire_begunstigde,
        originalNames: new Set([subside.beneficiaire_begunstigde]),
        bceNumber: bceKey,
        count: 1,
        totalAmount: subside.montant_octroye_toegekend_bedrag,
        subsides: [subside]
      })
    }
  })
  
  return groups
}

/**
 * Regroupe les bénéficiaires par nom normalisé
 */
function groupByNormalizedName(subsides) {
  const groups = new Map()
  
  subsides.forEach((subside) => {
    const normalized = normalizeBeneficiaryName(subside.beneficiaire_begunstigde)
    
    if (!normalized) {
      return
    }
    
    const existing = groups.get(normalized)
    
    if (existing) {
      existing.originalNames.add(subside.beneficiaire_begunstigde)
      existing.count += 1
      existing.totalAmount += subside.montant_octroye_toegekend_bedrag
      existing.subsides.push(subside)
    } else {
      groups.set(normalized, {
        key: normalized,
        displayName: subside.beneficiaire_begunstigde,
        originalNames: new Set([subside.beneficiaire_begunstigde]),
        bceNumber: null,
        count: 1,
        totalAmount: subside.montant_octroye_toegekend_bedrag,
        subsides: [subside]
      })
    }
  })
  
  // Améliorer les noms d'affichage
  groups.forEach((group) => {
    if (group.originalNames.size > 1) {
      const names = Array.from(group.originalNames)
      names.sort((a, b) => a.length - b.length)
      group.displayName = names[0]
    }
  })
  
  return groups
}

/**
 * Combine le regroupement par BCE et par nom normalisé
 */
function groupBeneficiaries(subsides) {
  const bceGroups = groupByBCE(subsides)
  const normalizedGroups = groupByNormalizedName(subsides)
  const finalGroups = new Map()
  
  // Créer un Set des noms déjà dans un groupe BCE
  const namesInBCEGroups = new Set()
  bceGroups.forEach((group) => {
    group.originalNames.forEach(name => namesInBCEGroups.add(name))
  })
  
  // D'abord, ajouter tous les groupes avec BCE (priorité)
  bceGroups.forEach((group, bceKey) => {
    finalGroups.set(`bce:${bceKey}`, group)
  })
  
  // Ensuite, ajouter les groupes sans BCE (regroupés par normalisation)
  normalizedGroups.forEach((group, normalizedKey) => {
    let alreadyGrouped = false
    for (const name of group.originalNames) {
      if (namesInBCEGroups.has(name)) {
        alreadyGrouped = true
        break
      }
    }
    
    if (!alreadyGrouped) {
      finalGroups.set(`norm:${normalizedKey}`, group)
    }
  })
  
  return finalGroups
}

// ============================================================================
// FONCTIONS DE DÉTECTION DE DOUBLONS
// ============================================================================

/**
 * Détecte les doublons potentiels
 */
function detectDuplicates(subsides) {
  const duplicates = []
  const seen = new Map()
  
  subsides.forEach((subside, index) => {
    // Créer une clé unique basée sur bénéficiaire, montant, année, article
    const normalizedName = normalizeBeneficiaryName(subside.beneficiaire_begunstigde)
    const bce = subside.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie || ''
    const key = `${bce || normalizedName}|${subside.montant_octroye_toegekend_bedrag}|${subside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend}|${subside.article_complet_volledig_artikel}`
    
    if (seen.has(key)) {
      duplicates.push({
        original: seen.get(key),
        duplicate: index,
        key: key
      })
      // Marquer comme doublon potentiel
      subside._potentialDuplicate = true
    } else {
      seen.set(key, index)
    }
  })
  
  return duplicates
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

/**
 * Traite une année spécifique
 */
function processYear(year) {
  console.log(`\n📅 Traitement de l'année ${year}...`)
  
  const sourceFile = path.join(SOURCE_DIR, `data-${year}.json`)
  const outputFile = path.join(OUTPUT_DIR, `data-${year}-validated.json`)
  
  // Vérifier que le fichier source existe
  if (!fs.existsSync(sourceFile)) {
    console.log(`⚠️  Fichier source non trouvé: ${sourceFile}`)
    return null
  }
  
  // Charger les données
  console.log(`   📂 Chargement de ${sourceFile}...`)
  const rawData = JSON.parse(fs.readFileSync(sourceFile, 'utf8'))
  console.log(`   ✅ ${rawData.length} subsides chargés`)
  
  // Normaliser les données
  console.log(`   🔄 Normalisation...`)
  const normalizedData = rawData.map(item => normalizeSubsideData(item, year))
  console.log(`   ✅ ${normalizedData.length} subsides normalisés`)
  
  // Valider les données
  console.log(`   ✔️  Validation...`)
  const validationResults = normalizedData.map(subside => validateSubside(subside))
  const totalWarnings = validationResults.reduce((sum, r) => sum + r.warnings.length, 0)
  const totalErrors = validationResults.reduce((sum, r) => sum + r.errors.length, 0)
  console.log(`   ✅ Validation terminée: ${totalWarnings} avertissements, ${totalErrors} erreurs`)
  
  // Regrouper les bénéficiaires
  console.log(`   👥 Regroupement des bénéficiaires...`)
  const groups = groupBeneficiaries(normalizedData)
  console.log(`   ✅ ${groups.size} groupes de bénéficiaires créés`)
  
  // Détecter les doublons
  console.log(`   🔍 Détection des doublons...`)
  const duplicates = detectDuplicates(normalizedData)
  console.log(`   ✅ ${duplicates.length} doublons potentiels détectés`)
  
  // Statistiques
  const stats = {
    year: year,
    sourceFile: sourceFile,
    totalSubsides: normalizedData.length,
    totalBeneficiaries: groups.size,
    totalAmount: normalizedData.reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0),
    withBCE: normalizedData.filter(s => s.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie).length,
    warnings: totalWarnings,
    errors: totalErrors,
    duplicates: duplicates.length,
    groups: Array.from(groups.values()).map(g => ({
      displayName: g.displayName,
      originalNames: Array.from(g.originalNames),
      bceNumber: g.bceNumber,
      count: g.count,
      totalAmount: g.totalAmount
    }))
  }
  
  // Sauvegarder les données validées (si pas en dry-run)
  if (!DRY_RUN) {
    console.log(`   💾 Sauvegarde de ${outputFile}...`)
    fs.writeFileSync(outputFile, JSON.stringify(normalizedData, null, 2), 'utf8')
    console.log(`   ✅ Fichier sauvegardé`)
  } else {
    console.log(`   🔍 [DRY-RUN] Fichier serait sauvegardé: ${outputFile}`)
  }
  
  return {
    data: normalizedData,
    stats: stats,
    duplicates: duplicates,
    validationResults: validationResults
  }
}

/**
 * Vérifie spécifiquement "Seven Shelters" dans les données
 */
function checkSevenShelters(results) {
  console.log(`\n🔍 Vérification spécifique pour "Seven Shelters"...`)
  
  const sevenSheltersData = []
  
  results.forEach(result => {
    if (!result) return
    
    const searchTerms = ['seven shelters', 'seven-shelters', 'sevenshelters']
    const normalizedSearch = normalizeBeneficiaryName('Seven Shelters')
    
    result.data.forEach(subside => {
      const beneficiaryLower = subside.beneficiaire_begunstigde.toLowerCase()
      const beneficiaryNormalized = normalizeBeneficiaryName(subside.beneficiaire_begunstigde)
      
      if (searchTerms.some(term => beneficiaryLower.includes(term)) || 
          beneficiaryNormalized === normalizedSearch) {
        sevenSheltersData.push({
          year: subside._originalYear,
          beneficiary: subside.beneficiaire_begunstigde,
          normalized: beneficiaryNormalized,
          amount: subside.montant_octroye_toegekend_bedrag,
          year_normalized: subside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend,
          bce: subside.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie
        })
      }
    })
  })
  
  // Regrouper par année
  const byYear = {}
  sevenSheltersData.forEach(item => {
    const year = item.year_normalized || item.year
    if (!byYear[year]) {
      byYear[year] = []
    }
    byYear[year].push(item)
  })
  
  console.log(`   ✅ ${sevenSheltersData.length} subsides trouvés pour "Seven Shelters"`)
  
  Object.keys(byYear).sort().forEach(year => {
    const items = byYear[year]
    const total = items.reduce((sum, item) => sum + item.amount, 0)
    const uniqueNames = new Set(items.map(item => item.beneficiaire))
    console.log(`   📅 ${year}: ${items.length} subsides, ${total.toLocaleString('fr-BE')} EUR, ${uniqueNames.size} variante(s) de nom`)
    uniqueNames.forEach(name => {
      const count = items.filter(item => item.beneficiaire === name).length
      const amount = items.filter(item => item.beneficiaire === name).reduce((sum, item) => sum + item.amount, 0)
      console.log(`      - "${name}": ${count} subside(s), ${amount.toLocaleString('fr-BE')} EUR`)
    })
  })
  
  return {
    total: sevenSheltersData.length,
    totalAmount: sevenSheltersData.reduce((sum, item) => sum + item.amount, 0),
    byYear: byYear,
    allItems: sevenSheltersData
  }
}

/**
 * Génère le rapport de validation
 */
function generateReport(results) {
  console.log(`\n📊 Génération du rapport...`)
  
  // Créer le dossier reports s'il n'existe pas
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true })
  }
  
  // Vérification spécifique pour Seven Shelters
  const sevenSheltersCheck = checkSevenShelters(results)
  
  const report = {
    timestamp: new Date().toISOString(),
    dryRun: DRY_RUN,
    summary: {
      totalYears: results.length,
      totalSubsides: results.reduce((sum, r) => sum + (r ? r.stats.totalSubsides : 0), 0),
      totalBeneficiaries: results.reduce((sum, r) => sum + (r ? r.stats.totalBeneficiaries : 0), 0),
      totalAmount: results.reduce((sum, r) => sum + (r ? r.stats.totalAmount : 0), 0),
      totalWarnings: results.reduce((sum, r) => sum + (r ? r.stats.warnings : 0), 0),
      totalErrors: results.reduce((sum, r) => sum + (r ? r.stats.errors : 0), 0),
      totalDuplicates: results.reduce((sum, r) => sum + (r ? r.stats.duplicates : 0), 0)
    },
    byYear: results.filter(r => r !== null).map(r => r.stats),
    duplicates: results.filter(r => r !== null).flatMap(r => r.duplicates),
    groups: results.filter(r => r !== null).flatMap(r => r.stats.groups),
    sevenShelters: sevenSheltersCheck
  }
  
  // Rapport JSON
  const jsonReportPath = path.join(REPORT_DIR, 'validation-report.json')
  if (!DRY_RUN) {
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2), 'utf8')
    console.log(`   ✅ Rapport JSON: ${jsonReportPath}`)
  } else {
    console.log(`   🔍 [DRY-RUN] Rapport JSON serait créé: ${jsonReportPath}`)
  }
  
  // Rapport Markdown
  const mdReportPath = path.join(REPORT_DIR, 'validation-report.md')
  const mdReport = generateMarkdownReport(report)
  if (!DRY_RUN) {
    fs.writeFileSync(mdReportPath, mdReport, 'utf8')
    console.log(`   ✅ Rapport Markdown: ${mdReportPath}`)
  } else {
    console.log(`   🔍 [DRY-RUN] Rapport Markdown serait créé: ${mdReportPath}`)
  }
  
  // Afficher le résumé dans la console
  console.log(`\n📈 Résumé:`)
  console.log(`   - Années traitées: ${report.summary.totalYears}`)
  console.log(`   - Total subsides: ${report.summary.totalSubsides}`)
  console.log(`   - Total bénéficiaires: ${report.summary.totalBeneficiaries}`)
  console.log(`   - Montant total: ${report.summary.totalAmount.toLocaleString('fr-BE')} EUR`)
  console.log(`   - Avertissements: ${report.summary.totalWarnings}`)
  console.log(`   - Erreurs: ${report.summary.totalErrors}`)
  console.log(`   - Doublons potentiels: ${report.summary.totalDuplicates}`)
  
  return report
}

/**
 * Génère le rapport Markdown
 */
function generateMarkdownReport(report) {
  let md = `# Rapport de Validation des Données de Subsides\n\n`
  md += `**Date:** ${new Date(report.timestamp).toLocaleString('fr-BE')}\n`
  md += `**Mode:** ${report.dryRun ? 'DRY-RUN (simulation)' : 'Production'}\n\n`
  
  md += `## Résumé Global\n\n`
  md += `- **Années traitées:** ${report.summary.totalYears}\n`
  md += `- **Total subsides:** ${report.summary.totalSubsides}\n`
  md += `- **Total bénéficiaires:** ${report.summary.totalBeneficiaries}\n`
  md += `- **Montant total:** ${report.summary.totalAmount.toLocaleString('fr-BE')} EUR\n`
  md += `- **Avertissements:** ${report.summary.totalWarnings}\n`
  md += `- **Erreurs:** ${report.summary.totalErrors}\n`
  md += `- **Doublons potentiels:** ${report.summary.totalDuplicates}\n\n`
  
  md += `## Détails par Année\n\n`
  report.byYear.forEach(stat => {
    md += `### ${stat.year}\n\n`
    md += `- **Subsides:** ${stat.totalSubsides}\n`
    md += `- **Bénéficiaires:** ${stat.totalBeneficiaries}\n`
    md += `- **Montant total:** ${stat.totalAmount.toLocaleString('fr-BE')} EUR\n`
    md += `- **Avec BCE:** ${stat.withBCE}/${stat.totalSubsides}\n`
    md += `- **Avertissements:** ${stat.warnings}\n`
    md += `- **Erreurs:** ${stat.errors}\n`
    md += `- **Doublons:** ${stat.duplicates}\n\n`
  })
  
  if (report.sevenShelters && report.sevenShelters.total > 0) {
    md += `## Vérification "Seven Shelters"\n\n`
    md += `- **Total subsides trouvés:** ${report.sevenShelters.total}\n`
    md += `- **Montant total:** ${report.sevenShelters.totalAmount.toLocaleString('fr-BE')} EUR\n\n`
    md += `### Par Année\n\n`
    Object.keys(report.sevenShelters.byYear).sort().forEach(year => {
      const items = report.sevenShelters.byYear[year]
      const total = items.reduce((sum, item) => sum + item.amount, 0)
      md += `#### ${year}\n\n`
      md += `- **Subsides:** ${items.length}\n`
      md += `- **Montant total:** ${total.toLocaleString('fr-BE')} EUR\n`
      md += `- **Variantes de nom:** ${new Set(items.map(item => item.beneficiaire)).size}\n\n`
    })
  }
  
  if (report.duplicates.length > 0) {
    md += `## Doublons Potentiels\n\n`
    md += `⚠️ ${report.duplicates.length} doublons potentiels détectés. Vérification manuelle recommandée.\n\n`
  }
  
  return md
}

/**
 * Fonction principale
 */
function main() {
  console.log('🚀 Script de Retraitement et Validation des Données')
  console.log(`Mode: ${DRY_RUN ? 'DRY-RUN (simulation)' : 'Production'}`)
  if (YEAR_FILTER) {
    console.log(`Filtre année: ${YEAR_FILTER}`)
  }
  
  const yearsToProcess = YEAR_FILTER ? [YEAR_FILTER] : YEARS
  
  const results = yearsToProcess.map(year => processYear(year))
  
  generateReport(results)
  
  console.log(`\n✅ Traitement terminé!`)
  if (DRY_RUN) {
    console.log(`\n💡 Pour appliquer les changements, relancez sans --dry-run`)
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main()
}

module.exports = {
  processYear,
  normalizeSubsideData,
  normalizeBeneficiaryName,
  normalizeYear,
  groupBeneficiaries,
  detectDuplicates
}

