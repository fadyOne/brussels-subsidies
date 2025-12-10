"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Share2, Copy, Check } from "lucide-react"

interface ShareDialogProps {
  selectedDataYear: string
  searchTerm: string
  onCopyLink: () => void
}

export function ShareDialog({
  selectedDataYear,
  searchTerm,
  onCopyLink,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopyLink()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareUrl = typeof window !== 'undefined' 
    ? new URL(window.location.href).toString()
    : ''

  const shareText = `Découvrez les subsides de Bruxelles${searchTerm ? ` pour "${searchTerm}"` : ''}${selectedDataYear !== 'all' ? ` en ${selectedDataYear}` : ''}`

  return (
    <DialogContent className="w-[95vw] sm:w-full max-w-md">
      <DialogHeader>
        <DialogTitle>Partager cette vue</DialogTitle>
        <DialogDescription>
          Partagez cette recherche avec d'autres personnes
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Lien</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm border rounded-md bg-gray-50"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Social sharing */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Partager sur</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
                window.open(url, '_blank')
              }}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Twitter
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
                window.open(url, '_blank')
              }}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
                window.open(url, '_blank')
              }}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                navigator.share?.({
                  title: 'Subsides Radar',
                  text: shareText,
                  url: shareUrl,
                }).catch(() => {})
              }}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Autre
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  )
}

