/**
 * Script de validation des URLs PDF FWB
 * 
 * Teste que toutes les URLs dans le mapping sont accessibles
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

const mappingPath = path.join(__dirname, '../public/fwb-pdf-mapping.json')

if (!fs.existsSync(mappingPath)) {
  console.error('❌ Fichier mapping non trouvé:', mappingPath)
  process.exit(1)
}

const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'))
const orgs = Object.keys(mapping)
const total = orgs.length

console.log(`🔍 Validation de ${total} URLs PDF...\n`)

let valid = 0
let invalid = 0
const invalidUrls = []

/**
 * Teste si une URL est accessible
 */
function testUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http
    
    const req = protocol.get(url, { method: 'HEAD', timeout: 10000 }, (res) => {
      // Accepter 200, 301, 302, 303, 307, 308
      const isOk = [200, 301, 302, 303, 307, 308].includes(res.statusCode)
      resolve({ valid: isOk, status: res.statusCode })
    })
    
    req.on('error', () => resolve({ valid: false, status: 'ERROR' }))
    req.on('timeout', () => {
      req.destroy()
      resolve({ valid: false, status: 'TIMEOUT' })
    })
  })
}

/**
 * Teste toutes les URLs
 */
async function validateAll() {
  for (let i = 0; i < orgs.length; i++) {
    const org = orgs[i]
    const url = mapping[org]
    
    process.stdout.write(`[${i + 1}/${total}] ${org.substring(0, 50)}... `)
    
    const result = await testUrl(url)
    
    if (result.valid) {
      valid++
      console.log(`✅ (${result.status})`)
    } else {
      invalid++
      invalidUrls.push({ org, url, status: result.status })
      console.log(`❌ (${result.status})`)
    }
    
    // Petit délai pour ne pas surcharger le serveur
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log(`\n📊 Résultats:`)
  console.log(`   ✅ URLs valides: ${valid}`)
  console.log(`   ❌ URLs invalides: ${invalid}`)
  
  if (invalidUrls.length > 0) {
    console.log(`\n⚠️  URLs invalides:`)
    invalidUrls.forEach(({ org, url, status }) => {
      console.log(`   - ${org}`)
      console.log(`     ${url}`)
      console.log(`     Status: ${status}\n`)
    })
    
    // Sauvegarder un rapport
    const reportPath = path.join(__dirname, '../reports/fwb-pdf-validation-report.json')
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, JSON.stringify({
      date: new Date().toISOString(),
      total,
      valid,
      invalid,
      invalidUrls
    }, null, 2))
    console.log(`📄 Rapport sauvegardé: ${reportPath}`)
  } else {
    console.log(`\n✅ Toutes les URLs sont valides !`)
  }
}

validateAll().catch(console.error)

