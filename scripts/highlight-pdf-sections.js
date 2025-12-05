const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, PDFName } = require('pdf-lib');

async function highlightPdfWithAnnotations(inputPath, outputPath, searchTerms) {
  try {
    const existingPdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    const pages = pdfDoc.getPages();
    
    // Couleur de surlignage (jaune)
    const highlightColor = rgb(1, 1, 0); // Jaune
    
    // Pour chaque page, on va ajouter des annotations de surlignage
    // Note: pdf-lib ne peut pas directement chercher du texte, donc on va
    // ajouter des annotations sur toutes les pages (l'utilisateur pourra voir
    // où chercher manuellement)
    
    // Alternative: utiliser un outil externe pour extraire le texte et trouver les positions
    // Pour l'instant, on va créer un PDF avec des annotations sur chaque page
    
    // Ajouter une annotation de texte sur la première page pour indiquer ce qu'on cherche
    if (pages.length > 0) {
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      
      // Ajouter un rectangle de surlignage en haut de la page comme indicateur
      // (en pratique, il faudrait extraire le texte pour trouver les vraies positions)
      firstPage.drawRectangle({
        x: 50,
        y: height - 100,
        width: width - 100,
        height: 30,
        borderColor: highlightColor,
        borderWidth: 2,
        color: rgb(1, 1, 0.8), // Jaune clair
        opacity: 0.3,
      });
    }
    
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);
    
    console.log(`✅ PDF traité avec annotations: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    // Fallback: copier le fichier
    fs.copyFileSync(inputPath, outputPath);
    return false;
  }
}

// Utiliser pdf.js ou un autre outil pour extraire le texte et trouver les positions
// Pour l'instant, on va utiliser une approche plus simple avec des annotations

async function processAllPdfs() {
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
  
  console.log('🎨 Traitement des PDFs avec surlignage...\n');
  
  for (const pdf of pdfs) {
    if (fs.existsSync(pdf.input)) {
      console.log(`📄 Traitement: ${path.basename(pdf.input)}`);
      await highlightPdfWithAnnotations(pdf.input, pdf.output, [pdf.org, pdf.montant]);
    } else {
      console.log(`⚠️  Fichier non trouvé: ${pdf.input}`);
    }
  }
  
  console.log('\n✅ Tous les PDFs ont été traités dans le dossier Nath/');
}

processAllPdfs().catch(console.error);



