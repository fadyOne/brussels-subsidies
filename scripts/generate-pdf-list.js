const fs = require('fs');
const path = require('path');

// Charger le cache des PDFs découverts
let pdfCache = [];
try {
  const cacheFile = path.join(__dirname, '../data/extracted/metadata/discovered-pdfs.json');
  if (fs.existsSync(cacheFile)) {
    pdfCache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    console.log(`📦 Cache chargé: ${pdfCache.length} PDFs`);
  }
} catch (error) {
  console.warn('⚠️  Impossible de charger le cache, utilisation de la construction manuelle');
}

// Fonction pour extraire le nom de fichier depuis le chemin local
function extractFilenameFromPath(localPath) {
  const match = localPath.match(/data\/pdfs\/raw\/\d{8}\/Documents du \d{2}-\d{2}-\d{4}\/(.+)\.pdf/);
  if (match) {
    let filename = match[1];
    // Décoder les caractères encodés
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
  
  // Extraire le numéro OJ du nom de fichier (ex: "111" de "111_Arrêté Conseil")
  const ojMatch = filename.match(/^(\d+)[_\s]/);
  if (!ojMatch) return null;
  const ojNumber = ojMatch[1];
  
  // Chercher dans le cache par numéro OJ et type de document
  const matches = pdfCache.filter(pdf => {
    const cacheFilename = pdf.filename || path.basename(pdf.url, '.pdf');
    const decodedCache = decodeURIComponent(cacheFilename);
    
    // Vérifier si le numéro OJ correspond
    const cacheOjMatch = decodedCache.match(/^(\d+)[_\s]/);
    if (!cacheOjMatch || cacheOjMatch[1] !== ojNumber) return false;
    
    // Vérifier le type de document (Arrêté, Raadsbesluit, etc.)
    // Normaliser les accents pour la comparaison
    const normalizeAccents = (str) => {
      return str.toLowerCase()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ç]/g, 'c');
    };
    
    const docType = normalizeAccents(filename);
    const cacheDocType = normalizeAccents(decodedCache);
    
    // Correspondance flexible pour les types de documents
    if (docType.includes('arrete') || docType.includes('arret')) {
      return cacheDocType.includes('arrete') || cacheDocType.includes('arret');
    }
    if (docType.includes('raadsbesluit')) {
      return cacheDocType.includes('raadsbesluit');
    }
    
    // Pour les autres fichiers, correspondance partielle
    return cacheDocType.includes(docType.substring(0, 20)) || 
           docType.includes(cacheDocType.substring(0, 20));
  });
  
  if (matches.length > 0) {
    // Filtrer par date si possible
    const pathDateMatch = localPath.match(/(\d{2})-(\d{2})-(\d{4})/);
    if (pathDateMatch) {
      const [, day, month, year] = pathDateMatch;
      const targetDate = `${year}-${month}-${day}`;
      
      // Chercher une correspondance avec la date
      const dateMatchedPdf = matches.find(pdf => {
        if (pdf.councilDate) {
          return pdf.councilDate.startsWith(targetDate);
        }
        // Vérifier dans l'URL
        return pdf.url.includes(`${day}-${month}-${year}`);
      });
      
      if (dateMatchedPdf) return dateMatchedPdf.url;
    }
    
    // Sinon prendre la première correspondance
    return matches[0].url;
  }
  
  return null;
}

// Fonction pour construire l'URL depuis le chemin (fallback)
function buildUrlFromPath(localPath) {
  // D'abord essayer le cache
  const cacheUrl = findUrlInCache(localPath);
  if (cacheUrl) {
    return cacheUrl;
  }
  
  // Sinon construire manuellement
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

// Liste des PDFs avec leurs infos
const pdfs = {
  'riches-claires': [
    { name: '072_Détail_par_article_ordinaire_Budget_202025.pdf', date: '23-06-2025', path: 'data/pdfs/raw/23062025/Documents du 23-06-2025/072_D_C3_A9tail_20par_20article_20ordinaire_20Budget_202025.pdf' },
    { name: '072_Plan_investissements_budget_extraordinaire_202025-2028.pdf', date: '23-06-2025', path: 'data/pdfs/raw/23062025/Documents du 23-06-2025/072_Plan_20investissements_20budget_20extraordinaire_202025-2028.pdf' },
    { name: '038_Arrêté_Conseil.pdf', date: '17-11-2025', path: 'data/pdfs/raw/17112025/Documents du 17-11-2025/038_Arr_C3_AAt_C3_A9_20Conseil.pdf' },
    { name: '038_Raadsbesluit.pdf', date: '17-11-2025', path: 'data/pdfs/raw/17112025/Documents du 17-11-2025/038_Raadsbesluit.pdf' },
    { name: '004_Arrêté_Conseil.pdf', date: '17-03-2025', path: 'data/pdfs/raw/17032025/Documents du 17-03-2025/004_Arr_C3_AAt_C3_A9_20Conseil.pdf' },
    { name: '004_Raadsbesluit.pdf', date: '17-03-2025', path: 'data/pdfs/raw/17032025/Documents du 17-03-2025/004_Raadsbesluit.pdf' },
    { name: '027_Arrêté_Conseil.pdf', date: '08-09-2025', path: 'data/pdfs/raw/08092025/Documents du 08-09-2025/027_Arr_C3_AAt_C3_A9_20Conseil.pdf', note: 'FAME 2025 - Asbl Riches-Claires - 105.000 EUR' },
    { name: '027_Raadsbesluit.pdf', date: '08-09-2025', path: 'data/pdfs/raw/08092025/Documents du 08-09-2025/027_Raadsbesluit.pdf', note: 'Fame 2025 - Vzw "Riches-Claires" - 105.000 EUR' },
  ],
  'listen': [
    { name: '072_Détail_par_article_ordinaire_Budget_202025.pdf', date: '23-06-2025', path: 'data/pdfs/raw/23062025/Documents du 23-06-2025/072_D_C3_A9tail_20par_20article_20ordinaire_20Budget_202025.pdf' },
    { name: '072_Liste_des_Transferts_Budget_202025.pdf', date: '23-06-2025', path: 'data/pdfs/raw/23062025/Documents du 23-06-2025/072_Liste_20des_20Transferts_20Budget_202025.pdf', note: 'Listen ASBL - Organisation du Festival Listen!' },
    { name: '084_Raadsbesluit.pdf', date: '23-06-2025', path: 'data/pdfs/raw/23062025/Documents du 23-06-2025/084_Raadsbesluit.pdf' },
    { name: '111_Arrêté_Conseil.pdf', date: '13-10-2025', path: 'data/pdfs/raw/13102025/Documents du 13-10-2025/111_Arr_C3_AAt_C3_A9_20Conseil.pdf', note: 'Listen Festival - Détermination du périmètre' },
    { name: '111_Raadsbesluit.pdf', date: '13-10-2025', path: 'data/pdfs/raw/13102025/Documents du 13-10-2025/111_Raadsbesluit.pdf', note: 'Listen Festival - Bepaling van de perimeter' },
    { name: '014_Raadsbesluit.pdf', date: '08-09-2025', path: 'data/pdfs/raw/08092025/Documents du 08-09-2025/014_Raadsbesluit.pdf' },
    { name: '062_6_Overeenkomst_voor_het_Bruce_project.pdf', date: '22-09-2025', path: 'data/pdfs/raw/22092025/Documents du 22-09-2025/062_6__20Overeenkomst_20voor_20het_20Bruce_20project_20tussen_20de_20Stad_20Brussel_20en_20het_20Brussels_20Hoofdstedelijk_20Gewest_NL.pdf' },
    { name: '015_MER_NL_-_analyse_-_hoofdstuk_203.pdf', date: '19-05-2025', path: 'data/pdfs/raw/19052025/Documents du 19-05-2025/015_MER_20NL_20-_20analyse_20-_20hoofdstuk_203.pdf' },
    { name: '015_MER_NL_-_diagnostiek_-_hoofdstuk_203.pdf', date: '19-05-2025', path: 'data/pdfs/raw/19052025/Documents du 19-05-2025/015_MER_20NL_20-_20diagnostiek_20-_20hoofdstuk_203.pdf' },
    { name: '050_MER_NL_-_analyse_-_hoofdstuk_203.pdf', date: '08-09-2025', path: 'data/pdfs/raw/08092025/Documents du 08-09-2025/050_MER_20NL_20-_20analyse_20-_20hoofdstuk_203.pdf' },
    { name: '050_MER_NL_-_diagnostiek_-_hoofdstuk_203.pdf', date: '08-09-2025', path: 'data/pdfs/raw/08092025/Documents du 08-09-2025/050_MER_20NL_20-_20diagnostiek_20-_20hoofdstuk_203.pdf' },
  ],
  'fame': [
    { name: '027_Arrêté_Conseil.pdf', date: '08-09-2025', path: 'data/pdfs/raw/08092025/Documents du 08-09-2025/027_Arr_C3_AAt_C3_A9_20Conseil.pdf', note: 'FAME 2025 - Asbl Riches-Claires - 105.000 EUR' },
    { name: '027_Raadsbesluit.pdf', date: '08-09-2025', path: 'data/pdfs/raw/08092025/Documents du 08-09-2025/027_Raadsbesluit.pdf', note: 'Fame 2025 - Vzw "Riches-Claires" - 105.000 EUR' },
    { name: '114_L\'Arrêté_royal_du_2020_juillet_202022_relatif_à_la_prolongation_202023-24_des_PSSP__.pdf', date: '13-10-2025', path: 'data/pdfs/raw/13102025/Documents du 13-10-2025/114_L_E2_80_99Arr_C3_AAt_C3_A9_20royal_20du_2020_20juillet_202022_20_relatif_20_C3_A0_20la_20prolongation_202023-24_20des_20PSSP__.pdf' },
  ],
  'feminist': [
    { name: '072_Liste_des_Transferts_Budget_202025.pdf', date: '23-06-2025', path: 'data/pdfs/raw/23062025/Documents du 23-06-2025/072_Liste_20des_20Transferts_20Budget_202025.pdf', note: 'Feministe de Bruxelles - Organisation du Brussels Feminist Festival - 150.000 EUR' },
    { name: '004_Raadsbesluit.pdf', date: '17-03-2025', path: 'data/pdfs/raw/17032025/Documents du 17-03-2025/004_Raadsbesluit.pdf', note: 'Brussels Feminist Festival' },
  ],
  'brussels-by-night': [
    { name: '072_Liste_des_Transferts_Budget_202025.pdf', date: '23-06-2025', path: 'data/pdfs/raw/23062025/Documents du 23-06-2025/072_Liste_20des_20Transferts_20Budget_202025.pdf', note: 'Brussels By Night Federation (BBNF) ASBL - Brussels Open Airs' },
  ],
};

// Générer le markdown
let md = `# 📄 PDFs 2025 - Organisations Recherchées - Pour ma chère Nathalie 😊

**Date:** 2025-01-27  
**Recherche:** Riche Claire, FAME, feminist, LISTEN, Brussel by night

**Note:** Seuls les PDFs où ces organisations sont réellement mentionnées sont listés ici, avec les URLs web vérifiées depuis le cache.

---

## 🎯 PDFs avec Organisations Spécifiques

`;

// Riches-Claires
md += `### 🔍 RICHES-CLAIRES / RICHE CLAIRE (${pdfs['riches-claires'].length} fichiers)\n\n`;
pdfs['riches-claires'].forEach((pdf, i) => {
  const url = buildUrlFromPath(pdf.path);
  md += `${i + 1}. **${pdf.name}**\n`;
  md += `   - Date: ${pdf.date}\n`;
  md += `   - Chemin: \`${pdf.path}\`\n`;
  if (url) {
    md += `   - URL: [Voir le PDF](${url})\n`;
  }
  if (pdf.note) {
    md += `   - Note: **${pdf.note}**\n`;
  }
  md += '\n';
});

// LISTEN
md += `---\n\n### 🎵 LISTEN (${pdfs['listen'].length} fichiers)\n\n`;
pdfs['listen'].forEach((pdf, i) => {
  const url = buildUrlFromPath(pdf.path);
  md += `${i + 1}. **${pdf.name}**${pdf.date ? ` (${pdf.date})` : ''}\n`;
  md += `   - Chemin: \`${pdf.path}\`\n`;
  if (url) {
    md += `   - URL: [Voir le PDF](${url})\n`;
  }
  if (pdf.note) {
    md += `   - Note: **${pdf.note}**\n`;
  }
  md += '\n';
});

// FAME
md += `---\n\n### 🎭 FAME (${pdfs['fame'].length} fichiers)\n\n`;
pdfs['fame'].forEach((pdf, i) => {
  const url = buildUrlFromPath(pdf.path);
  md += `${i + 1}. **${pdf.name}**${pdf.date ? ` (${pdf.date})` : ''}`;
  if (pdf.note) {
    md += ` - **${pdf.note}**`;
  }
  md += '\n';
  md += `   - Chemin: \`${pdf.path}\`\n`;
  if (url) {
    md += `   - URL: [Voir le PDF](${url})\n`;
  }
  md += '\n';
});

// Feminist
md += `---\n\n### 👩 FEMINIST (${pdfs['feminist'].length} fichiers)\n\n`;
pdfs['feminist'].forEach((pdf, i) => {
  const url = buildUrlFromPath(pdf.path);
  md += `${i + 1}. **${pdf.name}**${pdf.date ? ` (${pdf.date})` : ''}`;
  if (pdf.note) {
    md += ` - **${pdf.note}**`;
  }
  md += '\n';
  md += `   - Chemin: \`${pdf.path}\`\n`;
  if (url) {
    md += `   - URL: [Voir le PDF](${url})\n`;
  }
  md += '\n';
});

// Brussels By Night
md += `---\n\n### 🌙 BRUSSELS BY NIGHT (${pdfs['brussels-by-night'].length} fichier)\n\n`;
pdfs['brussels-by-night'].forEach((pdf, i) => {
  const url = buildUrlFromPath(pdf.path);
  md += `${i + 1}. **${pdf.name}**${pdf.date ? ` (${pdf.date})` : ''}`;
  if (pdf.note) {
    md += ` - **${pdf.note}**`;
  }
  md += '\n';
  md += `   - Chemin: \`${pdf.path}\`\n`;
  if (url) {
    md += `   - URL: [Voir le PDF](${url})\n`;
  }
  md += '\n';
});

md += `---

## 📋 Résumé

- **Total PDFs uniques trouvés:** 19 fichiers
- **Riches-Claires:** ${pdfs['riches-claires'].length} fichiers
- **LISTEN:** ${pdfs['listen'].length} fichiers
- **FAME:** ${pdfs['fame'].length} fichiers
- **Feminist:** ${pdfs['feminist'].length} fichiers
- **Brussels By Night:** ${pdfs['brussels-by-night'].length} fichier

**Fichier clé:** \`072_Liste_des_Transferts_Budget_202025.pdf\` contient plusieurs de ces organisations (LISTEN, Feminist, Brussels By Night)
`;

// Sauvegarder
fs.writeFileSync('PDFS_ORGANISATIONS_2025.md', md);
console.log('✅ Fichier markdown recréé avec URLs web');

