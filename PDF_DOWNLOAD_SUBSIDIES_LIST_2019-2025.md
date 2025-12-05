# Téléchargement des PDFs - Listes de Subsides (2019-2024)

## 📋 Résumé

Ce document décrit la stratégie pour télécharger les PDFs contenant les **listes complètes de subsides/transferts budgétaires** pour les années **2019-2025**, en utilisant le pattern identifié : `*Liste*Transfert*Budget*`.

## 🎯 Fichier Cible Principal

### Pattern Identifié

**Fichier principal utilisé (2025) :**
- `072_Liste_20des_20Transferts_20Budget_202025.pdf`
- **Pattern du nom :** `*Liste*Transfert*Budget*` ou `*Liste*des*Transferts*Budget*`
- **Format :** Liste complète des transferts/subsides avec bénéficiaires, montants et numéros BCE
- **Structure :** Tableau structuré avec colonnes

### Caractéristiques du Fichier

- ✅ **64 numéros BCE** (bénéficiaires)
- ✅ **485 articles budgétaires** (format: `XXXXX/YYYYY`)
- ✅ **Format tabulaire** avec colonnes :
  - Numéro BCE (6 chiffres)
  - Nom du bénéficiaire
  - Statut (ASBL, VZW, etc.)
  - Article budgétaire
  - Montant
  - Objet du subside
- ✅ **63 pages** de données structurées

## 🔍 Autres Fichiers Potentiels (2025)

Ces fichiers peuvent contenir des subsides mais dans des formats différents :

1. **071_Comptabilité générale Compte 202024.pdf**
   - 866 numéros BCE
   - Format : Comptabilité générale (nécessite parsing différent)

2. **070_Budget 202025.pdf**
   - 339 numéros BCE, 1495 articles budgétaires
   - Format : Budget complet (nécessite parsing différent)

3. **071_Feuilleton 99 Modifications budgétaires Compte 202024.pdf**
   - 215 numéros BCE, 816 articles
   - Format : Modifications budgétaires (nécessite parsing différent)

**Note :** Ces fichiers seront traités plus tard si nécessaire.

## 📥 Stratégie de Téléchargement

### Pour les Années 2019-2024

**Pattern à rechercher :**
- `*Liste*Transfert*Budget*`
- `*Liste*des*Transferts*Budget*`
- Variations possibles :
  - `Liste des Transferts Budget YYYY`
  - `Liste Transfert Budget YYYY`
  - `Liste_Transfert_Budget_YYYY`
  - `Liste_20des_20Transferts_20Budget_YYYY` (format URL encodé)

### Structure des URLs

**Format attendu :**
```
https://www.bruxelles.be/sites/default/files/bxl/workflow/DD-MM-YYYY/DD%20MM%20YYYY%20OJ%20point_punt%20(XXX)/XXX_Liste%20des%20Transferts%20Budget%20YYYY.pdf
```

**Exemple (2025) :**
```
https://www.bruxelles.be/sites/default/files/bxl/workflow/23-06-2025/23%2006%202025%20OJ%20point_punt%20(072)/072_Liste%20des%20Transferts%20Budget%202025.pdf
```

### Points d'Attention

1. **Numéro de point OJ :** Le numéro (ex: 072) peut varier selon l'année
2. **Date du conseil :** La date dans l'URL correspond à la date du conseil communal
3. **Encodage URL :** Les espaces sont encodés en `%20` ou `_20`
4. **Format du nom :** Le nom peut varier légèrement (avec/sans "des", etc.)

## 🛠️ Script à Développer

### Fonctionnalités Requises

1. **Découverte automatique :**
   - Parcourir les pages de conseils communaux pour chaque année
   - Identifier les fichiers correspondant au pattern
   - Extraire les URLs des PDFs

2. **Téléchargement :**
   - Télécharger les PDFs identifiés
   - Sauvegarder dans `data/pdfs/raw/YYYYMMDD/Documents du DD-MM-YYYY/`
   - Gérer les erreurs (fichier non trouvé, timeout, etc.)

3. **Extraction :**
   - Convertir les PDFs en JSON (utiliser le script existant)
   - Extraire le texte complet
   - Sauvegarder dans `data/pdfs/json/YYYYMMDD/Documents du DD-MM-YYYY/`

4. **Validation :**
   - Vérifier que le fichier contient des subsides (BCE + articles budgétaires)
   - Compter le nombre de bénéficiaires trouvés
   - Générer un rapport de validation

### Structure du Script

```
scripts/pdf-downloader/
├── 03-download-subsidies-lists.js  # Nouveau script
├── config/
│   └── sources.json                # Configuration des années à traiter
└── utils/
    ├── pattern-matcher.js          # Détection du pattern
    └── validator.js                # Validation des PDFs téléchargés
```

### Configuration

```json
{
  "years": [2019, 2020, 2021, 2022, 2023, 2024],
  "patterns": [
    "*Liste*Transfert*Budget*",
    "*Liste*des*Transferts*Budget*"
  ],
  "outputDir": "data/pdfs/raw",
  "jsonOutputDir": "data/pdfs/json"
}
```

## 📊 Extraction des Données

### Format de Sortie

Une fois les PDFs téléchargés et convertis en JSON, utiliser le script d'extraction :

```bash
node scripts/extract-subsidies-simple.js
```

Ce script extrait :
- ✅ **Bénéficiaire** (nom)
- ✅ **Montant** (montant octroyé)
- ✅ **Numéro BCE** (si disponible)
- ✅ **Article budgétaire** (format: XXXXX/YYYYY)

### Format JSON Généré

```json
{
  "article_budgetaire_begrotingsartikel": "56110/33202",
  "nom_de_la_subvention_naam_van_de_subsidie": "Subside budget ordinaire – Toelage gewone begroting",
  "nom_du_beneficiaire_de_la_subvention_naam_begunstigde_van_de_subsidie": "Brussels Major Events",
  "le_numero_de_bce_du_beneficiaire_de_la_subvention_kbo_nummer_van_de_begunstigde_van_de_subsidie": "155152",
  "objet_du_subside_doel_van_de_subsidie": "",
  "montant_prevu_au_budget_2025_bedrag_voorzien_op_begroting_2025": 150000,
  "montant_octroye_toegekend_bedrag": 150000,
  "l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend": "2025",
  "l_annee_de_fin_d_octroi_de_la_subvention_eindjaar_waarin_de_subsidie_wordt_toegekend": "2025"
}
```

## ✅ Checklist de Développement

- [ ] Créer le script de découverte des fichiers
- [ ] Implémenter le téléchargement des PDFs
- [ ] Ajouter la conversion PDF → JSON
- [ ] Créer le validateur de contenu
- [ ] Générer les rapports de téléchargement
- [ ] Tester sur une année (ex: 2024)
- [ ] Traiter toutes les années 2019-2024
- [ ] Extraire les données avec `extract-subsidies-simple.js`
- [ ] Générer les fichiers `data-YYYY.json` finaux

## 📝 Notes

- Le fichier `072_Liste_20des_20Transferts_20Budget_202025` est le **référence** pour le format attendu
- Les autres fichiers (comptabilité, budget détaillé) seront traités **plus tard** si nécessaire
- L'extraction se concentre sur l'**essentiel** : bénéficiaire, montant, numéro BCE
- Les autres champs (objet, dates, etc.) peuvent être complétés **plus tard**

## 🔗 Références

- Script d'extraction existant : `scripts/extract-subsidies-simple.js`
- Scripts de téléchargement existants : `scripts/pdf-downloader/`
- Fichier de référence : `data/pdfs/json/23062025/Documents du 23-06-2025/072_Liste_20des_20Transferts_20Budget_202025.json`

