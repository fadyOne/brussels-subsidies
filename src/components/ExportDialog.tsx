"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download } from "lucide-react"
import type { Subside } from "@/lib/types"
import type { ExportColumn } from "@/lib/data-exporter"

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
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel' | 'json' | 'pdf'>('csv')

  const allColumns: ExportColumn[] = [
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

  const columnLabels: Record<ExportColumn, string> = {
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

  return (
    <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Exporter les données</DialogTitle>
        <DialogDescription>
          {filteredSubsides.length} subside{filteredSubsides.length > 1 ? 's' : ''} à exporter
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* Format selection */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Format</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['csv', 'excel', 'json', 'pdf'] as const).map((format) => (
              <Button
                key={format}
                variant={selectedFormat === format ? 'default' : 'outline'}
                onClick={() => setSelectedFormat(format)}
                className="capitalize"
              >
                {format}
              </Button>
            ))}
          </div>
        </div>

        {/* Column selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Colonnes à exporter</h3>
            <Button variant="ghost" size="sm" onClick={onSelectAllColumns}>
              {selectedColumns.length === allColumns.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </Button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
            {allColumns.map((column) => (
              <div key={column} className="flex items-center space-x-2">
                <Checkbox
                  id={column}
                  checked={selectedColumns.includes(column)}
                  onChange={() => onColumnToggle(column)}
                />
                <label
                  htmlFor={column}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {columnLabels[column]}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Export button */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            onClick={() => onExport(selectedFormat)}
            disabled={isExporting || selectedColumns.length === 0 || filteredSubsides.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Export en cours...' : `Exporter en ${selectedFormat.toUpperCase()}`}
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}

