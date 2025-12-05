#!/usr/bin/env node

/**
 * PHASE 1 : DÉCOUVERTE
 * Explore récursivement toutes les pages HTML et découvre tous les PDFs
 * Ne télécharge PAS les PDFs, seulement les liste dans discovered-pdfs.json
 */

const fs = require('fs').promises;
const path = require('path');
const { fetchWithRetry } = require('./utils/http-client');
const { extractPdfLinks, extractHtmlLinks, normalizeUrl } = require('./utils/html-parser-recursive');
const { URL } = require('url');
const { extractCouncilDate } = require('./utils/date-extractor');
const { extractDocumentType } = require('./utils/document-type-extractor');
const { ensureDirectory } = require('./utils/file-system');
const { extractPageTitle, generateFolderName } = require('./utils/title-extractor');

const CONFIG_PATH = path.join(__dirname, 'config', 'sources.json');
const METADATA_DIR = path.join(__dirname, '../../data/extracted/metadata');
const DISCOVERED_PDFS_FILE = path.join(METADATA_DIR, 'discovered-pdfs.json');
const PAGES_CACHE_FILE = path.join(METADATA_DIR, 'pages-cache.json');

/**
 * Charge la configuration
 */
async function loadConfig() {
  try {
    const content = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(content);
    config.recursive = config.recursive || {
      enabled: true,
      maxDepth: 10,
      allowedPatterns: [],
      allowedDomains: [],
      discoveryMode: true,
      rateLimit: 2000
    };
    return config;
  } catch (error) {
    console.error('❌ Erreur lors du chargement de la config:', error.message);
    process.exit(1);
  }
}

/**
 * Charge ou crée le cache des PDFs découverts
 */
async function loadDiscoveredPdfs() {
  try {
    const content = await fs.readFile(DISCOVERED_PDFS_FILE, 'utf-8');
    const cache = JSON.parse(content);
    cache.urlSet = new Set(cache.pdfs.map(p => p.normalizedUrl));
    return cache;
  } catch {
    return { pdfs: [], urlSet: new Set() };
  }
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
 * Charge ou crée le cache des pages visitées
 */
async function loadPagesCache() {
  try {
    const content = await fs.readFile(PAGES_CACHE_FILE, 'utf-8');
    const cache = JSON.parse(content);
    cache.visitedUrls = new Set(cache.visitedUrlsArray || []);
    return cache;
  } catch {
    return { visitedUrls: new Set(), visitedUrlsArray: [] };
  }
}

/**
 * Sauvegarde le cache des pages
 */
async function savePagesCache(cache) {
  await ensureDirectory(METADATA_DIR);
  const cacheToSave = {
    ...cache,
    visitedUrlsArray: Array.from(cache.visitedUrls)
  };
  await fs.writeFile(PAGES_CACHE_FILE, JSON.stringify(cacheToSave, null, 2), 'utf-8');
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
 * Ajoute un PDF découvert au cache
 */
function addDiscoveredPdf(cache, pdfUrl, parentUrl, folderPath = null, depth = null, pageTitle = null) {
  const normalizedUrl = normalizeUrl(pdfUrl);
  
  // Vérifier si déjà dans le cache
  if (cache.urlSet.has(normalizedUrl)) {
    return null;
  }
  
  // Extraire la date et le type
  let filename = 'document';
  try {
    filename = path.basename(new URL(pdfUrl).pathname, '.pdf') || 'document';
  } catch {
    // Si l'URL est invalide, utiliser le nom par défaut
  }
  const councilDate = extractCouncilDate(pdfUrl, parentUrl, filename);
  const docType = extractDocumentType(pdfUrl, parentUrl, filename);
  
  // Filtrer : seulement les dates de 2025
  if (!isDate2025(councilDate)) {
    return null; // Ignorer ce PDF
  }
  
  const pdfEntry = {
    url: pdfUrl,
    normalizedUrl: normalizedUrl,
    parentUrl: parentUrl,
    filename: filename,
    councilDate: councilDate,
    documentType: docType,
    discoveredDate: new Date().toISOString(),
    status: 'pending',
    // Structure hiérarchique
    folderPath: folderPath,
    depth: depth,
    pageTitle: pageTitle
  };
  
  cache.pdfs.push(pdfEntry);
  cache.urlSet.add(normalizedUrl);
  return pdfEntry;
}

/**
 * Extrait le domaine depuis une URL
 */
function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Explore une page HTML récursivement
 */
async function explorePage(
  pageUrl,
  parentUrl,
  depth,
  maxDepth,
  visitedUrls,
  config,
  discoveredCache
) {
  // Vérifier la profondeur
  if (depth > maxDepth) {
    return;
  }

  // Normaliser l'URL
  const normalizedUrl = normalizeUrl(pageUrl);
  
  // Vérifier si déjà visité
  if (visitedUrls.has(normalizedUrl)) {
    return;
  }

  visitedUrls.add(normalizedUrl);
  const indent = '  '.repeat(depth);
  console.log(`${indent}📄 Niveau ${depth}: ${pageUrl}`);

  try {
    // Télécharger la page HTML
    const html = await fetchWithRetry(pageUrl, config.settings);
    
    // Extraire le titre de la page pour la structure hiérarchique
    const pageTitle = extractPageTitle(html, pageUrl);
    const folderName = generateFolderName(html, pageUrl);
    
    // Extraire les liens PDF
    const pdfLinks = extractPdfLinks(html, pageUrl);
    console.log(`${indent}  📎 ${pdfLinks.length} PDF(s) trouvé(s)`);

    // Ajouter tous les PDFs découverts avec leur chemin hiérarchique
    let newPdfs = 0;
    for (const pdfUrl of pdfLinks) {
      const pdfEntry = addDiscoveredPdf(discoveredCache, pdfUrl, pageUrl, folderName, depth, pageTitle);
      if (pdfEntry) {
        newPdfs++;
      }
    }
    
    if (newPdfs > 0) {
      console.log(`${indent}  ✅ ${newPdfs} nouveau(x) PDF(s) ajouté(s) au cache`);
    }

    // Si on n'a pas atteint la profondeur max, extraire les liens HTML à suivre
    if (depth < maxDepth && config.recursive.enabled) {
      const sourceDomain = extractDomain(pageUrl);
      const allowedDomains = config.recursive.allowedDomains.length > 0
        ? config.recursive.allowedDomains
        : [sourceDomain];

      const useDiscoveryMode = config.recursive.discoveryMode !== false && 
                               (config.recursive.allowedPatterns.length === 0);
      
      const htmlLinks = extractHtmlLinks(html, pageUrl, {
        allowedPatterns: useDiscoveryMode ? [] : (config.recursive.allowedPatterns || []),
        allowedDomains: allowedDomains
      });

      console.log(`${indent}  🔗 ${htmlLinks.length} page(s) HTML à explorer`);

      // Prioriser les pages de documents
      const documentPages = htmlLinks.filter(link => 
        link.includes('show_documents') || 
        link.includes('documents') ||
        link.includes('ordres') ||
        link.includes('proces') ||
        link.includes('motions')
      );
      
      const otherPages = htmlLinks.filter(link => !documentPages.includes(link));
      const sortedLinks = [...documentPages, ...otherPages];

      // Explorer chaque lien
      for (const htmlLink of sortedLinks) {
        const normalizedLink = normalizeUrl(htmlLink);
        if (!visitedUrls.has(normalizedLink)) {
          await explorePage(
            htmlLink,
            pageUrl,
            depth + 1,
            maxDepth,
            visitedUrls,
            config,
            discoveredCache
          );
          
          // Rate limiting
          await new Promise(resolve => 
            setTimeout(resolve, config.recursive.rateLimit || 2000)
          );
        }
      }
      
      // Sauvegarder périodiquement (toutes les 50 pages)
      if (visitedUrls.size % 50 === 0) {
        await saveDiscoveredPdfs(discoveredCache);
        await savePagesCache({ visitedUrls, visitedUrlsArray: Array.from(visitedUrls) });
        console.log(`\n💾 Cache sauvegardé (${visitedUrls.size} pages, ${discoveredCache.pdfs.length} PDFs)\n`);
      }
    }

  } catch (error) {
    console.error(`${indent}  ❌ Erreur: ${error.message}`);
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔍 PHASE 1 : DÉCOUVERTE DES PDFs\n');
  
  const config = await loadConfig();
  console.log(`📋 ${config.sources.length} source(s) à explorer`);
  console.log(`🔍 Profondeur max: ${config.recursive.maxDepth} niveaux\n`);

  // Charger les caches
  const discoveredCache = await loadDiscoveredPdfs();
  const pagesCache = await loadPagesCache();
  const visitedUrls = pagesCache.visitedUrls;
  
  console.log(`📊 Cache existant: ${discoveredCache.pdfs.length} PDF(s) déjà découvert(s)`);
  console.log(`📊 Pages déjà visitées: ${visitedUrls.size}\n`);

  // Explorer chaque source
  for (const sourceUrl of config.sources) {
    console.log(`\n🌐 Exploration de: ${sourceUrl}\n`);
    await explorePage(
      sourceUrl,
      null,
      0,
      config.recursive.maxDepth || 10,
      visitedUrls,
      config,
      discoveredCache
    );
  }

  // Sauvegarder les caches finaux
  await saveDiscoveredPdfs(discoveredCache);
  await savePagesCache({ visitedUrls, visitedUrlsArray: Array.from(visitedUrls) });

  console.log('\n✨ Découverte terminée !');
  console.log(`📊 Total: ${discoveredCache.pdfs.length} PDF(s) découvert(s)`);
  console.log(`📊 Pages visitées: ${visitedUrls.size}`);
  console.log(`\n💡 Lancez 'node phase-2-download.js' pour télécharger les PDFs`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { main };

