#!/usr/bin/env node

/**
 * Script simplifié pour extraire bénéficiaire, montant et numéro BCE
 * Version optimisée pour l'essentiel
 */

const fs = require('fs')
const path = require('path')

const PDF_JSON_PATH = path.join(__dirname, '../data/pdfs/json/23062025/Documents du 23-06-2025/072_Liste_20des_20Transferts_20Budget_202025.json')
const OUTPUT_PATH = path.join(__dirname, '../public/data-2025-from-pdf-simple.json')

function parseAmount(amountStr) {
  if (!amountStr) return 0
  const cleaned = amountStr.toString()
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

function extractSubsidesFromText(text) {
  const subsides = []
  
  // Diviser par articles budgétaires
  const articleSections = text.split(/(\d{5}\/\d{5})/g)
  
  for (let i = 0; i < articleSections.length - 1; i += 2) {
    const article = articleSections[i + 1]
    const sectionText = articleSections[i + 2] || ''
    
    if (!article || !article.match(/^\d{5}\/\d{5}$/)) continue
    
    // Pattern principal: Numéro BCE (6 chiffres) + Nom (jusqu'à ASBL/VZW/etc) + Montant dans les lignes suivantes
    // On cherche dans une fenêtre de texte autour de chaque match
    const bcePattern = /(\d{6})\s*([A-Z][^\n]{5,100}?)(?:ASBL|VZW|Association|SA|SPRL|SCRL|Fabrique|Kerkfabriek|Etablissement|Instelling|communale|Gemeentelijke|de fait|Feitelijke)/g
    
    let match
    while ((match = bcePattern.exec(sectionText)) !== null) {
      const bceNumber = match[1]
      let beneficiaire = match[2].trim()
      
      // Nettoyer le nom
      beneficiaire = beneficiaire
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/, en abrégé.*$/i, '')
        .replace(/\s*-\s*$/, '')
        .replace(/\s*ASBL\s*-\s*VZW.*$/i, '')
        .replace(/\s*VZW.*$/i, '')
        .trim()
      
      // Chercher le montant dans une zone de 2000 caractères après le match
      const matchEnd = match.index + match[0].length
      const searchArea = sectionText.substring(matchEnd, matchEnd + 2000)
      
      // Chercher tous les montants possibles dans cette zone
      const montantPattern = /(\d{1,3}(?:\.\d{3})*,\d{2})/g
      let montant = 0
      let montantMatches = []
      
      let m
      while ((m = montantPattern.exec(searchArea)) !== null) {
        const parsed = parseAmount(m[1])
        // Filtrer les montants raisonnables (entre 100 et 100 millions)
        if (parsed >= 100 && parsed <= 100000000) {
          montantMatches.push({ value: parsed, index: m.index })
        }
      }
      
      // Prendre le premier montant valide trouvé
      if (montantMatches.length > 0) {
        montant = montantMatches[0].value
      }
      
      // Filtrer les faux positifs
      if (beneficiaire && 
          montant > 0 && 
          beneficiaire.length > 2 &&
          !beneficiaire.match(/^(Subsides|Subsidies|Total|Totaal|Page|Blz|BUDGET|BEGROTING|DEPENSES|VERPLICHTE|Article|Volledig)/i)) {
        
        subsides.push({
          article_budgetaire_begrotingsartikel: article,
          nom_de_la_subvention_naam_van_de_subsidie: "Subside budget ordinaire – Toelage gewone begroting",
          nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie: beneficiaire,
          le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie: bceNumber,
          objet_du_subside_doel_van_de_subsidie: "", // À compléter plus tard
          montant_prevu_au_budget_2025_bedrag_voorzien_op_begroting_2025: montant,
          montant_octroye_toegekend_bedrag: montant,
          l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend: "2025",
          l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend: "2025"
        })
      }
    }
  }
  
  // Dédupliquer
  const seen = new Set()
  const unique = []
  
  for (const sub of subsides) {
    const key = `${sub.article_budgetaire_begrotingsartikel}|${sub.nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie}|${sub.montant_octroye_toegekend_bedrag}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(sub)
    }
  }
  
  return unique
}

function main() {
  console.log('📄 Lecture du JSON du PDF...')
  
  if (!fs.existsSync(PDF_JSON_PATH)) {
    console.error(`❌ Fichier non trouvé: ${PDF_JSON_PATH}`)
    process.exit(1)
  }
  
  const pdfData = JSON.parse(fs.readFileSync(PDF_JSON_PATH, 'utf8'))
  const fullText = pdfData.content.fullText
  
  console.log(`📊 Extraction des subsides (focus: bénéficiaire, montant, BCE)...`)
  
  const subsides = extractSubsidesFromText(fullText)
  
  console.log(`✅ ${subsides.length} subsides extraits`)
  
  // Statistiques
  const withBCE = subsides.filter(s => s.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie).length
  const totalMontant = subsides.reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0)
  
  console.log(`\n📊 Statistiques:`)
  console.log(`   - Avec numéro BCE: ${withBCE}/${subsides.length}`)
  console.log(`   - Montant total: ${totalMontant.toLocaleString('fr-BE')} EUR`)
  
  // Exemples pour 56110/33202
  const subs56110 = subsides.filter(s => s.article_budgetaire_begrotingsartikel === '56110/33202')
  console.log(`\n📋 Exemples pour 56110/33202 (${subs56110.length} subsides):`)
  subs56110.slice(0, 10).forEach((sub, i) => {
    console.log(`   ${i+1}. ${sub.nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie} | BCE: ${sub.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie || 'N/A'} | ${sub.montant_octroye_toegekend_bedrag.toLocaleString('fr-BE')} EUR`)
  })
  
  // Sauvegarder
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(subsides, null, 2), 'utf8')
  console.log(`\n💾 Fichier sauvegardé: ${OUTPUT_PATH}`)
}

if (require.main === module) {
  main()
}

module.exports = { extractSubsidesFromText }

