#!/usr/bin/env node

/**
 * PHASE 2 : TÉLÉCHARGEMENT
 * Télécharge tous les PDFs découverts dans la phase 1
 * Organise les fichiers par date de conseil et type de document
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { downloadPdf } = require('./utils/pdf-downloader');
const { ensureDirectory } = require('./utils/file-system');
const { extractCouncilDate } = require('./utils/date-extractor');
const { extractDocumentType } = require('./utils/document-type-extractor');

const DATA_DIR = path.join(__dirname, '../../data');
const PDFS_DIR = path.join(DATA_DIR, 'pdfs', 'raw');
const METADATA_DIR = path.join(DATA_DIR, 'extracted', 'metadata');
const DISCOVERED_PDFS_FILE = path.join(METADATA_DIR, 'discovered-pdfs.json');
const INDEX_FILE = path.join(METADATA_DIR, 'index.json');
const CONFIG_PATH = path.join(__dirname, 'config', 'sources.json');

/**
 * Charge la configuration
 */
async function loadConfig() {
  try {
    const content = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Erreur lors du chargement de la config:', error.message);
    process.exit(1);
  }
}

/**
 * Charge le cache des PDFs découverts
 */
async function loadDiscoveredPdfs() {
  try {
    const content = await fs.readFile(DISCOVERED_PDFS_FILE, 'utf-8');
    const data = JSON.parse(content);
    
    // Le fichier peut être soit un tableau directement, soit un objet avec une propriété pdfs
    if (Array.isArray(data)) {
      return { pdfs: data };
    }
    
    // Si c'est un objet mais sans pdfs, créer la structure
    if (data && !data.pdfs) {
      return { pdfs: [] };
    }
    
    return data;
  } catch (error) {
    console.error('❌ Aucun PDF découvert. Lancez d\'abord phase-1-discover.js');
    process.exit(1);
  }
}

/**
 * Charge ou crée l'index des PDFs
 */
async function loadIndex() {
  try {
    const content = await fs.readFile(INDEX_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { pdfs: [] };
  }
}

/**
 * Sauvegarde l'index
 */
async function saveIndex(index) {
  await ensureDirectory(METADATA_DIR);
  await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
}

/**
 * Sauvegarde le cache des PDFs découverts
 */
async function saveDiscoveredPdfs(cache) {
  await ensureDirectory(METADATA_DIR);
  const tempFile = DISCOVERED_PDFS_FILE + '.tmp';
  await fs.writeFile(tempFile, JSON.stringify(cache.pdfs, null, 2), 'utf-8');
  await fs.rename(tempFile, DISCOVERED_PDFS_FILE);
}

/**
 * Calcule le checksum d'un fichier
 */
async function calculateChecksum(filePath) {
  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Crée un index en mémoire des checksums
 */
function createChecksumIndex(index) {
  const checksumMap = new Map();
  for (const pdf of index.pdfs) {
    if (pdf.checksum) {
      checksumMap.set(pdf.checksum, pdf);
    }
  }
  return checksumMap;
}

/**
 * Génère un nom de fichier sécurisé
 */
function generateFilename(url) {
  const urlObj = new URL(url);
  const basename = path.basename(urlObj.pathname, '.pdf') || 'document';
  const sanitized = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${sanitized}.pdf`;
}

/**
 * Détermine si un PDF est lié au conseil communal
 * Vérifie que le PDF provient UNIQUEMENT des pages show_documents (documents de conseils)
 */
function isCouncilRelated(pdfUrl, parentUrl) {
  if (!parentUrl && !pdfUrl) return false;
  
  const urlToCheck = (parentUrl || pdfUrl).toLowerCase();
  
  // STRICT : Uniquement les PDFs provenant de show_documents/DD-MM-YYYY
  // Ce sont les vrais documents de conseils communaux
  if (urlToCheck.includes('show_documents')) {
    // Vérifier que ce n'est pas une page générale du site
    const excludedPatterns = [
      '/actualites',
      '/news',
      '/archive',
      '/directory-',
      '/bureaux-de-liaison',
      '/salles-brucity',
      '/plan-climat',
      '/appels-projets'
    ];
    
    const isExcluded = excludedPatterns.some(pattern => urlToCheck.includes(pattern));
    if (isExcluded) {
      return false;
    }
    
    // show_documents est le pattern principal pour les documents de conseils
    return true;
  }
  
  // On n'accepte PAS les PDFs directement de la page principale
  // car elle peut contenir d'autres types de documents
  return false;
}

/**
 * Convertit une date YYYY-MM-DD en format DD/MM/YYYY pour l'affichage
 */
function formatDateDDMMYYYY(dateString) {
  if (!dateString) return 'date-inconnue';
  try {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Convertit une date YYYY-MM-DD en format DD/MM/YYYY pour le nom de dossier
 * Les slashes créent des sous-dossiers : 01/12/2025 → 01/12/2025 (structure imbriquée)
 */
function formatDateFolderName(dateString) {
  if (!dateString) return 'date-inconnue';
  try {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Génère le nom de dossier du type de document selon le format du site
 */
function getDocumentTypeFolderName(docType, dateString) {
  const dateFormatted = formatDateDDMMYYYY(dateString);
  
  const typeNames = {
    'ordre-du-jour': `Ordre du jour du ${dateFormatted}`,
    'documents': `Documents du ${dateFormatted}`,
    'supplement': `Supplément à l'ordre du jour du ${dateFormatted}`,
    'documents-supplement': `Documents (supplément) de ${dateFormatted}`,
    'proces-verbal': `Procès-verbal / Verslag du ${dateFormatted}`,
    'motion': `Motion du ${dateFormatted}`,
    'questions': `Questions / Vragen du ${dateFormatted}`,
    'addendum': `Addendum à l'ordre du jour du ${dateFormatted}`
  };
  
  return typeNames[docType] || `Autres du ${dateFormatted}`;
}

/**
 * Nettoie un nom de dossier pour qu'il soit valide sur tous les systèmes
 * Les slashes (/) dans les dates sont conservés car ils créent des sous-dossiers
 * Mais les slashes dans les noms de types sont remplacés par des tirets pour éviter les sous-dossiers
 */
function sanitizeFolderName(folderName, allowSlashes = false) {
  if (!folderName) return 'sans-titre';
  
  let sanitized = folderName;
  
  if (allowSlashes) {
    // Pour les dates : garder les slashes (créent des sous-dossiers 01/12/2025)
    sanitized = sanitized
      .replace(/[<>:"\\|?*]/g, '_')  // Caractères interdits (sauf /)
      .replace(/\/+/g, '/')          // Normaliser les slashes multiples
      .trim();
  } else {
    // Pour les noms de types : remplacer les slashes par des tirets
    // Ex: "Ordre du jour du 01/12/2025" → "Ordre du jour du 01-12-2025"
    // Ex: "Procès-verbal / Verslag" → "Procès-verbal - Verslag"
    sanitized = sanitized
      .replace(/(\d{2})\/(\d{2})\/(\d{4})/g, '$1-$2-$3')  // Remplacer DD/MM/YYYY par DD-MM-YYYY
      .replace(/\s*\/\s*/g, ' - ')                         // Remplacer " / " par " - "
      .replace(/[<>:"/\\|?*]/g, '_')  // Autres caractères interdits restants
      .replace(/_+/g, '_')            // Normaliser les underscores
      .trim();
  }
  
  // Limiter la longueur
  if (sanitized.length > 150) {
    sanitized = sanitized.substring(0, 150);
  }
  
  return sanitized || 'sans-titre';
}

/**
 * Extrait le nom du sous-dossier depuis l'URL parente
 * Ex: "01 12 2025 OJ point_punt (001)" depuis "/show_documents/01-12-2025/01%2012%202025%20OJ%20point_punt%20(001)"
 * Retourne le nom complet du sous-dossier pour créer le dossier (garde les espaces et parenthèses)
 */
function extractSubFolderName(parentUrl) {
  if (!parentUrl || !parentUrl.includes('show_documents')) {
    return null;
  }
  
  try {
    const urlObj = new URL(parentUrl);
    const pathParts = urlObj.pathname.split('/').filter(p => p);
    const showDocsIdx = pathParts.findIndex(p => p.includes('show_documents'));
    
    if (showDocsIdx === -1) return null;
    
    // Prendre la partie après la date (ex: "01 12 2025 OJ point_punt (001)")
    const afterDate = pathParts.slice(showDocsIdx + 2);
    
    if (afterDate.length === 0) return null;
    
    // Décoder et nettoyer SEULEMENT les caractères interdits (garde espaces et parenthèses)
    const decoded = decodeURIComponent(afterDate[0]);
    const subFolder = decoded
      .replace(/[<>:"/\\|?*]/g, '_')  // Seulement les caractères vraiment interdits
      .replace(/_+/g, '_')             // Normaliser les underscores multiples
      .replace(/^_+|_+$/g, '')         // Enlever les underscores en début/fin
      .trim()
      .substring(0, 100);
    
    return subFolder || null;
  } catch {
    return null;
  }
}

/**
 * Génère le chemin organisé selon la structure du site web
 * Format: 
 * - PDFs directs: conseil-communal/DD/MM/YYYY/Type.pdf
 * - PDFs dans Documents: conseil-communal/DD/MM/YYYY/Documents du DD-MM-YYYY/Sous-dossier/filename.pdf
 */
function generateOrganizedPath(councilDate, docType, filename, pdfUrl, parentUrl) {
  // Si c'est lié au conseil communal, utiliser la structure du site
  if (isCouncilRelated(pdfUrl, parentUrl)) {
    // Format de date pour le dossier : DD/MM/YYYY (slashes créent structure imbriquée)
    const dateFolder = formatDateFolderName(councilDate);
    const sanitizedDateFolder = sanitizeFolderName(dateFolder, true);
    
    // Vérifier si c'est un PDF dans un sous-dossier (Documents avec point)
    const subFolderName = extractSubFolderName(parentUrl);
    
    // Si c'est dans un sous-dossier (ex: "01 12 2025 OJ point_punt (001)")
    if (subFolderName && (docType === 'documents' || docType === 'documents-supplement')) {
      // Structure: date/Documents du DD-MM-YYYY/Sous-dossier/filename.pdf
      const typeFolderName = getDocumentTypeFolderName(docType, councilDate);
      const sanitizedTypeFolder = sanitizeFolderName(typeFolderName, false);
      
      return path.join('conseil-communal', sanitizedDateFolder, sanitizedTypeFolder, subFolderName, filename);
    }
    
    // Sinon, PDF direct dans le dossier date (Ordre du jour, Supplément, Motion, etc.)
    // Vérifier si c'est un PDF direct (pas dans un sous-dossier)
    const isDirectPdf = !subFolderName || 
                        parentUrl.includes('ordres-du-jour-proces-verbaux-motions') ||
                        docType === 'ordre-du-jour' || 
                        docType === 'supplement' || 
                        docType === 'motion' ||
                        docType === 'proces-verbal' ||
                        docType === 'questions' ||
                        docType === 'addendum';
    
    if (isDirectPdf) {
      // PDF direct : date/Type.pdf (directement dans le dossier date, pas de sous-dossier)
      const typeFolderName = getDocumentTypeFolderName(docType, councilDate);
      const sanitizedTypeFolder = sanitizeFolderName(typeFolderName, false);
      
      // Le nom du fichier devrait être le nom du type (ex: "Ordre du jour du 01-12-2025.pdf")
      // Si ce n'est pas le cas, utiliser le nom du type comme nom de fichier
      const finalFilename = filename || `${sanitizedTypeFolder}.pdf`;
      
      return path.join('conseil-communal', sanitizedDateFolder, finalFilename);
    }
    
    // Fallback : PDFs dans Documents sans sous-dossier → date/Documents du DD-MM-YYYY/filename.pdf
    const typeFolderName = getDocumentTypeFolderName(docType, councilDate);
    const sanitizedTypeFolder = sanitizeFolderName(typeFolderName, false);
    return path.join('conseil-communal', sanitizedDateFolder, sanitizedTypeFolder, filename);
  }
  
  // Sinon, ranger dans "autres" avec une catégorie
  let category = 'autres';
  const urlToCheck = (parentUrl || pdfUrl || '').toLowerCase();
  
  if (urlToCheck.includes('reglement') || urlToCheck.includes('roi')) {
    category = 'reglements';
  } else if (urlToCheck.includes('plan') || urlToCheck.includes('climat')) {
    category = 'plans';
  } else if (urlToCheck.includes('procedure') || urlToCheck.includes('workflow')) {
    category = 'procedures';
  } else if (urlToCheck.includes('laureat') || urlToCheck.includes('appel')) {
    category = 'appels-projets';
  }
  
  const dateFolder = formatDateDDMMYYYY(councilDate);
  return path.join('autres', category, sanitizeFolderName(dateFolder), filename);
}

/**
 * Vérifie si une date est >= 2019
 */
function isDateAfter2018(dateString) {
  if (!dateString) return false;
  try {
    const year = parseInt(dateString.split('-')[0]);
    return year >= 2019;
  } catch {
    return false;
  }
}

/**
 * Vérifie si une date est de 2025
 */
function isDate2025(dateString) {
  if (!dateString) return false;
  try {
    const year = parseInt(dateString.split('-')[0]);
    return year === 2025;
  } catch {
    return false;
  }
}

/**
 * Télécharge un PDF
 */
async function downloadPdfFile(pdfEntry, config, index, checksumIndex) {
  const filename = generateFilename(pdfEntry.url);
  
  // Utiliser la date et le type extraits lors de la découverte
  const councilDate = pdfEntry.councilDate || extractCouncilDate(pdfEntry.url, pdfEntry.parentUrl, filename);
  const docType = pdfEntry.documentType || extractDocumentType(pdfEntry.url, pdfEntry.parentUrl, filename);
  
  // Filtrer : seulement les dates de 2025
  if (!isDate2025(councilDate)) {
    pdfEntry.status = 'skipped';
    pdfEntry.skipReason = 'not_2025';
    return null;
  }
  
  // Filtrer : seulement les PDFs liés au conseil communal
  if (!isCouncilRelated(pdfEntry.url, pdfEntry.parentUrl)) {
    pdfEntry.status = 'skipped';
    pdfEntry.skipReason = 'not_council_related';
    return null;
  }
  
  // Générer le chemin organisé (avec détection conseil communal vs autres)
  const organizedPath = generateOrganizedPath(councilDate, docType, filename, pdfEntry.url, pdfEntry.parentUrl);
  const filePath = path.join(PDFS_DIR, organizedPath);
  
  // Créer les répertoires
  await ensureDirectory(path.dirname(filePath));
  
  // Vérifier si le fichier existe déjà
  let fileExists = false;
  try {
    await fs.access(filePath);
    fileExists = true;
  } catch {
    // Fichier n'existe pas
  }
  
  let checksum = null;
  
  if (fileExists) {
    // Fichier existe, calculer le checksum
    checksum = await calculateChecksum(filePath);
    const existing = checksumIndex.get(checksum);
    if (existing) {
      pdfEntry.status = 'skipped';
      pdfEntry.skipReason = 'already_downloaded';
      return existing;
    }
  } else {
    // Télécharger le PDF
    try {
      await downloadPdf(pdfEntry.url, filePath, config.settings);
      checksum = await calculateChecksum(filePath);
      
      // Vérifier si doublon
      const existing = checksumIndex.get(checksum);
      if (existing) {
        pdfEntry.status = 'skipped';
        pdfEntry.skipReason = 'duplicate';
        await fs.unlink(filePath).catch(() => {});
        return existing;
      }
    } catch (error) {
      pdfEntry.status = 'failed';
      pdfEntry.lastError = error.message;
      pdfEntry.retryCount = (pdfEntry.retryCount || 0) + 1;
      throw error;
    }
  }
  
  // Créer l'entrée dans l'index
  const pdfIndexEntry = {
    id: crypto.randomUUID(),
    sourceUrl: pdfEntry.url,
    parentUrl: pdfEntry.parentUrl,
    filename: filename,
    filePath: organizedPath,
    councilDate: councilDate,
    documentType: docType,
    downloadDate: new Date().toISOString(),
    fileSize: (await fs.stat(filePath)).size,
    pageCount: null,
    extractionStatus: 'pending',
    extractedDataPath: null,
    checksum: checksum
  };
  
  index.pdfs.push(pdfIndexEntry);
  checksumIndex.set(checksum, pdfIndexEntry);
  
  pdfEntry.status = 'downloaded';
  pdfEntry.downloadedDate = new Date().toISOString();
  
  return pdfIndexEntry;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('📥 PHASE 2 : TÉLÉCHARGEMENT DES PDFs\n');
  
  const config = await loadConfig();
  const discoveredCache = await loadDiscoveredPdfs();
  const index = await loadIndex();
  const checksumIndex = createChecksumIndex(index);
  
  // Filtrer les PDFs à télécharger (seulement conseils communaux de 2025)
  const pdfsToDownload = discoveredCache.pdfs.filter(pdf => {
    // Vérifier le statut
    if (pdf.status !== 'pending' && pdf.status !== 'failed') {
      return false;
    }
    
    // Filtrer : seulement les dates de 2025
    if (!isDate2025(pdf.councilDate)) {
      return false;
    }
    
    // Filtrer : seulement les PDFs liés au conseil communal
    return isCouncilRelated(pdf.url, pdf.parentUrl);
  });
  
  const totalPdfs = discoveredCache.pdfs.length;
  const councilRelatedPdfs = discoveredCache.pdfs.filter(pdf => 
    isCouncilRelated(pdf.url, pdf.parentUrl)
  ).length;
  const alreadyDownloaded = discoveredCache.pdfs.filter(pdf => 
    pdf.status === 'downloaded' || pdf.status === 'skipped'
  ).length;
  
  console.log(`📋 ${totalPdfs} PDF(s) dans le cache (dont ${councilRelatedPdfs} liés au conseil communal)`);
  console.log(`📥 ${pdfsToDownload.length} PDF(s) à télécharger (conseil communal uniquement)`);
  console.log(`✅ ${alreadyDownloaded} PDF(s) déjà téléchargé(s)`);
  console.log(`⏭️  ${totalPdfs - councilRelatedPdfs} PDF(s) ignoré(s) (non liés au conseil communal)\n`);
  
  if (pdfsToDownload.length === 0) {
    console.log('✅ Tous les PDFs sont déjà téléchargés !');
    return;
  }
  
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  
  // Télécharger chaque PDF
  for (let i = 0; i < pdfsToDownload.length; i++) {
    const pdfEntry = pdfsToDownload[i];
    const progress = `[${i + 1}/${pdfsToDownload.length}]`;
    
    try {
      const result = await downloadPdfFile(pdfEntry, config, index, checksumIndex);
      if (result === null) {
        // PDF ignoré (date < 2019)
        skipped++;
        if (pdfEntry.skipReason === 'not_2025') {
          console.log(`${progress} ⏭️  ${pdfEntry.filename} (pas 2025, ignoré)`);
        } else if (pdfEntry.skipReason === 'not_council_related') {
          console.log(`${progress} ⏭️  ${pdfEntry.filename} (pas conseil communal, ignoré)`);
        } else {
          console.log(`${progress} ⏭️  ${pdfEntry.filename} (${pdfEntry.skipReason || 'ignoré'})`);
        }
      } else if (pdfEntry.status === 'skipped') {
        skipped++;
        console.log(`${progress} ⏭️  ${pdfEntry.filename} (${pdfEntry.skipReason || 'ignoré'})`);
      } else {
        downloaded++;
        console.log(`${progress} ✅ ${pdfEntry.filename}`);
      }
    } catch (error) {
      failed++;
      console.log(`${progress} ❌ ${pdfEntry.filename}: ${error.message}`);
    }
    
    // Sauvegarder périodiquement (toutes les 10 téléchargements)
    if ((i + 1) % 10 === 0) {
      await saveIndex(index);
      await saveDiscoveredPdfs(discoveredCache);
      console.log(`💾 Progrès sauvegardé (${i + 1}/${pdfsToDownload.length})`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, config.settings.rateLimit || 1000));
  }
  
  // Sauvegarder les fichiers finaux
  await saveIndex(index);
  await saveDiscoveredPdfs(discoveredCache);
  
  console.log('\n✨ Téléchargement terminé !');
  console.log(`✅ ${downloaded} PDF(s) téléchargé(s)`);
  console.log(`⏭️  ${skipped} PDF(s) ignoré(s)`);
  console.log(`❌ ${failed} PDF(s) échoué(s)`);
  console.log(`📊 Total dans l'index: ${index.pdfs.length} PDF(s)`);
  
  if (failed > 0) {
    console.log(`\n💡 Lancez 'node phase-2-download.js' à nouveau pour retenter les échecs`);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { main };

