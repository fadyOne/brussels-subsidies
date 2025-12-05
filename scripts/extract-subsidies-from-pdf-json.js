#!/usr/bin/env node

/**
 * Script pour extraire les subsides depuis le JSON d'un PDF
 * et générer un fichier au format data-2025.json
 */

const fs = require('fs')
const path = require('path')

// Chemin vers le JSON du PDF
const PDF_JSON_PATH = path.join(__dirname, '../data/pdfs/json/23062025/Documents du 23-06-2025/072_Liste_20des_20Transferts_20Budget_202025.json')
const OUTPUT_PATH = path.join(__dirname, '../public/data-2025-from-pdf.json')

function parseAmount(amountStr) {
  if (!amountStr) return 0
  // Enlever les espaces et remplacer la virgule par un point
  const cleaned = amountStr.toString().replace(/\s/g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

function extractSubsidesFromText(text) {
  const subsides = []
  
  // Pattern pour extraire les lignes de subsides
  // Format: NuméroPersonne | Bénéficiaire | Statut | Échevin | Objet | Montant | Article
  const lines = text.split('\n')
  
  let currentArticle = null
  let currentDept = null
  let currentCompetence = null
  let currentEchevin = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Détecter l'article budgétaire (format: 56110/33202)
    const articleMatch = line.match(/(\d{5}\/\d{5})/)
    if (articleMatch) {
      currentArticle = articleMatch[1]
    }
    
    // Détecter le département (format: "10\nCulture, Sport")
    if (line.match(/^\d+\n/)) {
      const deptMatch = line.match(/^(\d+)/)
      if (deptMatch) {
        currentDept = deptMatch[1]
      }
    }
    
    // Détecter la compétence (TOURISME, etc.)
    if (line.includes('TOURISME') || line.includes('CULTURE') || line.includes('SPORT')) {
      currentCompetence = line.trim()
    }
    
    // Détecter l'échevin (MME HOUBA, etc.)
    if (line.includes('MME ') || line.includes('MR ') || line.includes('DHR ')) {
      const echevinMatch = line.match(/(MME|MR|DHR)\s+([A-Z]+)/)
      if (echevinMatch) {
        currentEchevin = line.trim()
      }
    }
    
    // Pattern pour détecter une ligne de subside
    // Format: NuméroPersonne | Nom Bénéficiaire | Statut | Échevin | Objet | Montant
    // Exemple: "155152\nBrussels Major Events, en abrégé \nBME\nASBL communale"
    
    // Chercher les numéros BCE (6 chiffres) suivis d'un nom
    const bceMatch = line.match(/^(\d{6})([A-Za-z].*?)(ASBL|VZW|Association|SA|SPRL|SCRL|Fabrique|Kerkfabriek|Etablissement|Instelling)/)
    
    if (bceMatch && currentArticle) {
      const bceNumber = bceMatch[1]
      const beneficiaireStart = bceMatch[2].trim()
      const statut = bceMatch[3]
      
      // Chercher le montant dans les lignes suivantes (format: 1.804.000,00 ou 150.000,00)
      let montant = 0
      let objet = ''
      
      // Regarder les 5 lignes suivantes pour trouver le montant et l'objet
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const nextLine = lines[j]
        
        // Chercher un montant (format avec virgule: 1.804.000,00)
        const montantMatch = nextLine.match(/(\d{1,3}(?:\.\d{3})*,\d{2})/)
        if (montantMatch && !montant) {
          montant = parseAmount(montantMatch[1])
        }
        
        // L'objet est généralement entre le bénéficiaire et le montant
        if (nextLine.trim() && !nextLine.match(/^\d/) && !nextLine.includes('ASBL') && !nextLine.includes('VZW') && !nextLine.match(/\d{5}\/\d{5}/)) {
          if (!objet && nextLine.trim().length > 5) {
            objet = nextLine.trim()
          }
        }
        
        // Si on trouve un nouvel article, on arrête
        if (nextLine.match(/\d{5}\/\d{5}/)) {
          break
        }
      }
      
      // Reconstruire le nom complet du bénéficiaire (peut être sur plusieurs lignes)
      let beneficiaire = beneficiaireStart
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j]
        if (nextLine.match(/^(ASBL|VZW|Association|SA|SPRL|SCRL|Fabrique|Kerkfabriek)/)) {
          break
        }
        if (nextLine.trim() && !nextLine.match(/^\d/) && !nextLine.includes('MME') && !nextLine.includes('MR')) {
          beneficiaire += ' ' + nextLine.trim()
        }
      }
      beneficiaire = beneficiaire.trim()
      
      // Nettoyer le bénéficiaire
      beneficiaire = beneficiaire
        .replace(/\s+/g, ' ')
        .replace(/, en abrégé.*$/i, '')
        .trim()
      
      if (beneficiaire && montant > 0 && currentArticle) {
        subsides.push({
          article_budgetaire_begrotingsartikel: currentArticle,
          nom_de_la_subvention_naam_van_de_subsidie: "Subside budget ordinaire – Toelage gewone begroting",
          nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie: beneficiaire,
          le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie: bceNumber || "",
          objet_du_subside_doel_van_de_subsidie: objet || "",
          montant_prevu_au_budget_2025_bedrag_voorzien_op_begroting_2025: montant,
          montant_octroye_toegekend_bedrag: montant,
          l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend: "2025",
          l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend: "2025"
        })
      }
    }
  }
  
  return subsides
}

function main() {
  console.log('📄 Lecture du JSON du PDF...')
  
  if (!fs.existsSync(PDF_JSON_PATH)) {
    console.error(`❌ Fichier non trouvé: ${PDF_JSON_PATH}`)
    process.exit(1)
  }
  
  const pdfData = JSON.parse(fs.readFileSync(PDF_JSON_PATH, 'utf8'))
  const fullText = pdfData.content.fullText
  
  console.log(`📊 Extraction des subsides depuis le texte (${fullText.length} caractères)...`)
  
  const subsides = extractSubsidesFromText(fullText)
  
  console.log(`✅ ${subsides.length} subsides extraits`)
  
  // Afficher quelques exemples
  console.log('\n📋 Exemples de subsides extraits:')
  subsides.slice(0, 5).forEach((sub, i) => {
    console.log(`\n${i + 1}. ${sub.nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie}`)
    console.log(`   Article: ${sub.article_budgetaire_begrotingsartikel}`)
    console.log(`   Montant: ${sub.montant_octroye_toegekend_bedrag.toLocaleString('fr-BE')} EUR`)
    console.log(`   Objet: ${sub.objet_du_subside_doel_van_de_subsidie || 'N/A'}`)
  })
  
  // Sauvegarder
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(subsides, null, 2), 'utf8')
  console.log(`\n💾 Fichier sauvegardé: ${OUTPUT_PATH}`)
  console.log(`📊 Total: ${subsides.length} subsides`)
  
  // Statistiques
  const totalMontant = subsides.reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0)
  console.log(`💰 Montant total: ${totalMontant.toLocaleString('fr-BE')} EUR`)
  
  const articles = [...new Set(subsides.map(s => s.article_budgetaire_begrotingsartikel))]
  console.log(`📑 Articles budgétaires uniques: ${articles.length}`)
}

if (require.main === module) {
  main()
}

module.exports = { extractSubsidesFromText }

