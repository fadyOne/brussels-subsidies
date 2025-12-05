const fs = require('fs');
const path = require('path');

// Organisations recherchées
const searchOrganizations = [
  'riche claire',
  'riches-claires',
  'fame',
  'feminist',
  'listen',
  'brussel by night',
  'brussels by night'
];

// Charger le cache des PDFs découverts
let pdfCache = [];
try {
  const cacheFile = path.join(__dirname, '../data/extracted/metadata/discovered-pdfs.json');
  if (fs.existsSync(cacheFile)) {
    pdfCache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    console.log(`📦 Cache chargé: ${pdfCache.length} PDFs`);
  }
} catch (error) {
  console.warn('⚠️  Impossible de charger le cache');
}

// Fonction pour extraire le nom de fichier depuis le chemin local
function extractFilenameFromPath(localPath) {
  const match = localPath.match(/data\/pdfs\/raw\/\d{8}\/Documents du \d{2}-\d{2}-\d{4}\/(.+)\.pdf/);
  if (match) {
    let filename = match[1];
    filename = filename
      .replace(/_20/g, ' ')
      .replace(/_C3_A9/g, 'é')
      .replace(/_C3_AAt/g, 'â')
      .replace(/_C3_A8/g, 'è')
      .replace(/_C3_AA/g, 'ê')
      .replace(/_E2_80_99/g, "'")
      .replace(/_C2_B0/g, '°')
      .replace(/_/g, ' ')
      .trim();
    return filename;
  }
  return null;
}

// Fonction pour trouver l'URL dans le cache
function findUrlInCache(localPath) {
  const filename = extractFilenameFromPath(localPath);
  if (!filename) return null;
  
  const ojMatch = filename.match(/^(\d+)[_\s]/);
  if (!ojMatch) return null;
  const ojNumber = ojMatch[1];
  
  const normalizeAccents = (str) => {
    return str.toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c');
  };
  
  const matches = pdfCache.filter(pdf => {
    const cacheFilename = pdf.filename || path.basename(pdf.url, '.pdf');
    const decodedCache = decodeURIComponent(cacheFilename);
    const cacheOjMatch = decodedCache.match(/^(\d+)[_\s]/);
    if (!cacheOjMatch || cacheOjMatch[1] !== ojNumber) return false;
    
    const docType = normalizeAccents(filename);
    const cacheDocType = normalizeAccents(decodedCache);
    
    if (docType.includes('arrete') || docType.includes('arret')) {
      return cacheDocType.includes('arrete') || cacheDocType.includes('arret');
    }
    if (docType.includes('raadsbesluit')) {
      return cacheDocType.includes('raadsbesluit');
    }
    
    return cacheDocType.includes(docType.substring(0, 20)) || 
           docType.includes(cacheDocType.substring(0, 20));
  });
  
  if (matches.length > 0) {
    const pathDateMatch = localPath.match(/(\d{2})-(\d{2})-(\d{4})/);
    if (pathDateMatch) {
      const [, day, month, year] = pathDateMatch;
      const targetDate = `${year}-${month}-${day}`;
      const dateMatchedPdf = matches.find(pdf => {
        if (pdf.councilDate) {
          return pdf.councilDate.startsWith(targetDate);
        }
        return pdf.url.includes(`${day}-${month}-${year}`);
      });
      if (dateMatchedPdf) return dateMatchedPdf.url;
    }
    return matches[0].url;
  }
  
  return null;
}

// Fonction pour construire l'URL depuis le chemin (fallback)
function buildUrlFromPath(localPath) {
  const cacheUrl = findUrlInCache(localPath);
  if (cacheUrl) {
    return cacheUrl;
  }
  
  const match = localPath.match(/data\/pdfs\/raw\/(\d{8})\/Documents du (\d{2})-(\d{2})-(\d{4})\/(.+)\.pdf/);
  if (match) {
    const [, dateDir, day, month, year, filename] = match;
    const ojMatch = filename.match(/^(\d+)_/);
    const ojNumber = ojMatch ? ojMatch[1] : '000';
    
    let decodedFilename = filename
      .replace(/_20/g, ' ')
      .replace(/_C3_A9/g, 'é')
      .replace(/_C3_AAt/g, 'â')
      .replace(/_C3_A8/g, 'è')
      .replace(/_C3_AA/g, 'ê')
      .replace(/_E2_80_99/g, "'")
      .replace(/_C2_B0/g, '°')
      .replace(/_/g, ' ')
      .trim();
    
    const encodedFilename = encodeURIComponent(decodedFilename);
    
    return `https://www.bruxelles.be/sites/default/files/bxl/workflow/${day}-${month}-${year}/${day}%20${month}%20${year}%20OJ%20point_punt%20(${ojNumber})/${encodedFilename}.pdf`;
  }
  return null;
}

// Chercher dans les PDFs JSON
function searchInPdfJson() {
  const results = [];
  const jsonDir = path.join(__dirname, '../data/pdfs/json');
  
  if (!fs.existsSync(jsonDir)) {
    console.warn('⚠️  Dossier data/pdfs/json non trouvé');
    return results;
  }
  
  function searchInDir(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    items.forEach(item => {
      const itemPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        searchInDir(itemPath);
      } else if (item.name.endsWith('.json')) {
        try {
          const content = fs.readFileSync(itemPath, 'utf8');
          const data = JSON.parse(content);
          const text = JSON.stringify(data).toLowerCase();
          
          // Vérifier si le PDF contient un des noms d'organisations ET le mot "subside"
          const foundOrgs = searchOrganizations.filter(org => 
            text.includes(org.toLowerCase())
          );
          
          const hasSubside = text.includes('subside') || text.includes('subsidie');
          
          if (foundOrgs.length > 0 && hasSubside) {
            // Extraire le chemin local du PDF
            const relativePath = path.relative(jsonDir, itemPath);
            const pdfDir = path.dirname(relativePath);
            const pdfName = item.name.replace('.json', '.pdf');
            const localPath = path.join('data/pdfs/raw', pdfDir, pdfName);
            
            // Extraire la date
            const dateMatch = localPath.match(/(\d{2})-(\d{2})-(\d{4})/);
            const date = dateMatch ? dateMatch[0] : null;
            
            // Trouver l'URL
            const url = findUrlInCache(localPath) || buildUrlFromPath(localPath);
            
            // Extraire des informations supplémentaires si disponibles
            let montants = [];
            let beneficiaire = null;
            
            // Fonction récursive pour chercher dans toutes les structures
            function extractSubsides(obj, path = '') {
              if (Array.isArray(obj)) {
                obj.forEach((item, idx) => extractSubsides(item, `${path}[${idx}]`));
              } else if (obj && typeof obj === 'object') {
                const sText = JSON.stringify(obj).toLowerCase();
                const matchesOrg = searchOrganizations.some(org => {
                  const orgLower = org.toLowerCase();
                  return sText.includes(orgLower) || 
                         (orgLower.includes('riche') && sText.includes('riche')) ||
                         (orgLower.includes('claire') && sText.includes('claire'));
                });
                
                if (matchesOrg) {
                  // Chercher tous les champs possibles pour le montant
                  const montant = obj.montant_octroye_toegekend_bedrag || 
                                 obj.montant_prevu_au_budget_2025_bedrag_voorzien_op_begroting_2025 ||
                                 obj.montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023 ||
                                 obj.montant_prevu_au_budget_2021_bedrag_voorzien_op_begroting_2021 ||
                                 obj.montant || 
                                 obj.montant_octroye ||
                                 obj.montant_prevu ||
                                 (typeof obj.montant_octroye_toegekend_bedrag === 'number' ? obj.montant_octroye_toegekend_bedrag : null);
                  
                  if (montant && typeof montant === 'number' && montant > 0) {
                    const benef = obj.nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie ||
                                 obj.beneficiaire_begunstigde ||
                                 obj.beneficiaire ||
                                 obj.nom_du_beneficiaire ||
                                 '';
                    
                    // Éviter les doublons
                    const key = `${benef}-${montant}`;
                    if (!montants.find(m => `${m.beneficiaire}-${m.montant}` === key)) {
                      montants.push({
                        montant: montant,
                        beneficiaire: benef,
                        objet: obj.objet_du_subside_doel_van_de_subsidie || 
                               obj.l_objet_de_la_subvention_doel_van_de_subsidie ||
                               obj.objet || ''
                      });
                    }
                  }
                  
                  if (!beneficiaire) {
                    beneficiaire = obj.nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie ||
                                  obj.beneficiaire_begunstigde ||
                                  obj.beneficiaire ||
                                  obj.nom_du_beneficiaire;
                  }
                }
                
                // Continuer la recherche récursive
                Object.keys(obj).forEach(key => {
                  extractSubsides(obj[key], `${path}.${key}`);
                });
              }
            }
            
            extractSubsides(data);
            
            results.push({
              pdfName,
              localPath,
              url,
              foundOrgs,
              date,
              montants,
              beneficiaire
            });
          }
        } catch (e) {
          // Ignorer les erreurs de parsing
        }
      }
    });
  }
  
  searchInDir(jsonDir);
  return results;
}

// Charger les données 2025 pour enrichir les informations
let data2025 = [];
try {
  const dataFile = path.join(__dirname, '../public/data-2025-incomplete.json');
  if (fs.existsSync(dataFile)) {
    data2025 = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    console.log(`📊 Données 2025 chargées: ${data2025.length} subsides`);
  }
} catch (error) {
  console.warn('⚠️  Impossible de charger les données 2025');
}

// Fonction pour normaliser les noms d'organisations pour la recherche
function normalizeOrgName(name) {
  return name.toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

// Mapping des organisations pour la recherche
const orgMappings = {
  'riche claire': ['riche', 'claire', 'riches'],
  'riches-claires': ['riche', 'claire', 'riches'],
  'fame': ['fame'],
  'feminist': ['feminist', 'feministe'],
  'listen': ['listen'],
  'brussel by night': ['brussel', 'night', 'brussels'],
  'brussels by night': ['brussel', 'night', 'brussels']
};

// Fonction pour enrichir les résultats avec les données 2025
function enrichWithData2025(results) {
  return results.map(result => {
    // Chercher les subsides correspondants dans data-2025
    const matchingSubsides = data2025.filter(subside => {
      const beneficiaire = (subside.nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie || 
                          subside.beneficiaire_begunstigde || '').toLowerCase();
      const objet = (subside.objet_du_subside_doel_van_de_subsidie || 
                    subside.l_objet_de_la_subvention_doel_van_de_subsidie || '').toLowerCase();
      const fullText = beneficiaire + ' ' + objet;
      
      return result.foundOrgs.some(org => {
        const orgLower = org.toLowerCase();
        const normalizedOrg = normalizeOrgName(orgLower);
        const normalizedBenef = normalizeOrgName(beneficiaire);
        
        // Recherche exacte ou partielle
        if (beneficiaire.includes(orgLower) || orgLower.includes(beneficiaire)) {
          return true;
        }
        
        // Recherche normalisée
        if (normalizedBenef.includes(normalizedOrg) || normalizedOrg.includes(normalizedBenef)) {
          return true;
        }
        
        // Recherche par mots-clés
        const keywords = orgMappings[orgLower] || [orgLower];
        return keywords.some(keyword => fullText.includes(keyword));
      });
    });
    
    // Ajouter les montants trouvés (même si on en a déjà)
    if (matchingSubsides.length > 0) {
      const newMontants = matchingSubsides.map(sub => ({
        montant: sub.montant_octroye_toegekend_bedrag || 
                sub.montant_prevu_au_budget_2025_bedrag_voorzien_op_begroting_2025 || 0,
        beneficiaire: sub.nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie ||
                     sub.beneficiaire_begunstigde,
        objet: sub.objet_du_subside_doel_van_de_subsidie || 
               sub.l_objet_de_la_subvention_doel_van_de_subsidie || ''
      })).filter(s => s.montant > 0);
      
      // Fusionner avec les montants existants (éviter les doublons)
      if (result.montants && result.montants.length > 0) {
        const existing = new Set(result.montants.map(m => `${m.beneficiaire}-${m.montant}`));
        newMontants.forEach(m => {
          const key = `${m.beneficiaire}-${m.montant}`;
          if (!existing.has(key)) {
            result.montants.push(m);
            existing.add(key);
          }
        });
      } else {
        result.montants = newMontants;
      }
    }
    
    return result;
  });
}

// Générer le markdown
let results = searchInPdfJson();
results = enrichWithData2025(results);
console.log(`\n📊 ${results.length} PDF(s) trouvé(s) avec organisations ET mot "subside"\n`);

// Grouper par organisation
const grouped = {};
searchOrganizations.forEach(org => {
  grouped[org] = results.filter(r => r.foundOrgs.some(fo => 
    fo.toLowerCase().includes(org.toLowerCase()) || 
    org.toLowerCase().includes(fo.toLowerCase())
  ));
});

// Fonction pour nettoyer le nom du PDF
function cleanPdfName(pdfName) {
  return pdfName
    .replace(/_C3_A9/g, 'é')
    .replace(/_C3_AAt/g, 'â')
    .replace(/_C3_A8/g, 'è')
    .replace(/_C3_AA/g, 'ê')
    .replace(/_E2_80_99/g, "'")
    .replace(/_C2_B0/g, '°')
    .replace(/_20/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\.pdf$/i, '')
    .trim();
}

let md = `# 📄 PDFs 2025 - Organisations avec "Subside"

## Pour ma chère Nathalie 😊

---

**Date de génération:** ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}  
**Organisations recherchées:** Riche Claire, FAME, Feminist, LISTEN, Brussels By Night  
**Critère:** PDFs contenant le nom de l'organisation ET le mot "subside"

---

## 🎯 PDFs par Organisation

`;

// Générer les sections par organisation
const orgLabels = {
  'riche claire': '🔍 RICHES-CLAIRES / RICHE CLAIRE',
  'riches-claires': '🔍 RICHES-CLAIRES / RICHE CLAIRE',
  'fame': '🎭 FAME',
  'feminist': '👩 FEMINIST',
  'listen': '🎵 LISTEN',
  'brussel by night': '🌙 BRUSSELS BY NIGHT',
  'brussels by night': '🌙 BRUSSELS BY NIGHT'
};

const processed = new Set();

Object.entries(grouped).forEach(([org, pdfs]) => {
  if (pdfs.length === 0) return;
  
  const label = orgLabels[org] || org.toUpperCase();
  md += `### ${label}\n\n`;
  md += `*${pdfs.length} fichier${pdfs.length > 1 ? 's' : ''} trouvé${pdfs.length > 1 ? 's' : ''}*\n\n`;
  
  pdfs.forEach((pdf, i) => {
    const key = `${pdf.localPath}-${pdf.pdfName}`;
    if (processed.has(key)) return;
    processed.add(key);
    
    const cleanName = cleanPdfName(pdf.pdfName);
    
    md += `#### ${i + 1}. ${cleanName}\n\n`;
    
    if (pdf.date) {
      const [day, month, year] = pdf.date.split('-');
      const dateFormatted = new Date(`${year}-${month}-${day}`).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      md += `📅 **Date du conseil:** ${dateFormatted}\n\n`;
    }
    
    if (pdf.beneficiaire) {
      md += `👤 **Bénéficiaire:** ${pdf.beneficiaire}\n\n`;
    }
    
    if (pdf.montants && pdf.montants.length > 0) {
      md += `💰 **Subsides trouvés:**\n\n`;
      pdf.montants.forEach((sub, idx) => {
        const montantFormatted = new Intl.NumberFormat('fr-BE', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(sub.montant);
        
        md += `${idx + 1}. ${montantFormatted}`;
        if (sub.beneficiaire && sub.beneficiaire !== pdf.beneficiaire) {
          md += ` - ${sub.beneficiaire}`;
        }
        md += '\n';
      });
      
      // Total
      const total = pdf.montants.reduce((sum, s) => sum + (s.montant || 0), 0);
      const totalFormatted = new Intl.NumberFormat('fr-BE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(total);
      md += `\n**Total:** ${totalFormatted}\n\n`;
    } else {
      md += `💰 **Montant:** Information non disponible\n\n`;
    }
    
    md += '---\n\n';
  });
});

// Calculer les totaux par organisation
const totalsByOrg = {};
Object.entries(grouped).forEach(([org, pdfs]) => {
  const total = pdfs.reduce((sum, pdf) => {
    if (pdf.montants && pdf.montants.length > 0) {
      return sum + pdf.montants.reduce((s, m) => s + (m.montant || 0), 0);
    }
    return sum;
  }, 0);
  totalsByOrg[org] = total;
});

const totalRiches = (totalsByOrg['riche claire'] || 0) + (totalsByOrg['riches-claires'] || 0);
const totalBrusselsByNight = (totalsByOrg['brussel by night'] || 0) + (totalsByOrg['brussels by night'] || 0);

md += `---

## 📊 Résumé

| Organisation | Nombre de PDFs | Total Subsides |
|-------------|----------------|----------------|
| 🔍 Riches-Claires | ${(grouped['riche claire']?.length || 0) + (grouped['riches-claires']?.length || 0)} | ${totalRiches > 0 ? new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalRiches) : 'Non disponible'} |
| 🎵 LISTEN | ${grouped['listen']?.length || 0} | ${totalsByOrg['listen'] > 0 ? new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalsByOrg['listen']) : 'Non disponible'} |
| 🎭 FAME | ${grouped['fame']?.length || 0} | ${totalsByOrg['fame'] > 0 ? new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalsByOrg['fame']) : 'Non disponible'} |
| 👩 Feminist | ${grouped['feminist']?.length || 0} | ${totalsByOrg['feminist'] > 0 ? new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalsByOrg['feminist']) : 'Non disponible'} |
| 🌙 Brussels By Night | ${(grouped['brussel by night']?.length || 0) + (grouped['brussels by night']?.length || 0)} | ${totalBrusselsByNight > 0 ? new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(totalBrusselsByNight) : 'Non disponible'} |
| **TOTAL** | **${results.length}** | **${Object.values(totalsByOrg).reduce((sum, t) => sum + t, 0) > 0 ? new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Object.values(totalsByOrg).reduce((sum, t) => sum + t, 0)) : 'Non disponible'}** |

---

*Tous ces PDFs contiennent à la fois le nom de l'organisation ET le mot "subside" (ou "subsidie").*  
*Les montants indiqués sont ceux trouvés dans les données extraites des PDFs.*
`;

// Sauvegarder
fs.writeFileSync('PDFS_ORGANISATIONS_2025_AVEC_SUBSIDES.md', md);
console.log('✅ Fichier markdown créé: PDFS_ORGANISATIONS_2025_AVEC_SUBSIDES.md');

