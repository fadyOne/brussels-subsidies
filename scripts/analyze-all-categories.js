#!/usr/bin/env node

/**
 * Script d'analyse complète : Détecter tous les faux positifs et améliorer la catégorisation
 * 
 * Ce script analyse tous les subsides pour :
 * 1. Détecter les faux positifs (mots-clés qui sont des sous-mots)
 * 2. Identifier les incohérences de catégorisation
 * 3. Proposer des améliorations
 */

const fs = require('fs')
const path = require('path')

// Fonction pour catégoriser (copie de la logique actuelle)
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
  
  // Musique & Festivals
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
  
  // Culture
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
  
  // Fonctionnement
  if (obj.includes('fonctionnement') || obj.includes('werkingskosten') || obj.includes('cotisation') ||
      obj.includes('bijdrage') || obj.includes('membre') || obj.includes('association') ||
      obj.includes('primes') || obj.includes('syndicales') || obj.includes('vakbondspremies') ||
      obj.includes('annuelle') || obj.includes('jaarlijkse') || obj.includes('lidmaatschapsbijdrage')) {
    return 'Fonctionnement'
  }
  
  return 'Autre'
}

// Mots-clés par catégorie (pour détecter les faux positifs)
const categoryKeywords = {
  'Musique & Festivals': ['festival', 'musique', 'jazz', 'concert', 'briff', 'bsff', 'lumières', 'midis', 'minimes', 'musicorum'],
  'Sport': ['sport', 'football', 'basketball', 'natation', 'judo', 'tennis', 'padel', 'course', 'athlétisme', 'cyclisme', 'rugby', 'volley', 'boxing', 'karate', 'taekwondo', 'hockey', 'pétanque', 'diving', 'synchro', 'futsal', 'gym'],
  'Arts Visuels': ['art', 'exposition', 'musée', 'woodblocks'],
  'Spectacle & Cinéma': ['théâtre', 'spectacle', 'cinéma', 'film', 'cinémathèque'],
  'Littérature': ['littérature', 'bibliothèque'],
  'Danse': ['danse'],
  'Culture': ['culture', 'ommegang'],
  'Social': ['social', 'égalité', 'chances', 'handicap', 'seniors', 'jeunesse', 'famille', 'solidarité', 'insertion', 'prévention', 'aide', 'accompagnement', 'pride', 'lgbt', 'rainbow', 'droits', 'femmes', 'braderies', 'sécurité', 'oeuvres', 'sociaux'],
  'Environnement': ['environnement', 'climat', 'biodiversité', 'vert', 'nature', 'écologie', 'développement durable', 'énergie', 'recyclage', 'earth', 'hour', 'alimentation', 'durable', 'insectes', 'hôtels', 'vaisselle', 'réemployable', 'herbruikbaar'],
  'Éducation': ['école', 'éducation', 'formation', 'apprentissage', 'enseignement', 'pédagogie', 'étudiant', 'université', 'recherche', 'scientifique', 'devoirs', 'vormingen', 'vsd', 'opleiding', 'vélo', 'fietsevenementen', 'pairs', 'sexuelle'],
  'Santé': ['santé', 'hôpital', 'médical', 'soins', 'bien-être', 'médecine', 'pharmacie', 'psychologie', 'mental', 'repos', 'verzorging', 'schuldenlast'],
  'Économie': ['économie', 'emploi', 'entreprise', 'développement économique', 'innovation', 'startup', 'commerce', 'tourisme', 'made', 'versailles', 'congrès', 'mini-entreprises', 'promotion', 'toerisme'],
  'Quartier & Urbanisme': ['quartier', 'contrat', 'urbanisme', 'logement', 'infrastructure', 'mobilité', 'durable', 'rénovation', 'urbaine', 'balades', 'urbaines', 'littéraires', 'plaisirs', 'hiver', 'winterpret'],
  'Fonctionnement': ['fonctionnement', 'werkingskosten', 'cotisation', 'bijdrage', 'membre', 'association', 'primes', 'syndicales', 'vakbondspremies', 'annuelle', 'jaarlijkse', 'lidmaatschapsbijdrage']
}

// Mots à exclure (faux positifs connus)
const falsePositives = {
  'concert': ['concertation', 'overlegcomité'],
  'art': ['quartier', 'partie', 'participation', 'partenaire', 'particulier'],
  'sport': ['support', 'transport', 'rapport'],
  'social': ['sociale', 'sociales'], // Ceux-ci sont OK
  'culture': ['agriculture', 'culturel', 'culturelle'],
  'formation': ['information', 'transformation', 'réforme'],
  'école': ['écoles'],
  'santé': ['santé'],
  'économie': ['économie'],
  'quartier': ['quartier'],
  'fonctionnement': ['fonctionnement']
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

// Analyser chaque catégorie pour détecter les faux positifs
console.log('='.repeat(80))
console.log('🔍 ANALYSE DES FAUX POSITIFS PAR CATÉGORIE')
console.log('='.repeat(80))

const categoryAnalysis = new Map()

// Pour chaque catégorie, analyser les subsides
Object.keys(categoryKeywords).forEach(category => {
  const keywords = categoryKeywords[category]
  const subsidesInCategory = allSubsides.filter(s => categorizeSubside(s.objet) === category)
  
  // Pour chaque mot-clé, vérifier s'il y a des faux positifs
  keywords.forEach(keyword => {
    const falsePositiveWords = falsePositives[keyword] || []
    
    subsidesInCategory.forEach(subside => {
      const objetLower = subside.objet.toLowerCase()
      
      // Vérifier si le mot-clé est présent
      if (objetLower.includes(keyword)) {
        // Vérifier si c'est un faux positif
        const isFalsePositive = falsePositiveWords.some(fp => objetLower.includes(fp))
        
        if (isFalsePositive) {
          if (!categoryAnalysis.has(category)) {
            categoryAnalysis.set(category, new Map())
          }
          
          const keywordMap = categoryAnalysis.get(category)
          if (!keywordMap.has(keyword)) {
            keywordMap.set(keyword, {
              falsePositiveWord: falsePositiveWords.find(fp => objetLower.includes(fp)),
              examples: [],
              count: 0,
              totalAmount: 0
            })
          }
          
          const entry = keywordMap.get(keyword)
          entry.count += 1
          entry.totalAmount += subside.montant
          
          if (entry.examples.length < 5) {
            entry.examples.push({
              objet: subside.objet,
              beneficiaire: subside.beneficiaire,
              montant: subside.montant,
              year: subside.year
            })
          }
        }
      }
    })
  })
})

// Afficher les résultats
if (categoryAnalysis.size === 0) {
  console.log('\n✅ Aucun faux positif détecté avec les exclusions actuelles\n')
} else {
  categoryAnalysis.forEach((keywordMap, category) => {
    console.log(`\n${'─'.repeat(80)}`)
    console.log(`⚠️  ${category}`)
    console.log(`${'─'.repeat(80)}`)
    
    keywordMap.forEach((data, keyword) => {
      console.log(`\n  Mot-clé: "${keyword}"`)
      console.log(`  Faux positif détecté: "${data.falsePositiveWord}"`)
      console.log(`  Nombre de subsides affectés: ${data.count}`)
      console.log(`  Montant total: ${data.totalAmount.toLocaleString('fr-FR')} €`)
      console.log(`  Exemples:`)
      data.examples.forEach((ex, idx) => {
        console.log(`    ${idx + 1}. "${ex.objet}"`)
        console.log(`       Bénéficiaire: ${ex.beneficiaire}`)
        console.log(`       Montant: ${ex.montant.toLocaleString('fr-FR')} € (${ex.year})`)
      })
    })
  })
}

// Analyser les catégories pour identifier les incohérences
console.log('\n\n' + '='.repeat(80))
console.log('📊 ANALYSE DES CATÉGORIES : RÉPARTITION ET INCOHÉRENCES')
console.log('='.repeat(80))

const categoryStats = new Map()

allSubsides.forEach(s => {
  const category = categorizeSubside(s.objet)
  const existing = categoryStats.get(category) || {
    count: 0,
    totalAmount: 0,
    subsides: []
  }
  
  existing.count += 1
  existing.totalAmount += s.montant
  
  if (existing.subsides.length < 3) {
    existing.subsides.push({
      objet: s.objet,
      montant: s.montant
    })
  }
  
  categoryStats.set(category, existing)
})

const sortedCategories = Array.from(categoryStats.entries())
  .sort((a, b) => b[1].totalAmount - a[1].totalAmount)

console.log('\n📈 Répartition par catégorie :\n')
sortedCategories.forEach(([category, data]) => {
  const percentage = (data.totalAmount / Array.from(categoryStats.values())
    .reduce((sum, d) => sum + d.totalAmount, 0)) * 100
  
  console.log(`${category}:`)
  console.log(`  - Nombre: ${data.count}`)
  console.log(`  - Montant: ${data.totalAmount.toLocaleString('fr-FR')} € (${percentage.toFixed(1)}%)`)
})

// Détecter les mots-clés qui pourraient être des sous-mots d'autres mots
console.log('\n\n' + '='.repeat(80))
console.log('🔎 DÉTECTION DES MOTS-CLÉS QUI SONT DES SOUS-MOTS')
console.log('='.repeat(80))

const allKeywords = new Set()
Object.values(categoryKeywords).forEach(keywords => {
  keywords.forEach(kw => allKeywords.add(kw))
})

const subwordIssues = []

allKeywords.forEach(keyword => {
  allKeywords.forEach(otherKeyword => {
    if (keyword !== otherKeyword && otherKeyword.includes(keyword) && keyword.length >= 4) {
      subwordIssues.push({
        keyword,
        parentKeyword: otherKeyword,
        issue: `"${keyword}" est un sous-mot de "${otherKeyword}"`
      })
    }
  })
})

if (subwordIssues.length > 0) {
  console.log('\n⚠️  Mots-cles qui sont des sous-mots d\'autres mots-cles :\n')
  subwordIssues.forEach(issue => {
    console.log(`  - ${issue.issue}`)
    console.log(`    -> Risque de faux positif si "${issue.parentKeyword}" est dans l'objet`)
  })
} else {
  console.log('\n✅ Aucun probleme de sous-mots detecte\n')
}

// Recommandations
console.log('\n\n' + '='.repeat(80))
console.log('💡 RECOMMANDATIONS POUR AMÉLIORER LA CATÉGORISATION')
console.log('='.repeat(80))

console.log('\n1. Utiliser des expressions regulieres avec limites de mots (word boundaries)')
console.log('   Exemple: /\\bconcert\\b/ au lieu de includes("concert")')
console.log('   -> Evite de detecter "concert" dans "concertation"')

console.log('\n2. Ajouter des exclusions explicites pour les faux positifs connus')
console.log('   Exemple: if (obj.includes("concert") && !obj.includes("concertation"))')

console.log('\n3. Verifier l\'ordre de priorite des categories')
console.log('   -> Les categories plus specifiques doivent etre verifiees en premier')

console.log('\n4. Creer une liste de mots-cles exclus par categorie')
console.log('   -> Permet de gerer facilement les faux positifs')

console.log('\n5. Ajouter des tests unitaires pour les cas limites')
console.log('   -> Garantit que les corrections fonctionnent')

console.log('\n' + '='.repeat(80))
console.log('✅ Analyse terminée')
console.log('='.repeat(80))

