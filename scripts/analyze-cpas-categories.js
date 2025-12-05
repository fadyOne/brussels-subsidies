#!/usr/bin/env node

/**
 * Script d'analyse : Vérifier les catégories des subsides pour les CPAS
 * 
 * Ce script analyse les fichiers JSON pour comprendre pourquoi les CPAS
 * apparaissent dans "Musique & Festivals" au lieu de "Social"
 */

const fs = require('fs')
const path = require('path')

// Fonction pour normaliser les noms (copie de la logique de l'app)
function normalizeBeneficiaryName(name) {
  let normalized = name.toLowerCase().trim()
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  normalized = normalized.replace(/\b(c\.p\.a\.s\.|cpas)\b/g, 'cpas')
  normalized = normalized.replace(/\b(o\.c\.m\.w\.|ocmw)\b/g, 'cpas')
  normalized = normalized.replace(/\b(centre public d'action sociale)\b/g, 'cpas')
  normalized = normalized.replace(/\b(openbaar centrum voor maatschappelijk welzijn)\b/g, 'cpas')
  normalized = normalized.replace(/[\/\-\|]/g, ' ')
  normalized = normalized.replace(/\s+/g, ' ')
  return normalized.trim()
}

// Fonction pour catégoriser les subsides (copie de la logique de l'app)
function categorizeSubside(objet) {
  if (!objet) return 'Autre'
  const obj = objet.toLowerCase()
  
  // Sport
  if (obj.includes('sport') || obj.includes('football') || obj.includes('basketball') || 
      obj.includes('natation') || obj.includes('judo') || obj.includes('tennis') || 
      obj.includes('padel') || obj.includes('course') || obj.includes('athlétisme') ||
      obj.includes('cyclisme') || obj.includes('rugby') || obj.includes('volley') ||
      obj.includes('boxing') || obj.includes('karate') || obj.includes('taekwondo') ||
      obj.includes('hockey') || obj.includes('pétanque') || obj.includes('diving') ||
      obj.includes('synchro') || obj.includes('futsal') || obj.includes('gym')) {
    return 'Sport'
  }
  
  // Musique & Festivals (priorité car plus spécifique)
  if (obj.includes('festival') || obj.includes('musique') || obj.includes('jazz') || 
      obj.includes('concert') || obj.includes('briff') || obj.includes('bsff') ||
      obj.includes('lumières') || obj.includes('midis') || obj.includes('minimes') ||
      obj.includes('musicorum')) {
    return 'Musique & Festivals'
  }
  
  // Arts Visuels
  if (obj.includes('art') || obj.includes('exposition') || obj.includes('musée') ||
      obj.includes('woodblocks')) {
    return 'Arts Visuels'
  }
  
  // Spectacle & Cinéma
  if (obj.includes('théâtre') || obj.includes('spectacle') || obj.includes('cinéma') ||
      obj.includes('film') || obj.includes('cinémathèque')) {
    return 'Spectacle & Cinéma'
  }
  
  // Littérature
  if (obj.includes('littérature') || obj.includes('bibliothèque')) {
    return 'Littérature'
  }
  
  // Danse
  if (obj.includes('danse')) {
    return 'Danse'
  }
  
  // Culture (général)
  if (obj.includes('culture') || obj.includes('ommegang')) {
    return 'Culture'
  }
  
  // Social
  if (obj.includes('social') || obj.includes('égalité') || obj.includes('chances') || 
      obj.includes('handicap') || obj.includes('seniors') || obj.includes('jeunesse') || 
      obj.includes('famille') || obj.includes('solidarité') || obj.includes('insertion') ||
      obj.includes('prévention') || obj.includes('aide') || obj.includes('accompagnement') ||
      obj.includes('pride') || obj.includes('lgbt') || obj.includes('rainbow') ||
      obj.includes('droits') || obj.includes('femmes') || obj.includes('braderies') ||
      obj.includes('sécurité') || obj.includes('oeuvres') || obj.includes('sociaux')) {
    return 'Social'
  }
  
  // Environnement
  if (obj.includes('environnement') || obj.includes('climat') || obj.includes('biodiversité') || 
      obj.includes('vert') || obj.includes('nature') || obj.includes('écologie') ||
      obj.includes('développement durable') || obj.includes('énergie') || obj.includes('recyclage') ||
      obj.includes('earth') || obj.includes('hour') || obj.includes('alimentation') ||
      obj.includes('durable') || obj.includes('insectes') || obj.includes('hôtels') ||
      obj.includes('vaisselle') || obj.includes('réemployable') || obj.includes('herbruikbaar')) {
    return 'Environnement'
  }
  
  // Éducation
  if (obj.includes('école') || obj.includes('éducation') || obj.includes('formation') || 
      obj.includes('apprentissage') || obj.includes('enseignement') || obj.includes('pédagogie') ||
      obj.includes('étudiant') || obj.includes('université') || obj.includes('recherche') ||
      obj.includes('scientifique') || obj.includes('devoirs') || obj.includes('vormingen') ||
      obj.includes('vsd') || obj.includes('opleiding') || obj.includes('vélo') ||
      obj.includes('fietsevenementen') || obj.includes('pairs') || obj.includes('sexuelle')) {
    return 'Éducation'
  }
  
  // Santé
  if (obj.includes('santé') || obj.includes('hôpital') || obj.includes('médical') || 
      obj.includes('soins') || obj.includes('bien-être') || obj.includes('médecine') ||
      obj.includes('pharmacie') || obj.includes('psychologie') || obj.includes('mental') ||
      obj.includes('repos') || obj.includes('verzorging') || obj.includes('schuldenlast')) {
    return 'Santé'
  }
  
  // Économie
  if (obj.includes('économie') || obj.includes('emploi') || obj.includes('entreprise') || 
      obj.includes('développement économique') || obj.includes('innovation') || obj.includes('startup') ||
      obj.includes('commerce') || obj.includes('tourisme') || obj.includes('made') ||
      obj.includes('versailles') || obj.includes('congrès') || obj.includes('mini-entreprises') ||
      obj.includes('promotion') || obj.includes('toerisme')) {
    return 'Économie'
  }
  
  // Quartier/Urbanisme
  if (obj.includes('quartier') || obj.includes('contrat') || obj.includes('urbanisme') || 
      obj.includes('logement') || obj.includes('infrastructure') || obj.includes('mobilité') ||
      obj.includes('durable') || obj.includes('rénovation') || obj.includes('urbaine') ||
      obj.includes('balades') || obj.includes('urbaines') || obj.includes('littéraires') ||
      obj.includes('plaisirs') || obj.includes('hiver') || obj.includes('winterpret')) {
    return 'Quartier & Urbanisme'
  }
  
  // Fonctionnement général
  if (obj.includes('fonctionnement') || obj.includes('werkingskosten') || obj.includes('cotisation') ||
      obj.includes('bijdrage') || obj.includes('membre') || obj.includes('association') ||
      obj.includes('primes') || obj.includes('syndicales') || obj.includes('vakbondspremies') ||
      obj.includes('annuelle') || obj.includes('jaarlijkse') || obj.includes('lidmaatschapsbijdrage')) {
    return 'Fonctionnement'
  }
  
  return 'Autre'
}

// Charger tous les fichiers JSON
const dataDir = path.join(__dirname, '../public')
const years = ['2019', '2020', '2021', '2022', '2023', '2024']

let allSubsides = []

console.log('📊 Chargement des données...\n')

years.forEach(year => {
  const filePath = path.join(dataDir, `data-${year}.json`)
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      if (Array.isArray(data)) {
        data.forEach(item => {
          allSubsides.push({
            ...item,
            year,
            beneficiaire: item.beneficiaire_begunstigde || 
                         item.nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie || 
                         'Non spécifié',
            objet: item.l_objet_de_la_subvention_doel_van_de_subsidie || 
                   item.objet_du_subside_doel_van_de_subsidie || 
                   'Non spécifié',
            montant: parseFloat(item.montant_octroye_toegekend_bedrag || 
                               item.budget_2019_begroting_2019 || 
                               0)
          })
        })
        console.log(`✓ ${year}: ${data.length} subsides chargés`)
      }
    } catch (error) {
      console.error(`✗ Erreur lors du chargement de ${year}:`, error.message)
    }
  }
})

console.log(`\n📈 Total: ${allSubsides.length} subsides chargés\n`)

// Filtrer les subsides CPAS
const cpasSubsides = allSubsides.filter(s => {
  const normalized = normalizeBeneficiaryName(s.beneficiaire)
  return normalized.includes('cpas')
})

console.log(`🔍 ${cpasSubsides.length} subsides pour les CPAS trouvés\n`)

// Analyser les catégories
const categoryAnalysis = new Map()

cpasSubsides.forEach(s => {
  const category = categorizeSubside(s.objet)
  const existing = categoryAnalysis.get(category) || {
    count: 0,
    totalAmount: 0,
    examples: []
  }
  
  existing.count += 1
  existing.totalAmount += s.montant
  
  if (existing.examples.length < 10) {
    existing.examples.push({
      objet: s.objet,
      beneficiaire: s.beneficiaire,
      montant: s.montant,
      year: s.year
    })
  }
  
  categoryAnalysis.set(category, existing)
})

// Afficher les résultats
console.log('='.repeat(80))
console.log('📊 RÉSULTATS : Catégories des subsides pour les CPAS')
console.log('='.repeat(80))

const sortedCategories = Array.from(categoryAnalysis.entries())
  .sort((a, b) => b[1].totalAmount - a[1].totalAmount)

sortedCategories.forEach(([category, data]) => {
  console.log(`\n${'─'.repeat(80)}`)
  console.log(`📁 ${category}`)
  console.log(`   Nombre de subsides: ${data.count}`)
  console.log(`   Montant total: ${data.totalAmount.toLocaleString('fr-FR')} €`)
  console.log(`   Montant moyen: ${(data.totalAmount / data.count).toLocaleString('fr-FR')} €`)
  
  if (category === 'Musique & Festivals') {
    console.log(`\n   ⚠️  EXEMPLES D'OBJETS (pour vérifier la catégorisation):`)
    data.examples.forEach((ex, idx) => {
      console.log(`   ${idx + 1}. "${ex.objet}"`)
      console.log(`      Bénéficiaire: ${ex.beneficiaire}`)
      console.log(`      Montant: ${ex.montant.toLocaleString('fr-FR')} € (${ex.year})`)
      
      // Vérifier les mots-clés
      const objetLower = ex.objet.toLowerCase()
      const keywords = ['festival', 'musique', 'jazz', 'concert', 'briff', 'bsff', 'lumières', 'midis', 'minimes', 'musicorum']
      const foundKeywords = keywords.filter(kw => objetLower.includes(kw))
      if (foundKeywords.length > 0) {
        console.log(`      ✓ Mots-clés trouvés: ${foundKeywords.join(', ')}`)
      } else {
        console.log(`      ⚠️  AUCUN mot-clé "Musique & Festivals" trouvé !`)
      }
      console.log()
    })
  }
})

console.log('\n' + '='.repeat(80))
console.log('✅ Analyse terminée')
console.log('='.repeat(80))







