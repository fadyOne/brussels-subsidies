/**
 * Script de test pour valider le regroupement dynamique des bénéficiaires
 * 
 * Ce script teste que :
 * 1. Les variantes de noms sont bien regroupées (parking.brussels = Parking.brussels)
 * 2. Les bénéficiaires avec le même BCE sont regroupés
 * 3. Les CPAS et zones de police sont bien détectés
 */

const fs = require('fs')
const path = require('path')

// Fonction de normalisation (copie de beneficiary-normalizer.ts)
function normalizeBeneficiaryName(name) {
  if (!name || typeof name !== 'string') {
    return ''
  }
  
  let normalized = name.trim()
  normalized = normalized.toLowerCase()
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  normalized = normalized.replace(/[.\-\/|_]/g, ' ')
  normalized = normalized.replace(/[^a-z0-9\s]/g, ' ')
  
  const stopWords = ['de', 'du', 'la', 'le', 'les', 'des', 'van', 'der', 'den', 'het', 'een', 'the', 'of', 'and']
  const words = normalized.split(/\s+/).filter(word => 
    word.length > 0 && !stopWords.includes(word)
  )
  normalized = words.join(' ')
  normalized = normalized.replace(/\s+/g, ' ').trim()
  
  return normalized
}

// Fonction de regroupement par normalisation
function groupByNormalizedName(subsides) {
  const groups = new Map()
  
  subsides.forEach((subside) => {
    const normalized = normalizeBeneficiaryName(subside.beneficiaire_begunstigde)
    
    if (!normalized) {
      return
    }
    
    const existing = groups.get(normalized)
    
    const amount = typeof subside.montant_octroye_toegekend_bedrag === 'number' 
      ? subside.montant_octroye_toegekend_bedrag 
      : parseFloat(subside.montant_octroye_toegekend_bedrag) || 0
    
    if (existing) {
      existing.originalNames.add(subside.beneficiaire_begunstigde)
      existing.count += 1
      existing.totalAmount += amount
    } else {
      groups.set(normalized, {
        key: normalized,
        displayName: subside.beneficiaire_begunstigde,
        originalNames: new Set([subside.beneficiaire_begunstigde]),
        count: 1,
        totalAmount: amount,
      })
    }
  })
  
  return groups
}

// Fonction de regroupement par BCE
function groupByBCE(subsides) {
  const groups = new Map()
  
  subsides.forEach((subside) => {
    const bce = subside.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie
    
    if (!bce || (typeof bce === 'string' && bce.trim() === '')) {
      return
    }
    
    const bceKey = String(bce).trim()
    const existing = groups.get(bceKey)
    
    const amount = typeof subside.montant_octroye_toegekend_bedrag === 'number' 
      ? subside.montant_octroye_toegekend_bedrag 
      : parseFloat(subside.montant_octroye_toegekend_bedrag) || 0
    
    if (existing) {
      existing.originalNames.add(subside.beneficiaire_begunstigde)
      existing.count += 1
      existing.totalAmount += amount
    } else {
      groups.set(bceKey, {
        key: bceKey,
        displayName: subside.beneficiaire_begunstigde,
        originalNames: new Set([subside.beneficiaire_begunstigde]),
        count: 1,
        totalAmount: amount,
      })
    }
  })
  
  return groups
}

// Charger tous les fichiers JSON
const dataDir = path.join(__dirname, '../public')
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f.startsWith('data-'))

console.log('📊 Test du regroupement dynamique des bénéficiaires\n')
console.log(`Fichiers trouvés: ${files.length}\n`)

let allSubsides = []

files.forEach(file => {
  const filePath = path.join(dataDir, file)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  allSubsides = allSubsides.concat(data)
})

console.log(`Total de subsides: ${allSubsides.length}\n`)

// Test 1: Regroupement par normalisation
console.log('🔍 Test 1: Regroupement par normalisation\n')
const normalizedGroups = groupByNormalizedName(allSubsides)

// Chercher les cas de regroupement (plusieurs noms originaux pour une même normalisation)
const regrouped = Array.from(normalizedGroups.values())
  .filter(g => g.originalNames.size > 1)
  .sort((a, b) => b.totalAmount - a.totalAmount)
  .slice(0, 10)

console.log(`✅ ${regrouped.length} groupes avec plusieurs variantes détectées\n`)
console.log('Top 10 regroupements par normalisation:')
regrouped.forEach((group, i) => {
  console.log(`\n${i + 1}. ${group.displayName}`)
  console.log(`   Normalisé: "${group.key}"`)
  console.log(`   Variantes: ${Array.from(group.originalNames).join(', ')}`)
  console.log(`   Total: ${(group.totalAmount / 1000000).toFixed(2)}M€ (${group.count} subsides)`)
})

// Test 2: Regroupement par BCE
console.log('\n\n🔍 Test 2: Regroupement par numéro BCE\n')
const bceGroups = groupByBCE(allSubsides)

// Chercher les cas où le même BCE a plusieurs noms
const bceRegrouped = Array.from(bceGroups.values())
  .filter(g => g.originalNames.size > 1)
  .sort((a, b) => b.totalAmount - a.totalAmount)
  .slice(0, 10)

console.log(`✅ ${bceRegrouped.length} groupes BCE avec plusieurs noms détectés\n`)
console.log('Top 10 regroupements par BCE:')
bceRegrouped.forEach((group, i) => {
  console.log(`\n${i + 1}. BCE: ${group.key}`)
  console.log(`   Noms: ${Array.from(group.originalNames).join(', ')}`)
  console.log(`   Total: ${(group.totalAmount / 1000000).toFixed(2)}M€ (${group.count} subsides)`)
})

// Test 3: Cas spécifiques
console.log('\n\n🔍 Test 3: Cas spécifiques\n')

// Test parking.brussels
const parkingVariants = Array.from(normalizedGroups.values())
  .find(g => g.key.includes('parking') && g.key.includes('brussels'))

if (parkingVariants) {
  console.log('✅ parking.brussels détecté:')
  console.log(`   Normalisé: "${parkingVariants.key}"`)
  console.log(`   Variantes: ${Array.from(parkingVariants.originalNames).join(', ')}`)
  console.log(`   Total: ${(parkingVariants.totalAmount / 1000000).toFixed(2)}M€`)
} else {
  console.log('❌ parking.brussels non détecté')
}

// Test CPAS
const cpasGroups = Array.from(normalizedGroups.values())
  .filter(g => g.key.includes('cpas'))
  .sort((a, b) => b.totalAmount - a.totalAmount)

console.log(`\n✅ ${cpasGroups.length} groupes CPAS détectés`)
if (cpasGroups.length > 0) {
  console.log('Top 5 CPAS:')
  cpasGroups.slice(0, 5).forEach((group, i) => {
    console.log(`   ${i + 1}. ${group.displayName} - ${(group.totalAmount / 1000000).toFixed(2)}M€`)
  })
}

// Test zones de police
const policeGroups = Array.from(normalizedGroups.values())
  .filter(g => g.key.includes('police') || g.key.includes('zone'))
  .sort((a, b) => b.totalAmount - a.totalAmount)

console.log(`\n✅ ${policeGroups.length} groupes zones de police détectés`)
if (policeGroups.length > 0) {
  console.log('Top 5 zones de police:')
  policeGroups.slice(0, 5).forEach((group, i) => {
    console.log(`   ${i + 1}. ${group.displayName} - ${(group.totalAmount / 1000000).toFixed(2)}M€`)
  })
}

console.log('\n\n✅ Tests terminés!')

