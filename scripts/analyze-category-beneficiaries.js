#!/usr/bin/env node

/**
 * Script d'analyse : Vérifier les bénéficiaires par catégorie
 * 
 * Ce script analyse pourquoi certains bénéficiaires apparaissent dans des catégories inattendues
 * Exemple : Hôpitaux dans "Arts Visuels"
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Fonction pour normaliser les noms (copie de la logique de l'app)
function normalizeBeneficiaryName(name) {
  let normalized = name.toLowerCase().trim()
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  normalized = normalized.replace(/\b(c\.p\.a\.s\.|cpas)\b/g, 'cpas')
  normalized = normalized.replace(/\b(o\.c\.m\.w\.|ocmw)\b/g, 'cpas')
  normalized = normalized.replace(/\b(centre public d'action sociale)\b/g, 'cpas')
  normalized = normalized.replace(/\b(openbaar centrum voor maatschappelijk welzijn)\b/g, 'cpas')
  normalized = normalized.replace(/\b(zone de police|politiezone)\b/g, 'zone de police')
  normalized = normalized.replace(/[\/\-\|]/g, ' ')
  normalized = normalized.replace(/\s+/g, ' ')
  return normalized.trim()
}

// Fonction pour identifier le type d'organisation
function getBeneficiaryType(name) {
  const normalized = normalizeBeneficiaryName(name)
  
  if (normalized.includes('brussels major events') || normalized.includes('bme')) {
    return 'Brussels Major Events (BME)'
  }
  if (normalized.includes('bravvo') || normalized.includes('bruxelles avance') || normalized.includes('brussel vooruit')) {
    return 'Bravvo Bruxelles Avance'
  }
  if (normalized.includes('zone de police') || normalized.includes('politie')) {
    return 'Zones de Police Bruxelles'
  }
  if (normalized.includes('cpas') || normalized.includes('action sociale') || normalized.includes('maatschappelijk welzijn')) {
    return 'CPAS Bruxelles'
  }
  if (normalized.includes('hopital') || normalized.includes('ziekenhuis') || normalized.includes('hospitalier')) {
    return 'Hôpitaux Bruxelles'
  }
  if (normalized.includes('schola') || normalized.includes('bruxelles enseignement')) {
    return 'Enseignement & Formation'
  }
  if (normalized.includes('bruxelles musees') || normalized.includes('musees') || normalized.includes('musea') ||
      normalized.includes('centre culturel') || normalized.includes('bruegel')) {
    return 'Culture & Patrimoine'
  }
  if (normalized.includes('brufete') || normalized.includes('brufeest') || normalized.includes('visit.brussels')) {
    return 'Événements & Festivals'
  }
  if (normalized.includes('conference des bourgmestres') || normalized.includes('vergadering der burgemeesters')) {
    return 'Autorités & Institutions'
  }
  if (normalized.includes('cuisines') || normalized.includes('keukens')) {
    return 'Alimentation & Restauration'
  }
  if (normalized.includes('enseignement') || normalized.includes('ecole') || normalized.includes('school') || normalized.includes('formation')) {
    return 'Enseignement & Formation'
  }
  if (normalized.includes('culture') || normalized.includes('evenement') || normalized.includes('event') || normalized.includes('creation')) {
    return 'Culture & Patrimoine'
  }
  if (normalized.includes('sport') || normalized.includes('bains') || normalized.includes('zwem')) {
    return 'Sport & Loisirs'
  }
  if (normalized.includes('economie') || normalized.includes('commerce') || normalized.includes('entreprise') || normalized.includes('ondernemen')) {
    return 'Économie & Commerce'
  }
  if (normalized.includes('office national') || normalized.includes('rijksdienst') || normalized.includes('autorites') || normalized.includes('overheden')) {
    return 'Autorités & Institutions'
  }
  if (normalized.includes('maison de') || normalized.includes('centre d\'animation') || normalized.includes('espace cultures')) {
    return 'Centres Culturels & Maisons'
  }
  if (normalized.includes('rock the city') || normalized.includes('jazz projects') || normalized.includes('productions associees')) {
    return 'Événements & Festivals'
  }
  if (normalized.includes('expositions') || normalized.includes('tentoonstellingen')) {
    return 'Musées & Expositions'
  }
  if (normalized.includes('restaurant') || normalized.includes('alimentation') || normalized.includes('food')) {
    return 'Alimentation & Restauration'
  }
  
  return name
}

// Fonction pour catégoriser les subsides (avec corrections)
function categorizeSubside(objet) {
  if (!objet) return 'Autre'
  const obj = objet.toLowerCase()
  
  // Sport
  if ((obj.includes('sport') && !obj.includes('transport') && !obj.includes('support') && !obj.includes('rapport')) ||
      obj.includes('football') || obj.includes('basketball') || 
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
      (obj.includes('concert') && !obj.includes('concertation') && !obj.includes('overlegcomité')) || 
      obj.includes('briff') || obj.includes('bsff') ||
      obj.includes('lumières') || obj.includes('midis') || obj.includes('minimes') ||
      obj.includes('musicorum')) {
    return 'Musique & Festivals'
  }
  
  // Arts Visuels
  if ((obj.includes('art') && !obj.includes('partie') && !obj.includes('participation') && 
       !obj.includes('partenaire') && !obj.includes('particulier') && !obj.includes('quartier')) ||
      obj.includes('exposition') || obj.includes('musée') ||
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
  if ((obj.includes('culture') && !obj.includes('agriculture')) || obj.includes('ommegang')) {
    return 'Culture'
  }
  
  // Social
  if (obj.includes('social') || obj.includes('égalité') || obj.includes('chances') || 
      obj.includes('handicap') || obj.includes('seniors') || obj.includes('jeunesse') || 
      obj.includes('famille') || obj.includes('solidarité') || obj.includes('insertion') ||
      obj.includes('prévention') || obj.includes('aide') || obj.includes('accompagnement') ||
      obj.includes('pride') || obj.includes('lgbt') || obj.includes('rainbow') ||
      obj.includes('droits') || obj.includes('femmes') || obj.includes('braderies') ||
      obj.includes('sécurité') || obj.includes('oeuvres') || obj.includes('sociaux') ||
      obj.includes('concertation') || obj.includes('overlegcomité')) {
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
  if (obj.includes('école') || obj.includes('écoles') || obj.includes('éducation') || 
      (obj.includes('formation') && !obj.includes('information') && !obj.includes('transformation') && !obj.includes('réforme')) ||
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

// Analyser les bénéficiaires par catégorie
console.log('='.repeat(80))
console.log('🔍 ANALYSE DES BÉNÉFICIAIRES PAR CATÉGORIE')
console.log('='.repeat(80))

const categoryMap = new Map()

allSubsides.forEach(subside => {
  const category = categorizeSubside(subside.objet)
  const beneficiaryType = getBeneficiaryType(subside.beneficiaire)
  
  if (!categoryMap.has(category)) {
    categoryMap.set(category, new Map())
  }
  
  const beneficiaryMap = categoryMap.get(category)
  const existing = beneficiaryMap.get(beneficiaryType) || {
    name: beneficiaryType,
    totalAmount: 0,
    count: 0,
    examples: []
  }
  
  existing.totalAmount += subside.montant
  existing.count += 1
  
  if (existing.examples.length < 3) {
    existing.examples.push({
      objet: subside.objet,
      beneficiaire: subside.beneficiaire,
      montant: subside.montant,
      year: subside.year
    })
  }
  
  beneficiaryMap.set(beneficiaryType, existing)
})

// Analyser chaque catégorie pour détecter les incohérences
console.log('\n📊 Top 10 Bénéficiaires par Catégorie (avec regroupement):\n')

categoryMap.forEach((beneficiaryMap, category) => {
  const sorted = Array.from(beneficiaryMap.values())
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10)
  
  if (sorted.length > 0) {
    console.log(`\n${'─'.repeat(80)}`)
    console.log(`📁 ${category}`)
    console.log(`${'─'.repeat(80)}`)
    
    sorted.forEach((beneficiary, index) => {
      console.log(`\n  ${index + 1}. ${beneficiary.name}`)
      console.log(`     Montant: ${beneficiary.totalAmount.toLocaleString('fr-FR')} €`)
      console.log(`     Nombre: ${beneficiary.count} subsides`)
      
      // Détecter les incohérences
      const normalized = normalizeBeneficiaryName(beneficiary.name)
      const isIncoherent = (
        (category === 'Arts Visuels' && (normalized.includes('hopital') || normalized.includes('ziekenhuis'))) ||
        (category === 'Musique & Festivals' && normalized.includes('cpas')) ||
        (category === 'Sport' && normalized.includes('hopital')) ||
        (category === 'Santé' && normalized.includes('zone de police'))
      )
      
      if (isIncoherent) {
        console.log(`     ⚠️  INCOHÉRENCE DÉTECTÉE !`)
        console.log(`     Exemples d'objets:`)
        beneficiary.examples.forEach((ex, idx) => {
          console.log(`       ${idx + 1}. "${ex.objet}"`)
          console.log(`          Bénéficiaire original: ${ex.beneficiaire}`)
        })
      }
    })
  }
})

// Analyser spécifiquement "Arts Visuels" avec hôpitaux
console.log('\n\n' + '='.repeat(80))
console.log('🏥 ANALYSE SPÉCIFIQUE : Hôpitaux dans "Arts Visuels"')
console.log('='.repeat(80))

const artsVisuelsSubsides = allSubsides.filter(s => categorizeSubside(s.objet) === 'Arts Visuels')
const hopitauxInArtsVisuels = artsVisuelsSubsides.filter(s => {
  const type = getBeneficiaryType(s.beneficiaire)
  return type.includes('Hôpitaux') || type.includes('hopital') || type.includes('ziekenhuis')
})

if (hopitauxInArtsVisuels.length > 0) {
  console.log(`\n⚠️  ${hopitauxInArtsVisuels.length} subsides d'hôpitaux catégorisés en "Arts Visuels"\n`)
  
  const hopitauxMap = new Map()
  hopitauxInArtsVisuels.forEach(s => {
    const type = getBeneficiaryType(s.beneficiaire)
    const existing = hopitauxMap.get(type) || {
      count: 0,
      totalAmount: 0,
      examples: []
    }
    existing.count += 1
    existing.totalAmount += s.montant
    if (existing.examples.length < 5) {
      existing.examples.push({
        objet: s.objet,
        beneficiaire: s.beneficiaire,
        montant: s.montant
      })
    }
    hopitauxMap.set(type, existing)
  })
  
  hopitauxMap.forEach((data, type) => {
    console.log(`\n  ${type}:`)
    console.log(`    Nombre: ${data.count}`)
    console.log(`    Montant: ${data.totalAmount.toLocaleString('fr-FR')} €`)
    console.log(`    Exemples d'objets:`)
    data.examples.forEach((ex, idx) => {
      console.log(`      ${idx + 1}. "${ex.objet}"`)
      console.log(`         Bénéficiaire: ${ex.beneficiaire}`)
      console.log(`         Montant: ${ex.montant.toLocaleString('fr-FR')} €`)
      
      // Analyser pourquoi c'est catégorisé en "Arts Visuels"
      const objetLower = ex.objet.toLowerCase()
      if (objetLower.includes('art')) {
        console.log(`         ⚠️  Contient "art" → Vérifier si c'est un faux positif`)
      }
      if (objetLower.includes('exposition')) {
        console.log(`         ✓ Contient "exposition"`)
      }
      if (objetLower.includes('musée')) {
        console.log(`         ✓ Contient "musée"`)
      }
    })
  })
} else {
  console.log('\n✅ Aucun hôpital dans "Arts Visuels" détecté\n')
}

console.log('\n' + '='.repeat(80))
console.log('✅ Analyse terminée')
console.log('='.repeat(80))

