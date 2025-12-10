/**
 * Script pour générer un mapping entre les organisations FWB et leurs PDFs
 * 
 * Ce script :
 * 1. Cherche dans les PDFs JSON les organisations FWB
 * 2. Trouve les PDFs correspondants
 * 3. Génère un fichier JSON avec les URLs des PDFs
 */

const fs = require('fs')
const path = require('path')

// Charger la liste des organisations FWB
const fwbOrgsPath = path.join(__dirname, '../src/lib/fwb-organizations.ts')
const fwbOrgsContent = fs.readFileSync(fwbOrgsPath, 'utf-8')

// Extraire les noms des organisations depuis le fichier TypeScript
const orgMatches = fwbOrgsContent.matchAll(/name:\s*"([^"]+)"/g)
const fwbOrgNames = Array.from(orgMatches).map(m => m[1])

console.log(`📋 ${fwbOrgNames.length} organisations FWB trouvées`)

// Fonction de normalisation (identique à celle du code)
function normalizeName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.\-\/|_]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Chercher dans les PDFs JSON
const jsonDir = path.join(__dirname, '../data/pdfs/json')
const mapping = {}

if (!fs.existsSync(jsonDir)) {
  console.warn('⚠️  Dossier data/pdfs/json non trouvé')
  process.exit(0)
}

function searchInDir(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true })
  
  items.forEach(item => {
    const itemPath = path.join(dir, item.name)
    
    if (item.isDirectory()) {
      searchInDir(itemPath)
    } else if (item.name.endsWith('.json')) {
      try {
        const content = fs.readFileSync(itemPath, 'utf-8')
        const text = content.toLowerCase()
        
        // Chercher si une organisation FWB est mentionnée
        const foundOrgs = fwbOrgNames.filter(orgName => {
          const normalizedOrg = normalizeName(orgName)
          const normalizedText = normalizeName(text)
          
          // Vérifier si le nom normalisé est dans le texte
          if (normalizedText.includes(normalizedOrg) || normalizedOrg.includes(normalizedText)) {
            return true
          }
          
          // Vérifier aussi avec des mots-clés extraits du nom
          const orgWords = normalizedOrg.split(/\s+/).filter(w => w.length > 3)
          return orgWords.some(word => normalizedText.includes(word))
        })
        
        if (foundOrgs.length > 0) {
          // Extraire le chemin local du PDF
          const relativePath = path.relative(jsonDir, itemPath)
          const pdfDir = path.dirname(relativePath)
          const pdfName = item.name.replace('.json', '.pdf')
          const localPath = path.join('data/pdfs/raw', pdfDir, pdfName)
          
          // Construire l'URL du PDF
          const url = buildPdfUrl(localPath)
          
          // Pour chaque organisation trouvée, ajouter le PDF
          foundOrgs.forEach(orgName => {
            if (!mapping[orgName]) {
              mapping[orgName] = []
            }
            mapping[orgName].push({
              pdfName,
              url,
              localPath,
            })
          })
        }
      } catch (err) {
        // Ignorer les erreurs de lecture
      }
    }
  })
}

// Fonction pour construire l'URL du PDF depuis le chemin local
function buildPdfUrl(localPath) {
  const match = localPath.match(/data\/pdfs\/raw\/(\d{8})\/Documents du (\d{2})-(\d{2})-(\d{4})\/(.+)\.pdf/)
  if (match) {
    const [, dateDir, day, month, year, filename] = match
    const ojMatch = filename.match(/^(\d+)_/)
    const ojNumber = ojMatch ? ojMatch[1] : '000'
    
    let decodedFilename = filename
      .replace(/_20/g, ' ')
      .replace(/_C3_A9/g, 'é')
      .replace(/_C3_AAt/g, 'â')
      .replace(/_C3_A8/g, 'è')
      .replace(/_C3_AA/g, 'ê')
      .replace(/_E2_80_99/g, "'")
      .replace(/_C2_B0/g, '°')
      .replace(/_/g, ' ')
      .trim()
    
    const encodedFilename = encodeURIComponent(decodedFilename)
    
    return `https://www.bruxelles.be/sites/default/files/bxl/workflow/${day}-${month}-${year}/${day}%20${month}%20${year}%20OJ%20point_punt%20(${ojNumber})/${encodedFilename}.pdf`
  }
  return null
}

// Lancer la recherche
console.log('🔍 Recherche des PDFs pour les organisations FWB...')
searchInDir(jsonDir)

// Nettoyer le mapping : garder seulement le PDF le plus récent pour chaque organisation
const cleanedMapping = {}
Object.entries(mapping).forEach(([orgName, pdfs]) => {
  // Trier par date (extraite du chemin) et prendre le plus récent
  const sorted = pdfs
    .filter(p => p.url) // Garder seulement ceux avec une URL valide
    .sort((a, b) => {
      const dateA = a.localPath.match(/(\d{8})/)?.[1] || '0'
      const dateB = b.localPath.match(/(\d{8})/)?.[1] || '0'
      return dateB.localeCompare(dateA) // Plus récent en premier
    })
  
  if (sorted.length > 0) {
    cleanedMapping[orgName] = sorted[0].url // Prendre le plus récent
  }
})

// Sauvegarder le mapping
const outputPath = path.join(__dirname, '../public/fwb-pdf-mapping.json')
fs.writeFileSync(outputPath, JSON.stringify(cleanedMapping, null, 2), 'utf-8')

console.log(`✅ Mapping généré: ${Object.keys(cleanedMapping).length} organisations avec PDFs`)
console.log(`📄 Fichier sauvegardé: ${outputPath}`)

// Afficher quelques exemples
const examples = Object.entries(cleanedMapping).slice(0, 5)
if (examples.length > 0) {
  console.log('\n📋 Exemples:')
  examples.forEach(([org, url]) => {
    console.log(`  - ${org.substring(0, 50)}...`)
    console.log(`    → ${url.substring(0, 80)}...`)
  })
}

