"use client"

import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, FileText } from "lucide-react"
import type { ExportColumn } from "@/lib/data-exporter"
import { DEFAULT_COLUMNS, COLUMN_LABELS } from "@/lib/data-exporter"
import type { Subside } from "@/lib/types"

interface ExportDialogProps {
  filteredSubsides: Subside[]
  selectedColumns: ExportColumn[]
  onColumnToggle: (column: ExportColumn) => void
  onSelectAllColumns: () => void
  onExport: (format: 'csv' | 'excel' | 'json' | 'pdf') => void
  isExporting: boolean
}

export function ExportDialog({
  filteredSubsides,
  selectedColumns,
  onColumnToggle,
  onSelectAllColumns,
  onExport,
  isExporting,
}: ExportDialogProps) {
  return (
    <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Exporter les données
        </DialogTitle>
        <DialogDescription>
          Choisissez les colonnes à exporter et le format de fichier
        </DialogDescription>
      </DialogHeader>
      
      {/* Info sur la sélection des subsides */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
        <p className="text-sm font-medium text-green-900">
          {filteredSubsides.length} subside{filteredSubsides.length > 1 ? 's' : ''} {filteredSubsides.length > 1 ? 'seront' : 'sera'} exporté{filteredSubsides.length > 1 ? 's' : ''}
        </p>
      </div>
      
      {/* Sélection de colonnes */}
      <div className="space-y-3 border-t border-b py-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700">Colonnes à exporter</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAllColumns}
            className="text-xs sm:text-sm h-9 sm:h-8 px-3 sm:px-2 min-h-[44px] sm:min-h-0"
          >
            {selectedColumns.length === DEFAULT_COLUMNS.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </Button>
        </div>
        <div className="space-y-0.5 max-h-[300px] overflow-y-auto pr-2">
          {DEFAULT_COLUMNS.map((column) => (
            <label
              key={column}
              className="flex items-center gap-3 p-1.5 rounded-md hover:bg-gray-50 cursor-pointer transition-colors group"
            >
              <input
                type="checkbox"
                checked={selectedColumns.includes(column)}
                onChange={() => onColumnToggle(column)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2 transition-colors"
                aria-label={`Sélectionner la colonne ${COLUMN_LABELS[column]}`}
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">{COLUMN_LABELS[column]}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {selectedColumns.length} colonne{selectedColumns.length > 1 ? 's' : ''} sélectionnée{selectedColumns.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Boutons d'export */}
      <div className="space-y-3">
        <Button
          onClick={() => onExport('csv')}
          disabled={isExporting || selectedColumns.length === 0 || filteredSubsides.length === 0}
          className="w-full flex items-center justify-center gap-2 text-gray-800 font-medium transition-all min-h-[44px] text-sm sm:text-base"
          aria-label="Exporter en CSV (compatible Excel)"
          style={{
            backgroundColor: '#A7F3D0',
            borderColor: '#6EE7B7',
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#86EFAC'
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#A7F3D0'
            }
          }}
        >
          <Download className="w-4 h-4" />
          CSV
          <span className="text-xs opacity-75">(Excel compatible)</span>
        </Button>

        <Button
          onClick={() => onExport('excel')}
          disabled={isExporting || selectedColumns.length === 0 || filteredSubsides.length === 0}
          className="w-full flex items-center justify-center gap-2 text-gray-800 font-medium transition-all min-h-[44px] text-sm sm:text-base"
          aria-label="Exporter en Excel (XLSX)"
          style={{
            backgroundColor: '#BFDBFE',
            borderColor: '#93C5FD',
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#93C5FD'
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#BFDBFE'
            }
          }}
        >
          <Download className="w-4 h-4" />
          Excel (XLSX)
        </Button>

        <Button
          onClick={() => onExport('json')}
          disabled={isExporting || selectedColumns.length === 0 || filteredSubsides.length === 0}
          className="w-full flex items-center justify-center gap-2 text-gray-800 font-medium transition-all min-h-[44px] text-sm sm:text-base"
          aria-label="Exporter en JSON (pour développeurs)"
          style={{
            backgroundColor: '#E9D5FF',
            borderColor: '#D8B4FE',
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#D8B4FE'
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#E9D5FF'
            }
          }}
        >
          <Download className="w-4 h-4" />
          JSON
          <span className="text-xs opacity-75">(Développeurs)</span>
        </Button>

        <Button
          onClick={() => onExport('pdf')}
          disabled={isExporting || selectedColumns.length === 0 || filteredSubsides.length === 0}
          className="w-full flex items-center justify-center gap-2 text-gray-800 font-semibold transition-all"
          aria-label="Exporter en PDF (résumé)"
          style={{
            backgroundColor: '#FBCFE8',
            borderColor: '#F9A8D4',
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#F9A8D4'
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#FBCFE8'
            }
          }}
        >
          <FileText className="w-4 h-4" />
          PDF
          <span className="text-xs opacity-75">(summary)</span>
        </Button>
      </div>

      {isExporting && (
        <div className="text-center text-sm text-gray-500 mt-2">
          Export en cours...
        </div>
      )}
    </DialogContent>
  )
}

