import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Subside } from './types'

/**
 * Colonnes disponibles pour l'export
 */
export type ExportColumn = 
  | 'nom_subvention'
  | 'article_complet'
  | 'beneficiaire'
  | 'numero_bce'
  | 'objet'
  | 'montant_prevu'
  | 'montant_octroye'
  | 'annee_debut'
  | 'annee_fin'
  | 'source_url_open_data'
  | 'source_url_north_data'
  | 'source_url_kbo'

/**
 * Mapping des colonnes vers leurs labels
 */
export const COLUMN_LABELS: Record<ExportColumn, string> = {
  nom_subvention: 'Nom de la subvention',
  article_complet: 'Article complet',
  beneficiaire: 'Bénéficiaire',
  numero_bce: 'Numéro BCE',
  objet: 'Objet de la subvention',
  montant_prevu: 'Montant prévu au budget',
  montant_octroye: 'Montant octroyé',
  annee_debut: 'Année de début',
  annee_fin: 'Année de fin',
  source_url_open_data: 'Source',
  source_url_north_data: 'North Data',
  source_url_kbo: 'Registre KBO',
}

/**
 * Colonnes par défaut (toutes)
 */
export const DEFAULT_COLUMNS: ExportColumn[] = [
  'nom_subvention',
  'article_complet',
  'beneficiaire',
  'numero_bce',
  'objet',
  'montant_prevu',
  'montant_octroye',
  'annee_debut',
  'annee_fin',
  'source_url_open_data',
  'source_url_north_data',
  'source_url_kbo',
]

/**
 * Options pour l'export de données
 */
export interface ExportOptions {
  /** Données à exporter */
  data: Subside[]
  /** Nom du fichier (sans extension) */
  filename?: string
  /** Filtres appliqués (pour les métadonnées) */
  filters?: {
    year?: string
    category?: string
    searchTerm?: string
  }
  /** Inclure les métadonnées dans le fichier */
  includeMetadata?: boolean
  /** Colonnes à exporter (par défaut: toutes) */
  selectedColumns?: ExportColumn[]
}

/**
 * Calcule les totaux des montants
 */
function calculateTotals(data: Subside[]): {
  totalOctroye: number
  totalPrevu: number
} {
  const totalOctroye = data.reduce((sum, s) => sum + s.montant_octroye_toegekend_bedrag, 0)
  const totalPrevu = data.reduce((sum, s) => sum + s.montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023, 0)
  return { totalOctroye, totalPrevu }
}

/**
 * Formate un montant pour l'affichage (format manuel pour éviter les problèmes de rendu PDF)
 */
function formatAmount(amount: number): string {
  // Formatage manuel avec espaces comme séparateurs de milliers
  // Plus fiable que Intl.NumberFormat pour le PDF
  const parts = Math.abs(amount).toString().split('.')
  let integerPart = parts[0]
  
  // Ajouter des espaces comme séparateurs de milliers
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  
  const sign = amount < 0 ? '-' : ''
  return `${sign}${integerPart} €`
}

/**
 * Génère un nom de fichier dynamique basé sur les filtres (format court)
 * Format: subside-[terme-recherche]-[année(s)]
 * Exemple: subside-hangar-2021 ou subside-2021-2025
 */
function generateFilename(
  baseName: string,
  filters?: ExportOptions['filters'],
  format: 'csv' | 'excel' | 'json' | 'pdf' = 'csv'
): string {
  const parts: string[] = ['subside'] // Nom de base simplifié
  
  // Ajouter le terme de recherche si présent (en premier, c'est le plus important)
  if (filters?.searchTerm && filters.searchTerm.trim()) {
    // Nettoyer le terme de recherche pour le système de fichiers
    const cleanSearch = filters.searchTerm
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20) // Limiter à 20 caractères pour garder le nom court
    if (cleanSearch) {
      parts.push(cleanSearch)
    }
  }
  
  // Ajouter l'année si filtrée (format simple: juste l'année)
  if (filters?.year && filters.year !== 'all') {
    parts.push(filters.year)
  }
  
  // Note: On ne met plus la catégorie dans le nom pour le garder court
  // Note: On ne met plus la date pour le garder court
  
  // Joindre les parties et ajouter l'extension
  const filename = parts.join('-')
  const extensions = {
    csv: 'csv',
    excel: 'xlsx',
    json: 'json',
    pdf: 'pdf'
  }
  
  return `${filename}.${extensions[format]}`
}

/**
 * Génère les métadonnées de l'export
 */
function generateMetadata(options: ExportOptions): string {
  const { filters, data } = options
  const totals = calculateTotals(data)
  const metadata = [
    `Export généré le: ${new Date().toLocaleString('fr-BE')}`,
    `Nombre de subsides: ${data.length}`,
    `Total montant octroyé: ${formatAmount(totals.totalOctroye)}`,
    `Total montant prévu: ${formatAmount(totals.totalPrevu)}`,
  ]

  if (filters) {
    if (filters.year && filters.year !== 'all') {
      metadata.push(`Année: ${filters.year}`)
    } else if (filters.year === 'all') {
      metadata.push(`Année: Toutes les années`)
    }
    if (filters.category && filters.category !== 'all') {
      metadata.push(`Catégorie: ${filters.category}`)
    }
    if (filters.searchTerm) {
      metadata.push(`Recherche: "${filters.searchTerm}"`)
    }
  }

  return metadata.join('\n')
}

/**
 * Mapping des colonnes vers les valeurs des subsides
 */
const COLUMN_MAPPING: Record<ExportColumn, (subside: Subside) => unknown> = {
  nom_subvention: (s) => s.nom_de_la_subvention_naam_van_de_subsidie,
  article_complet: (s) => s.article_complet_volledig_artikel,
  beneficiaire: (s) => s.beneficiaire_begunstigde,
  numero_bce: (s) => s.le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie || '',
  objet: (s) => s.l_objet_de_la_subvention_doel_van_de_subsidie,
  montant_prevu: (s) => s.montant_prevu_au_budget_2023_bedrag_voorzien_op_begroting_2023,
  montant_octroye: (s) => s.montant_octroye_toegekend_bedrag,
  annee_debut: (s) => s.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend,
  annee_fin: (s) => s.l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend,
  source_url_open_data: (s) => s.source_url_open_data || '',
  source_url_north_data: (s) => s.source_url_north_data || '',
  source_url_kbo: (s) => s.source_url_kbo || '',
}

/**
 * Prépare les données pour l'export (aplatit les objets avec sélection de colonnes)
 */
function prepareDataForExport(
  data: Subside[],
  selectedColumns: ExportColumn[] = DEFAULT_COLUMNS
): Record<string, unknown>[] {
  return data.map((subside) => {
    const row: Record<string, unknown> = {}
    selectedColumns.forEach((column) => {
      const label = COLUMN_LABELS[column]
      const value = COLUMN_MAPPING[column](subside)
      row[label] = value
    })
    return row
  })
}

/**
 * Exporte les données en CSV
 */
export function exportToCSV(options: ExportOptions): void {
  const { 
    data, 
    filename = 'subside', 
    includeMetadata = true,
    selectedColumns = DEFAULT_COLUMNS 
  } = options

  if (data.length === 0) {
    console.warn('Aucune donnée à exporter')
    return
  }

  if (selectedColumns.length === 0) {
    console.warn('Aucune colonne sélectionnée')
    return
  }

  try {
    const preparedData = prepareDataForExport(data, selectedColumns)
    let csvContent = ''

    // Ajouter les métadonnées si demandé
    if (includeMetadata) {
      const metadata = generateMetadata(options)
      csvContent = `# ${metadata.replace(/\n/g, '\n# ')}\n\n`
    }

    // Générer le CSV avec échappement automatique des guillemets
    const csv = Papa.unparse(preparedData, {
      header: true,
      delimiter: ',',
      newline: '\n',
      quoteChar: '"',
      escapeChar: '"',
    })

    csvContent += csv

    // Ajouter une ligne de total si les colonnes de montants sont présentes
    const hasMontantOctroye = selectedColumns.includes('montant_octroye')
    const hasMontantPrevu = selectedColumns.includes('montant_prevu')
    if (hasMontantOctroye || hasMontantPrevu) {
      const totals = calculateTotals(data)
      const totalRow: Record<string, unknown> = {}
      
      selectedColumns.forEach((col) => {
        const label = COLUMN_LABELS[col]
        if (col === 'montant_octroye') {
          totalRow[label] = `TOTAL: ${formatAmount(totals.totalOctroye)}`
        } else if (col === 'montant_prevu') {
          totalRow[label] = `TOTAL: ${formatAmount(totals.totalPrevu)}`
        } else {
          totalRow[label] = ''
        }
      })
      
      csvContent += '\n'
      const totalCsv = Papa.unparse([totalRow], {
        header: false,
        delimiter: ',',
        newline: '\n',
        quoteChar: '"',
        escapeChar: '"',
      })
      csvContent += totalCsv
    }

    // Créer le blob et télécharger
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }) // BOM pour Excel
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = generateFilename(filename, options.filters, 'csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Erreur lors de l\'export CSV:', error)
    throw new Error('Impossible d\'exporter en CSV')
  }
}

/**
 * Exporte les données en Excel (XLSX)
 */
export function exportToExcel(options: ExportOptions): void {
  const { 
    data, 
    filename = 'subside', 
    includeMetadata = true,
    selectedColumns = DEFAULT_COLUMNS 
  } = options

  if (data.length === 0) {
    console.warn('Aucune donnée à exporter')
    return
  }

  if (selectedColumns.length === 0) {
    console.warn('Aucune colonne sélectionnée')
    return
  }

  try {
    const preparedData = prepareDataForExport(data, selectedColumns)
    
    // Vérifier que les données sont bien préparées
    if (!preparedData || preparedData.length === 0) {
      console.error('Aucune donnée préparée pour l\'export Excel')
      throw new Error('Impossible de préparer les données pour l\'export')
    }

    // Créer un nouveau workbook
    const workbook = XLSX.utils.book_new()

    // Créer la feuille de données en premier (feuille principale)
    const dataSheet = XLSX.utils.json_to_sheet(preparedData)
    
    // Vérifier que la feuille a été créée correctement
    if (!dataSheet || !dataSheet['!ref']) {
      console.error('Erreur lors de la création de la feuille Excel')
      console.error('Données préparées:', preparedData.slice(0, 2)) // Log des 2 premières lignes pour debug
      throw new Error('Impossible de créer la feuille de données')
    }
    
    // Ajouter la feuille de données au workbook en premier
    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Subsides')

    // Ajouter les métadonnées si demandé (en deuxième feuille)
    if (includeMetadata) {
      const metadata = generateMetadata(options)
      const metadataRows = metadata.split('\n').map((line) => [line])
      const metadataSheet = XLSX.utils.aoa_to_sheet(metadataRows)
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Métadonnées')
    }
    
    // Ajouter une ligne de total si les colonnes de montants sont présentes
    const hasMontantOctroye = selectedColumns.includes('montant_octroye')
    const hasMontantPrevu = selectedColumns.includes('montant_prevu')
    if (hasMontantOctroye || hasMontantPrevu) {
      const totals = calculateTotals(data)
      const totalRow: Record<string, unknown> = {}
      
      selectedColumns.forEach((col) => {
        const label = COLUMN_LABELS[col]
        if (col === 'montant_octroye') {
          totalRow[label] = `TOTAL: ${formatAmount(totals.totalOctroye)}`
        } else if (col === 'montant_prevu') {
          totalRow[label] = `TOTAL: ${formatAmount(totals.totalPrevu)}`
        } else {
          totalRow[label] = ''
        }
      })
      
      // Ajouter la ligne de total à la feuille
      const totalRowArray = selectedColumns.map(col => {
        const label = COLUMN_LABELS[col]
        return totalRow[label]
      })
      XLSX.utils.sheet_add_aoa(dataSheet, [totalRowArray], { origin: -1 })
      
      // Mettre en forme la ligne de total (gras)
      const lastRowIndex = preparedData.length + 1
      selectedColumns.forEach((col, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: lastRowIndex, c: colIndex })
        if (!dataSheet[cellAddress]) return
        dataSheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E5E7EB' } } // Gris clair
        }
      })
    }
    
    // Ajuster la largeur des colonnes selon les colonnes sélectionnées
    const colWidthsMap: Record<ExportColumn, number> = {
      nom_subvention: 30,
      article_complet: 20,
      beneficiaire: 40,
      numero_bce: 15,
      objet: 40,
      montant_prevu: 20,
      montant_octroye: 20,
      annee_debut: 12,
      annee_fin: 12,
      source_url_open_data: 80,
      source_url_north_data: 50,
      source_url_kbo: 60,
    }
    const colWidths = selectedColumns.map((col) => ({ wch: colWidthsMap[col] }))
    dataSheet['!cols'] = colWidths

    // Générer le fichier et télécharger
    XLSX.writeFile(workbook, generateFilename(filename, options.filters, 'excel'))
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error)
    throw new Error('Impossible d\'exporter en Excel')
  }
}

/**
 * Exporte les données en JSON
 */
export function exportToJSON(options: ExportOptions): void {
  const { 
    data, 
    filename = 'subside', 
    includeMetadata = true,
    selectedColumns = DEFAULT_COLUMNS 
  } = options

  if (data.length === 0) {
    console.warn('Aucune donnée à exporter')
    return
  }

  if (selectedColumns.length === 0) {
    console.warn('Aucune colonne sélectionnée')
    return
  }

  try {
    // Utiliser prepareDataForExport pour être cohérent avec CSV et Excel
    const preparedData = prepareDataForExport(data, selectedColumns)

    const exportData: {
      metadata?: {
        exportDate: string
        count: number
        filters?: ExportOptions['filters']
        columns?: string[]
      }
      data: Record<string, unknown>[]
    } = {
      data: preparedData,
    }

    // Ajouter les métadonnées si demandé
    if (includeMetadata) {
      exportData.metadata = {
        exportDate: new Date().toISOString(),
        count: data.length,
        filters: options.filters,
        columns: selectedColumns.map(col => COLUMN_LABELS[col]),
      }
    }

    // Créer le blob et télécharger
    const jsonContent = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = generateFilename(filename, options.filters, 'json')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Erreur lors de l\'export JSON:', error)
    throw new Error('Impossible d\'exporter en JSON')
  }
}

/**
 * Exporte les données en PDF (stylé et raffiné)
 */
export function exportToPDF(options: ExportOptions): void {
  const { 
    data, 
    filename = 'subside', 
    includeMetadata = true
  } = options

  if (data.length === 0) {
    console.warn('Aucune donnée à exporter')
    return
  }

  try {
    // Pour le PDF, on utilise : bénéficiaire, objet (description/raison), montant octroyé, année de début, et article
    const pdfColumns: ExportColumn[] = ['beneficiaire', 'objet', 'montant_octroye', 'annee_debut', 'article_complet']
    
    // Créer un nouveau document PDF en format paysage pour plus d'espace
    const doc = new jsPDF('landscape', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // Couleurs stylées (tuples pour TypeScript)
    const primaryColor: [number, number, number] = [59, 130, 246] // Bleu #3B82F6
    const headerColor: [number, number, number] = [15, 23, 42] // Slate 900
    const lightGray: [number, number, number] = [241, 245, 249] // Slate 100
    const borderColor: [number, number, number] = [226, 232, 240] // Slate 200

    let yPosition = 15

    // En-tête stylé avec gradient (réduit pour plus d'espace)
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, pageWidth, 30, 'F') // Réduit de 35 à 30
    
    // Titre principal (réduit pour plus d'espace)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20) // Réduit de 24 à 20
    doc.setFont('helvetica', 'bold')
    doc.text('Subsides de Bruxelles', 10, 18) // Ajusté
    
    // Sous-titre
    doc.setFontSize(10) // Réduit de 12 à 10
    doc.setFont('helvetica', 'normal')
    doc.text('Rapport d\'export des données', 10, 25) // Ajusté

    // Date d'export
    const exportDate = new Date().toLocaleDateString('fr-BE', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    doc.text(`Exporté le: ${exportDate}`, pageWidth - 10, 18, { align: 'right' })
    doc.text(`${data.length} subsides`, pageWidth - 10, 25, { align: 'right' })

    yPosition = 38 // Réduit de 45 à 38

    // Métadonnées (si demandées)
    if (includeMetadata) {
      const totals = calculateTotals(data)
      doc.setTextColor(15, 23, 42)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      
      const metadataLines: string[] = []
      
      // Ajouter les totaux
      metadataLines.push(`Total montant octroyé: ${formatAmount(totals.totalOctroye)}`)
      metadataLines.push(`Total montant prévu: ${formatAmount(totals.totalPrevu)}`)
      
      if (options.filters) {
        if (options.filters.year && options.filters.year !== 'all') {
          metadataLines.push(`Année: ${options.filters.year}`)
        } else if (options.filters.year === 'all') {
          metadataLines.push('Année: Toutes les années')
        }
        if (options.filters.category && options.filters.category !== 'all') {
          metadataLines.push(`Catégorie: ${options.filters.category}`)
        }
        if (options.filters.searchTerm) {
          metadataLines.push(`Recherche: "${options.filters.searchTerm}"`)
        }
      }

      if (metadataLines.length > 0) {
        // Ajuster la hauteur selon le nombre de lignes (2 lignes de totaux + filtres)
        const boxHeight = Math.max(10, metadataLines.length * 3.5 + 3)
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2])
        doc.roundedRect(10, yPosition, pageWidth - 20, boxHeight, 3, 3, 'F')
        
        doc.setTextColor(15, 23, 42)
        doc.setFontSize(8) // Réduit de 9 à 8
        doc.setFont('helvetica', 'normal')
        // Afficher les métadonnées sur plusieurs lignes si nécessaire
        metadataLines.forEach((line, index) => {
          doc.text(line, 12, yPosition + 5 + (index * 3.5))
        })
        
        yPosition += boxHeight + 4 // Réduit de 6 à 4
      }
    }

    // Préparer les données pour le tableau (utiliser uniquement les colonnes PDF)
    const preparedData = prepareDataForExport(data, pdfColumns)
    
    // En-têtes du tableau
    const headers = pdfColumns.map(col => COLUMN_LABELS[col])
    
    // Corps du tableau
    const tableData = preparedData.map(row => 
      pdfColumns.map(col => {
        const label = COLUMN_LABELS[col]
        const value = row[label]
        
        // Formater les valeurs pour le PDF
        if (value === null || value === undefined) return ''
        if (typeof value === 'number') {
          // Formater les montants avec séparateurs de milliers (espaces) et symbole €
          // Formatage manuel pour éviter les problèmes de rendu PDF avec Intl.NumberFormat
          const parts = Math.abs(value).toString().split('.')
          let integerPart = parts[0]
          
          // Ajouter des espaces comme séparateurs de milliers
          integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
          
          const sign = value < 0 ? '-' : ''
          return `${sign}${integerPart} €`
        }
        if (typeof value === 'string') {
          // Limiter uniquement les URLs (les autres textes seront affichés en entier avec wrapping)
          if (value.startsWith('http')) {
            // Tronquer les URLs très longues pour éviter les problèmes d'affichage
            return value.length > 60 ? value.substring(0, 57) + '...' : value
          }
          // Pour tous les autres textes, retourner le texte complet
          // autoTable gérera le wrapping automatique avec overflow: 'linebreak'
          // La colonne objet a une configuration spéciale pour permettre plusieurs lignes
          return value
        }
        return String(value)
      })
    )

    // Ajouter une ligne de total (montant octroyé est toujours présent dans le PDF)
    const totals = calculateTotals(data)
    
    // Créer la ligne de total
    const totalRow: string[] = pdfColumns.map(col => {
      if (col === 'montant_octroye') {
        return `TOTAL: ${formatAmount(totals.totalOctroye)}`
      } else {
        return ''
      }
    })

    // Calculer les largeurs de colonnes pour les 5 colonnes PDF
    const availableWidth = pageWidth - 20 // Marges gauche et droite
    const columnWidths: Record<number, number> = {
      0: availableWidth * 0.22, // bénéficiaire (22%) - réduit pour donner plus d'espace à l'objet
      1: availableWidth * 0.35, // objet/description (35%) - augmenté pour plus d'espace
      2: availableWidth * 0.15, // montant_octroye (15%)
      3: availableWidth * 0.10, // annee_debut (10%)
      4: availableWidth * 0.18, // article_complet (18%) - légèrement réduit
    }
    
    // Créer le mapping des styles de colonnes avec configuration spécifique pour l'objet
    const columnStyles: Record<number, { 
      cellWidth?: number
      fontSize?: number
      overflow?: 'linebreak' | 'ellipsize' | 'visible' | 'hidden'
      minCellHeight?: number
    }> = {}
    pdfColumns.forEach((col, idx) => {
      if (col === 'objet') {
        // Configuration spéciale pour la colonne objet : wrapping forcé et hauteur minimale
        columnStyles[idx] = {
          cellWidth: columnWidths[idx],
          fontSize: 7, // Police plus petite pour l'objet
          overflow: 'linebreak', // Forcer le retour à la ligne
          minCellHeight: 8, // Hauteur minimale pour permettre plusieurs lignes
        }
      } else {
        columnStyles[idx] = {
          cellWidth: columnWidths[idx],
          fontSize: 8,
        }
      }
    })

    // Créer le tableau stylé
    autoTable(doc, {
      head: [headers],
      body: [...tableData, totalRow],
      startY: yPosition,
      margin: { left: 10, right: 10, top: yPosition },
      styles: {
        font: 'helvetica',
        fontSize: 7, // Taille légèrement réduite pour 5 colonnes
        cellPadding: 2, // Padding réduit pour plus d'espace
        textColor: [15, 23, 42],
        overflow: 'linebreak', // Permet le retour à la ligne automatique pour afficher tout le texte
        cellWidth: 'wrap', // S'adapte au contenu
        halign: 'left',
        valign: 'top', // Aligné en haut pour meilleure lisibilité avec plusieurs lignes
      },
      headStyles: {
        fillColor: headerColor as [number, number, number],
        textColor: [255, 255, 255] as [number, number, number],
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 4,
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // Slate 50
      },
      bodyStyles: {
        fillColor: false,
      },
      didParseCell: (data) => {
        // Mettre en forme la ligne de total
        if (data.row.index === tableData.length) {
          data.cell.styles.fillColor = [229, 231, 235] // Gris clair
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fontSize = 9
          data.cell.styles.textColor = [15, 23, 42]
        }
        
        // Configuration spéciale pour la colonne "objet" (index 1)
        if (data.column.index === 1) {
          // Forcer le wrapping pour la colonne objet
          data.cell.styles.overflow = 'linebreak'
          data.cell.styles.cellWidth = columnWidths[1] // Largeur fixe pour permettre le wrapping
          data.cell.styles.fontSize = 7
          data.cell.styles.minCellHeight = 8
          // Le overflow: 'linebreak' permet déjà la division automatique des mots longs
        } else {
          // Pour les autres colonnes, configuration standard
          data.cell.styles.overflow = 'linebreak'
          data.cell.styles.cellWidth = 'wrap'
        }
      },
      columnStyles,
      theme: 'striped',
      showHead: 'everyPage',
      pageBreak: 'auto',
      rowPageBreak: 'avoid',
      tableWidth: 'wrap', // S'adapte à la largeur disponible
    })

    // Pied de page stylé
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      const pageHeight = doc.internal.pageSize.getHeight()
      
      // Ligne de séparation
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2])
      doc.setLineWidth(0.5)
      doc.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15)
      
      // Numéro de page
      doc.setTextColor(100, 116, 139) // Slate 500
      doc.setFontSize(8) // Réduit de 9 à 8
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Page ${i} sur ${pageCount}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      )
      
      // Logo ou texte en bas
      doc.setTextColor(148, 163, 184) // Slate 400
      doc.setFontSize(7) // Réduit de 8 à 7
      doc.text(
        'Subsides de Bruxelles - Open Data Brussels',
        pageWidth - 10,
        pageHeight - 8,
        { align: 'right' }
      )
    }

    // Télécharger le PDF
    doc.save(generateFilename(filename, options.filters, 'pdf'))
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error)
    throw new Error('Impossible d\'exporter en PDF')
  }
}

/**
 * Exporte les données dans le format spécifié
 */
export function exportData(
  format: 'csv' | 'excel' | 'json' | 'pdf',
  options: ExportOptions
): void {
  try {
    switch (format) {
      case 'csv':
        exportToCSV(options)
        break
      case 'excel':
        exportToExcel(options)
        break
      case 'json':
        exportToJSON(options)
        break
      case 'pdf':
        exportToPDF(options)
        break
      default:
        throw new Error(`Format d'export non supporté: ${format}`)
    }
  } catch (error) {
    console.error(`Erreur lors de l'export ${format}:`, error)
    throw error
  }
}

