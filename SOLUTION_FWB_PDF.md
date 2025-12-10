# Solution : Lien direct vers les PDFs FWB

## 🎯 Objectif

Pointer directement vers le PDF de l'accord de subside FWB pour chaque association, avec un fallback vers la page de liste si le PDF n'est pas disponible.

## ✅ Solution implémentée

### 1. Script de génération du mapping (`scripts/generate-fwb-pdf-mapping.js`)

Ce script :
- Cherche dans les PDFs JSON les organisations FWB
- Trouve les PDFs correspondants
- Génère un fichier `public/fwb-pdf-mapping.json` avec les URLs des PDFs

**Utilisation :**
```bash
node scripts/generate-fwb-pdf-mapping.js
```

### 2. Fonction `getFWBUrl()` améliorée

La fonction utilise maintenant une stratégie en 3 étapes :

1. **PDF défini dans l'organisation** → Utilise directement `org.pdfUrl`
2. **PDF trouvé dans le mapping** → Charge le mapping JSON et utilise l'URL trouvée
3. **Fallback** → Retourne la page de liste FWB

### 3. Comportement

- **Si PDF disponible** : Le bouton FWB ouvre directement le PDF dans un nouvel onglet
- **Si PDF non disponible** : Le bouton FWB ouvre la page de liste FWB

## 📋 Étapes pour activer

### Étape 1 : Générer le mapping

```bash
node scripts/generate-fwb-pdf-mapping.js
```

Cela créera `public/fwb-pdf-mapping.json` avec les correspondances.

### Étape 2 : Vérifier le mapping

Le fichier généré contiendra :
```json
{
  "ASBL Jazz Station": "https://www.bruxelles.be/.../pdf.pdf",
  "ASBL Listen (Listen Festival)": "https://www.bruxelles.be/.../pdf.pdf",
  ...
}
```

### Étape 3 : Tester

1. Ouvrir l'application
2. Chercher une organisation FWB (ex: "Jazz Station")
3. Cliquer sur le bouton FWB dans le dialog
4. Vérifier que le PDF s'ouvre directement (ou la page de liste si pas de PDF)

## ⚠️ Risques et limitations

### Risques identifiés

1. **PDFs peuvent ne pas exister** : Certaines organisations peuvent ne pas avoir de PDF dans la base
   - ✅ **Mitigé** : Fallback vers la page de liste

2. **URLs peuvent changer** : Les URLs des PDFs sur bruxelles.be peuvent changer
   - ✅ **Mitigé** : Le script peut être relancé pour régénérer le mapping

3. **Matching peut être imparfait** : Le matching par nom peut rater certaines correspondances
   - ✅ **Mitigé** : Le script peut être amélioré manuellement si nécessaire

4. **PDFs peuvent être supprimés** : Les PDFs peuvent être retirés du site
   - ✅ **Mitigé** : Fallback vers la page de liste si le PDF ne charge pas

### Limitations

- Le mapping doit être régénéré quand de nouveaux PDFs sont ajoutés
- Le matching par nom peut nécessiter des ajustements manuels pour certains cas

## 🔄 Maintenance

### Régénérer le mapping

Quand de nouveaux PDFs sont disponibles :

```bash
node scripts/generate-fwb-pdf-mapping.js
```

### Ajouter des PDFs manuellement

Si vous connaissez l'URL d'un PDF spécifique, vous pouvez l'ajouter directement dans `src/lib/fwb-organizations.ts` :

```typescript
{ 
  name: "ASBL Jazz Station", 
  type: "contrat-programme", 
  period: "2024-2028",
  pdfUrl: "https://www.bruxelles.be/.../pdf.pdf" // ← Ajouter ici
}
```

## 📊 Statistiques

Après génération du mapping, vous verrez :
- Nombre d'organisations avec PDFs trouvés
- Exemples de correspondances
- Fichier JSON généré dans `public/fwb-pdf-mapping.json`

## ✅ Avantages

1. **Expérience utilisateur améliorée** : Accès direct au PDF au lieu de chercher dans la liste
2. **Transparence** : Lien direct vers le document officiel
3. **Fallback sûr** : Si le PDF n'existe pas, on tombe sur la page de liste
4. **Maintenance simple** : Script réutilisable pour régénérer le mapping

