/**
 * Script pour scraper la page FWB et mapper les PDFs réels
 * 
 * Ce script :
 * 1. Scrape la page FWB officielle
 * 2. Extrait les liens PDF pour chaque organisation
 * 3. Teste que les URLs fonctionnent
 * 4. Génère un mapping fiable
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

const FWB_PAGE_URL = 'https://creationartistique.cfwb.be/contrats-et-cp-musiques-actuelles'

// Charger la liste des organisations FWB
const fwbOrgsPath = path.join(__dirname, '../src/lib/fwb-organizations.ts')
const fwbOrgsContent = fs.readFileSync(fwbOrgsPath, 'utf-8')
const orgMatches = fwbOrgsContent.matchAll(/name:\s*"([^"]+)"/g)
const fwbOrgNames = Array.from(orgMatches).map(m => m[1])

console.log(`📋 ${fwbOrgNames.length} organisations FWB à mapper\n`)

/**
 * Télécharge le contenu HTML d'une URL
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    
    protocol.get(url, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data)
        } else {
          reject(new Error(`HTTP ${res.statusCode}`))
        }
      })
    }).on('error', reject)
  })
}

/**
 * Teste si une URL PDF est accessible
 */
async function testPdfUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http
    
    const req = protocol.get(url, { method: 'HEAD' }, (res) => {
      // Accepte 200, 301, 302 (redirections)
      const isOk = res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302
      resolve(isOk)
    })
    
    req.on('error', () => resolve(false))
    req.setTimeout(5000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

/**
 * Extrait les liens PDF depuis le HTML
 */
function extractPdfLinks(html) {
  const pdfLinks = []
  
  // Chercher tous les liens vers des PDFs
  // Format typique: <a href="...pdf"> ou <a href="...pdf" ...>Nom de l'organisation</a>
  const linkRegex = /<a[^>]+href=["']([^"']+\.pdf[^"']*)["'][^>]*>([^<]*)<\/a>/gi
  let match
  
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1]
    const text = match[2].trim()
    
    // Nettoyer l'URL (gérer les URLs relatives)
    let fullUrl = url
    if (url.startsWith('/')) {
      fullUrl = 'https://creationartistique.cfwb.be' + url
    } else if (url.startsWith('./') || !url.startsWith('http')) {
      fullUrl = 'https://creationartistique.cfwb.be/' + url.replace(/^\.\//, '')
    }
    
    pdfLinks.push({
      url: fullUrl,
      text: text,
      rawUrl: url
    })
  }
  
  // Chercher aussi les liens dans les attributs data ou autres formats
  const dataLinkRegex = /href=["']([^"']+\.pdf[^"']*)["']/gi
  while ((match = dataLinkRegex.exec(html)) !== null) {
    const url = match[1]
    if (!pdfLinks.some(link => link.url === url || link.rawUrl === url)) {
      let fullUrl = url
      if (url.startsWith('/')) {
        fullUrl = 'https://creationartistique.cfwb.be' + url
      } else if (url.startsWith('./') || !url.startsWith('http')) {
        fullUrl = 'https://creationartistique.cfwb.be/' + url.replace(/^\.\//, '')
      }
      pdfLinks.push({
        url: fullUrl,
        text: '',
        rawUrl: url
      })
    }
  }
  
  return pdfLinks
}

/**
 * Normalise un nom pour le matching
 */
function normalizeName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.\-\/|_()]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extrait le nom de l'organisation depuis le nom du fichier PDF
 * Ex: "1001_Valises_-_Cp_24-28.pdf" -> "1001 Valises"
 */
function extractOrgNameFromPdfFilename(filename) {
  // Enlever l'extension
  let name = filename.replace(/\.pdf$/i, '')
  
  // Enlever les suffixes communs
  name = name.replace(/[-_]cp[-_]?\d{2}[-_]\d{2}/i, '')
  name = name.replace(/[-_]contrat[-_]/i, '')
  name = name.replace(/[-_]24[-_]28/i, '')
  
  // Remplacer les underscores et tirets par des espaces
  name = name.replace(/[-_]/g, ' ')
  
  // Nettoyer les espaces multiples
  name = name.replace(/\s+/g, ' ').trim()
  
  return name
}

/**
 * Trouve le meilleur match entre un nom d'organisation et un lien PDF
 */
function findBestMatch(orgName, pdfLink, contextHtml) {
  const normalizedOrg = normalizeName(orgName)
  const normalizedText = normalizeName(pdfLink.text)
  
  // Extraire le nom depuis le nom du fichier PDF
  const pdfFilename = pdfLink.url.split('/').pop() || ''
  const orgNameFromFile = extractOrgNameFromPdfFilename(pdfFilename)
  const normalizedFromFile = normalizeName(orgNameFromFile)
  
  // Score de matching
  let score = 0
  
  // 1. Matching avec le nom extrait du fichier (le plus fiable)
  if (normalizedFromFile && normalizedOrg.includes(normalizedFromFile)) {
    score += 20 // Score élevé car très fiable
  }
  if (normalizedFromFile && normalizedFromFile.includes(normalizedOrg.split(' ')[0])) {
    score += 15 // Premier mot correspond
  }
  
  // 2. Matching exact du texte du lien
  if (normalizedText.includes(normalizedOrg) || normalizedOrg.includes(normalizedText)) {
    score += 10
  }
  
  // 3. Chercher le contexte autour du lien dans le HTML
  const linkIndex = contextHtml.indexOf(pdfLink.rawUrl)
  if (linkIndex > 0) {
    // Contexte plus large pour mieux capturer le nom de l'organisation
    const context = contextHtml.substring(Math.max(0, linkIndex - 500), linkIndex + 500).toLowerCase()
    const normalizedContext = normalizeName(context)
    
    // Vérifier si le nom de l'organisation apparaît près du lien
    if (normalizedContext.includes(normalizedOrg)) {
      score += 8
    }
    
    // Vérifier les mots-clés importants (mots de 4+ caractères)
    const orgWords = normalizedOrg.split(/\s+/).filter(w => w.length > 3)
    const matchingWords = orgWords.filter(word => normalizedContext.includes(word))
    score += matchingWords.length * 2
  }
  
  // 4. Matching partiel avec le nom du fichier
  const orgKeyWords = normalizedOrg.split(/\s+/).filter(w => w.length > 3)
  const fileKeyWords = normalizedFromFile.split(/\s+/).filter(w => w.length > 3)
  const commonWords = orgKeyWords.filter(word => fileKeyWords.includes(word))
  if (commonWords.length > 0) {
    score += commonWords.length * 3
  }
  
  return score
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🌐 Téléchargement de la page FWB...')
  
  let html
  try {
    html = await fetchUrl(FWB_PAGE_URL)
    console.log('✅ Page téléchargée\n')
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement:', error.message)
    console.log('\n💡 Solution alternative:')
    console.log('   1. Ouvrez https://creationartistique.cfwb.be/contrats-et-cp-musiques-actuelles')
    console.log('   2. Sauvegardez la page HTML')
    console.log('   3. Passez le chemin du fichier en argument:')
    console.log('      node scripts/scrape-fwb-page-and-map-pdfs.js /chemin/vers/page.html')
    process.exit(1)
  }
  
  console.log('🔍 Extraction des liens PDF...')
  const pdfLinks = extractPdfLinks(html)
  console.log(`   ${pdfLinks.length} liens PDF trouvés\n`)
  
  if (pdfLinks.length === 0) {
    console.log('⚠️  Aucun lien PDF trouvé dans la page')
    console.log('   La structure de la page a peut-être changé')
    console.log('   Vérifiez manuellement la page FWB')
    process.exit(1)
  }
  
  console.log('🔗 Mapping des organisations aux PDFs...')
  const mapping = {}
  const testedUrls = new Set()
  
  for (const orgName of fwbOrgNames) {
    let bestMatch = null
    let bestScore = 0
    
    // Trouver le meilleur match pour cette organisation
    for (const pdfLink of pdfLinks) {
      const score = findBestMatch(orgName, pdfLink, html)
      if (score > bestScore) {
        bestScore = score
        bestMatch = pdfLink
      }
    }
    
    // Si on a un bon match (score > 0), tester l'URL
    if (bestMatch && bestScore > 0) {
      const url = bestMatch.url
      
      // Éviter de tester la même URL plusieurs fois
      if (!testedUrls.has(url)) {
        process.stdout.write(`   Test: ${orgName.substring(0, 40)}... `)
        const isValid = await testPdfUrl(url)
        testedUrls.add(url)
        
        if (isValid) {
          mapping[orgName] = url
          console.log('✅')
        } else {
          console.log('❌ (URL invalide)')
        }
      } else {
        // URL déjà testée et valide, réutiliser
        mapping[orgName] = url
        console.log(`   Réutilisé: ${orgName.substring(0, 40)}... ✅`)
      }
    } else {
      console.log(`   Pas de match: ${orgName.substring(0, 40)}... ⚠️`)
    }
  }
  
  // Sauvegarder le mapping
  const outputPath = path.join(__dirname, '../public/fwb-pdf-mapping.json')
  fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2), 'utf-8')
  
  console.log(`\n✅ Mapping généré: ${Object.keys(mapping).length} organisations avec PDFs valides`)
  console.log(`📄 Fichier sauvegardé: ${outputPath}`)
  
  // Statistiques
  const withPdf = Object.keys(mapping).length
  const withoutPdf = fwbOrgNames.length - withPdf
  console.log(`\n📊 Statistiques:`)
  console.log(`   ✅ Avec PDF: ${withPdf}`)
  console.log(`   ⚠️  Sans PDF: ${withoutPdf}`)
  
  if (withPdf > 0) {
    console.log(`\n📋 Exemples de PDFs mappés:`)
    const examples = Object.entries(mapping).slice(0, 3)
    examples.forEach(([org, url]) => {
      console.log(`   - ${org.substring(0, 50)}...`)
      console.log(`     → ${url.substring(0, 70)}...`)
    })
  }
}

// Support pour passer un fichier HTML local en argument
const args = process.argv.slice(2)
if (args.length > 0 && args[0].endsWith('.html')) {
  const htmlPath = path.resolve(args[0])
  if (fs.existsSync(htmlPath)) {
    console.log(`📄 Lecture du fichier HTML local: ${htmlPath}\n`)
    const html = fs.readFileSync(htmlPath, 'utf-8')
    // Modifier main() pour utiliser ce HTML
    // (simplification pour l'instant)
  }
}

main().catch(console.error)
