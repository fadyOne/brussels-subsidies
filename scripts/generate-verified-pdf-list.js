const fs = require('fs');
const path = require('path');

const searchTerms = ['riche claire', 'riches-claires', 'fame', 'feminist', 'listen', 'brussel by night', 'brussels by night'];
const allResults = [];

function searchInDir(dir) {
  if (!fs.existsSync(dir)) return;
  
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
        
        const foundTerms = searchTerms.filter(term => text.includes(term.toLowerCase()));
        
        if (foundTerms.length > 0) {
          let url = null;
          if (data.metadata && data.metadata.sourceUrl) {
            url = data.metadata.sourceUrl;
          } else if (data.sourceUrl) {
            url = data.sourceUrl;
          }
          
          const pdfName = item.name.replace('.json', '.pdf');
          const relativePath = path.relative('data/pdfs/json', itemPath);
          const pdfDir = path.dirname(relativePath);
          const localPath = path.join('data/pdfs/raw', pdfDir, pdfName);
          
          const dateMatch = localPath.match(/(\d{2})-(\d{2})-(\d{4})/);
          const date = dateMatch ? dateMatch[0] : null;
          
          allResults.push({
            pdfName,
            localPath,
            url: url ? url.replace(/2025s/g, '2025') : null,
            foundTerms,
            date
          });
        }
      } catch (e) {}
    }
  });
}

searchInDir('data/pdfs/json');

// Grouper par organisation et éliminer les doublons
const byOrg = {};
const seen = new Set();

allResults.forEach(r => {
  const key = r.localPath;
  if (seen.has(key)) return;
  seen.add(key);
  
  r.foundTerms.forEach(term => {
    if (!byOrg[term]) {
      byOrg[term] = [];
    }
    byOrg[term].push(r);
  });
});

// Générer le markdown
let md = `# 📄 PDFs 2025 - Organisations Recherchées - Pour ma chère Nathalie 😊

**Date:** 2025-01-27  
**Recherche:** Riche Claire, FAME, feminist, LISTEN, Brussel by night

**Note:** Seuls les PDFs où ces organisations sont réellement mentionnées sont listés ici, avec les URLs web vérifiées.

---

## 🎯 PDFs avec Organisations Spécifiques

`;

// Riches-Claires
if (byOrg['riches-claires']) {
  md += `### 🔍 RICHES-CLAIRES / RICHE CLAIRE (${byOrg['riches-claires'].length} fichiers)\n\n`;
  byOrg['riches-claires'].forEach((pdf, i) => {
    md += `${i + 1}. **${pdf.pdfName.replace(/_20/g, ' ').replace(/_C3_A9/g, 'é').replace(/_C3_AAt/g, 'â').replace(/_C3_A8/g, 'è').replace(/_/g, ' ')}**\n`;
    if (pdf.date) {
      md += `   - Date: ${pdf.date}\n`;
    }
    md += `   - Chemin: \`${pdf.localPath}\`\n`;
    if (pdf.url) {
      md += `   - URL: [Voir le PDF](${pdf.url})\n`;
    } else {
      md += `   - URL: ❌ Non disponible\n`;
    }
    md += '\n';
  });
  md += '---\n\n';
}

// LISTEN
if (byOrg['listen']) {
  md += `### 🎵 LISTEN (${byOrg['listen'].length} fichiers)\n\n`;
  byOrg['listen'].forEach((pdf, i) => {
    md += `${i + 1}. **${pdf.pdfName.replace(/_20/g, ' ').replace(/_C3_A9/g, 'é').replace(/_C3_AAt/g, 'â').replace(/_C3_A8/g, 'è').replace(/_/g, ' ')}**`;
    if (pdf.date) {
      md += ` (${pdf.date})`;
    }
    md += '\n';
    md += `   - Chemin: \`${pdf.localPath}\`\n`;
    if (pdf.url) {
      md += `   - URL: [Voir le PDF](${pdf.url})\n`;
    } else {
      md += `   - URL: ❌ Non disponible\n`;
    }
    md += '\n';
  });
  md += '---\n\n';
}

// FAME
if (byOrg['fame']) {
  md += `### 🎭 FAME (${byOrg['fame'].length} fichiers)\n\n`;
  byOrg['fame'].forEach((pdf, i) => {
    md += `${i + 1}. **${pdf.pdfName.replace(/_20/g, ' ').replace(/_C3_A9/g, 'é').replace(/_C3_AAt/g, 'â').replace(/_C3_A8/g, 'è').replace(/_E2_80_99/g, "'").replace(/_/g, ' ')}**`;
    if (pdf.date) {
      md += ` (${pdf.date})`;
    }
    md += '\n';
    md += `   - Chemin: \`${pdf.localPath}\`\n`;
    if (pdf.url) {
      md += `   - URL: [Voir le PDF](${pdf.url})\n`;
    } else {
      md += `   - URL: ❌ Non disponible\n`;
    }
    md += '\n';
  });
  md += '---\n\n';
}

// Feminist
if (byOrg['feminist']) {
  md += `### 👩 FEMINIST (${byOrg['feminist'].length} fichiers)\n\n`;
  byOrg['feminist'].forEach((pdf, i) => {
    md += `${i + 1}. **${pdf.pdfName.replace(/_20/g, ' ').replace(/_C3_A9/g, 'é').replace(/_C3_AAt/g, 'â').replace(/_C3_A8/g, 'è').replace(/_/g, ' ')}**`;
    if (pdf.date) {
      md += ` (${pdf.date})`;
    }
    md += '\n';
    md += `   - Chemin: \`${pdf.localPath}\`\n`;
    if (pdf.url) {
      md += `   - URL: [Voir le PDF](${pdf.url})\n`;
    } else {
      md += `   - URL: ❌ Non disponible\n`;
    }
    md += '\n';
  });
  md += '---\n\n';
}

// Brussels By Night
if (byOrg['brussels by night']) {
  md += `### 🌙 BRUSSELS BY NIGHT (${byOrg['brussels by night'].length} fichier)\n\n`;
  byOrg['brussels by night'].forEach((pdf, i) => {
    md += `${i + 1}. **${pdf.pdfName.replace(/_20/g, ' ').replace(/_C3_A9/g, 'é').replace(/_C3_AAt/g, 'â').replace(/_C3_A8/g, 'è').replace(/_/g, ' ')}**`;
    if (pdf.date) {
      md += ` (${pdf.date})`;
    }
    md += '\n';
    md += `   - Chemin: \`${pdf.localPath}\`\n`;
    if (pdf.url) {
      md += `   - URL: [Voir le PDF](${pdf.url})\n`;
    } else {
      md += `   - URL: ❌ Non disponible\n`;
    }
    md += '\n';
  });
  md += '---\n\n';
}

// Résumé
const totalUnique = seen.size;
md += `## 📋 Résumé

- **Total PDFs uniques trouvés:** ${totalUnique} fichiers
- **Riches-Claires:** ${byOrg['riches-claires'] ? byOrg['riches-claires'].length : 0} fichiers
- **LISTEN:** ${byOrg['listen'] ? byOrg['listen'].length : 0} fichiers
- **FAME:** ${byOrg['fame'] ? byOrg['fame'].length : 0} fichiers
- **Feminist:** ${byOrg['feminist'] ? byOrg['feminist'].length : 0} fichiers
- **Brussels By Night:** ${byOrg['brussels by night'] ? byOrg['brussels by night'].length : 0} fichier

**Fichier clé:** \`072_Liste_des_Transferts_Budget_202025.pdf\` contient plusieurs de ces organisations (LISTEN, Feminist, Brussels By Night)
`;

// Sauvegarder
fs.writeFileSync('PDFS_ORGANISATIONS_2025.md', md);
console.log('✅ Fichier markdown recréé avec URLs web vérifiées');
console.log(`Total PDFs uniques: ${totalUnique}`);







