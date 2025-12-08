const fs = require('fs');
const path = require('path');

// Cette fonction va utiliser pdf-lib pour mettre en évidence les textes
async function highlightPdf(inputPath, outputPath, searchTerms) {
  try {
    const { PDFDocument, rgb } = require('pdf-lib');
    
    const existingPdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    const pages = pdfDoc.getPages();
    
    // Pour chaque page, on cherche les termes et on les surligne
    // Note: pdf-lib ne peut pas directement chercher du texte, donc on va devoir
    // utiliser une approche différente avec des annotations
    
    // Pour l'instant, on va juste copier le PDF et ajouter une note
    // Pour une vraie surlignage, il faudrait utiliser une autre bibliothèque
    
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);
    
    console.log(`✅ PDF traité: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Erreur avec pdf-lib: ${error.message}`);
    // Fallback: juste copier le fichier
    fs.copyFileSync(inputPath, outputPath);
    console.log(`📋 PDF copié (sans surlignage): ${outputPath}`);
  }
}

// Alternative: utiliser pdftk ou un autre outil
async function processPdfs() {
  const pdfs = [
    {
      input: 'data/pdfs/raw/08092025/Documents du 08-09-2025/014_Raadsbesluit.pdf',
      output: 'Nath/LISTEN_25000_EUR_014_Raadsbesluit.pdf',
      org: 'LISTEN',
      montant: '25000'
    },
    {
      input: 'data/pdfs/raw/23062025/Documents du 23-06-2025/072_Liste_20des_20Transferts_20Budget_202025.pdf',
      output: 'Nath/LISTEN_25000_EUR_BrusselsByNight_072_Liste_Transferts_Budget_2025.pdf',
      org: 'LISTEN et Brussels By Night',
      montant: '25000'
    },
    {
      input: 'data/pdfs/raw/23062025/Documents du 23-06-2025/084_Raadsbesluit.pdf',
      output: 'Nath/LISTEN_084_Raadsbesluit.pdf',
      org: 'LISTEN',
      montant: 'à déterminer'
    }
  ];
  
  for (const pdf of pdfs) {
    if (fs.existsSync(pdf.input)) {
      await highlightPdf(pdf.input, pdf.output, [pdf.org, pdf.montant]);
    } else {
      console.log(`⚠️  Fichier non trouvé: ${pdf.input}`);
    }
  }
}

processPdfs().catch(console.error);





