# PDF Downloader Script

Script pour télécharger des PDFs depuis des URLs et extraire leurs données.

## Installation

```bash
npm install node-fetch cheerio pdf-parse crypto
# ou
pnpm add node-fetch cheerio pdf-parse crypto
```

## Configuration

1. Copiez le fichier d'exemple :
```bash
cp config/sources.json.example config/sources.json
```

2. Éditez `config/sources.json` et ajoutez vos URLs :
```json
{
  "sources": [
    "https://example.com/page1.html",
    "https://example.com/page2.html"
  ]
}
```

## Utilisation

```bash
node download-pdfs.js
```

Le script va :
1. Télécharger chaque page source
2. Extraire tous les liens PDF
3. Télécharger chaque PDF
4. Stocker dans `/data/pdfs/raw/{year}/`
5. Enregistrer les métadonnées dans `/data/extracted/metadata/index.json`

## Structure des données

- PDFs bruts : `/data/pdfs/raw/{year}/{filename}.pdf`
- Métadonnées : `/data/extracted/metadata/index.json`
- Cache : `/data/cache/` (pour éviter les re-téléchargements)

