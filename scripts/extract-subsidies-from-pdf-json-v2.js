#!/usr/bin/env node

/**
 * Script amélioré pour extraire les subsides depuis le JSON d'un PDF
 * Version 2 - Parsing amélioré du format tabulaire
 */

const fs = require('fs')
const path = require('path')

const PDF_JSON_PATH = path.join(__dirname, '../data/pdfs/json/23062025/Documents du 23-06-2025/072_Liste_20des_20Transferts_20Budget_202025.json')
const OUTPUT_PATH = path.join(__dirname, '../public/data-2025-from-pdf-v2.json')

function parseAmount(amountStr) {
  if (!amountStr) return 0
  // Format: 1.804.000,00 ou 150.000,00
  const cleaned = amountStr.toString()
    .replace(/\s/g, '')
    .replace(/\./g, '') // Enlever les points (séparateurs de milliers)
    .replace(',', '.')  // Remplacer la virgule par un point
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

function extractSubsidesFromText(text) {
  const subsides = []
  
  // Diviser le texte en sections par article budgétaire
  const articleSections = text.split(/(\d{5}\/\d{5})/g)
  
  for (let i = 0; i < articleSections.length - 1; i += 2) {
    const article = articleSections[i + 1]
    const sectionText = articleSections[i + 2] || ''
    
    if (!article || !article.match(/^\d{5}\/\d{5}$/)) continue
    
    // Chercher les bénéficiaires dans cette section
    // Pattern amélioré: Numéro BCE (6 chiffres) suivi du nom du bénéficiaire
    // On cherche aussi les cas sans numéro BCE (Divers bénéficiaires, etc.)
    const patterns = [
      // Pattern avec numéro BCE (6 chiffres)
      /(\d{6})\s*([A-Z][^\n]{5,100}?)(?:ASBL|VZW|Association|SA|SPRL|SCRL|Fabrique|Kerkfabriek|Etablissement|Instelling|communale|Gemeentelijke|de fait|Feitelijke)/g,
      // Pattern pour "Divers bénéficiaires" sans numéro BCE
      /(Divers bénéficiaires|Meerdere begunstigden|Divers bénéficiaires \/ Meerdere begunstigden)/gi
    ]
    
    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(sectionText)) !== null) {
        const bceNumber = match[1] || ""
        let beneficiaire = (match[2] || match[1] || "").trim()
        
        // Nettoyer le nom du bénéficiaire
        beneficiaire = beneficiaire
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/, en abrégé.*$/i, '')
          .replace(/\s*-\s*$/, '')
          .replace(/\s*ASBL\s*-\s*VZW.*$/i, '')
          .replace(/\s*VZW.*$/i, '')
          .trim()
        
        // Chercher le montant dans un rayon plus large (30 lignes)
        const matchIndex = match.index
        const searchStart = Math.max(0, matchIndex - 500)
        const searchEnd = Math.min(sectionText.length, matchIndex + match[0].length + 2000)
        const searchArea = sectionText.substring(searchStart, searchEnd)
        const lines = searchArea.split('\n')
        
        let montant = 0
        let foundMontant = false
        
        // Chercher le montant dans les lignes autour du match
        for (let j = 0; j < lines.length; j++) {
          const line = lines[j]
          
          // Chercher un montant (format: 1.804.000,00 ou 150.000,00 ou 4.115.000,00)
          if (!foundMontant) {
            // Pattern amélioré pour les montants
            const montantPatterns = [
              /(\d{1,3}(?:\.\d{3})*,\d{2})/,  // Format standard: 1.804.000,00
              /(\d{1,3}(?:\.\d{3})*\.\d{2})/, // Format alternatif: 1.804.000.00
              /(\d+,\d{2})/,                   // Format simple: 150000,00
            ]
            
            for (const mp of montantPatterns) {
              const montantMatch = line.match(mp)
              if (montantMatch) {
                const parsed = parseAmount(montantMatch[1])
                // Filtrer les montants trop petits (probablement des numéros de page) ou trop grands
                if (parsed >= 100 && parsed <= 100000000) {
                  montant = parsed
                  foundMontant = true
                  break
                }
              }
            }
          }
          
          // Si on trouve un nouveau numéro BCE ou un nouvel article, on arrête
          if (line.match(/^\d{6}/) && j > 5) {
            break
          }
          if (line.match(/\d{5}\/\d{5}/) && j > 5) {
            break
          }
        }
        
        // Si on a trouvé un bénéficiaire et un montant valide
        if (beneficiaire && montant > 0 && beneficiaire.length > 2) {
          // Filtrer les faux positifs
          if (!beneficiaire.match(/^(Subsides|Subsidies|Total|Totaal|Page|Blz|BUDGET|BEGROTING|DEPENSES|VERPLICHTE)/i)) {
            subsides.push({
              article_budgetaire_begrotingsartikel: article,
              nom_de_la_subvention_naam_van_de_subsidie: "Subside budget ordinaire – Toelage gewone begroting",
              nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie: beneficiaire,
              le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie: bceNumber || "",
              objet_du_subside_doel_van_de_subsidie: "", // On complétera plus tard
              montant_prevu_au_budget_2025_bedrag_voorzien_op_begroting_2025: montant,
              montant_octroye_toegekend_bedrag: montant,
              l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend: "2025",
              l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend: "2025"
            })
          }
        }
      }
    }
  }
  
  // Dédupliquer (même bénéficiaire, même article, même montant)
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
  
  console.log(`📊 Extraction des subsides depuis le texte (${fullText.length} caractères)...`)
  
  const subsides = extractSubsidesFromText(fullText)
  
  console.log(`✅ ${subsides.length} subsides extraits (après déduplication)`)
  
  // Afficher quelques exemples
  console.log('\n📋 Exemples de subsides extraits:')
  subsides.slice(0, 10).forEach((sub, i) => {
    console.log(`\n${i + 1}. ${sub.nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie}`)
    console.log(`   Article: ${sub.article_budgetaire_begrotingsartikel}`)
    console.log(`   Montant: ${sub.montant_octroye_toegekend_bedrag.toLocaleString('fr-BE')} EUR`)
    if (sub.objet_du_subside_doel_van_de_subsidie) {
      console.log(`   Objet: ${sub.objet_du_subside_doel_van_de_subsidie}`)
    }
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
  
  // Statistiques par article
  console.log('\n📊 Répartition par article budgétaire:')
  const byArticle = {}
  subsides.forEach(s => {
    const art = s.article_budgetaire_begrotingsartikel
    if (!byArticle[art]) {
      byArticle[art] = { count: 0, total: 0 }
    }
    byArticle[art].count++
    byArticle[art].total += s.montant_octroye_toegekend_bedrag
  })
  
  Object.entries(byArticle)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .forEach(([art, stats]) => {
      console.log(`   ${art}: ${stats.count} subsides, ${stats.total.toLocaleString('fr-BE')} EUR`)
    })
}

if (require.main === module) {
  main()
}

module.exports = { extractSubsidesFromText }

