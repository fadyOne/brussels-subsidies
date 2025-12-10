# Implémentation : Badge FWB sur les cartes de subsides

## ✅ Ce qui a été fait

### 1. Création du module FWB (`src/lib/fwb-organizations.ts`)

- **Liste complète** des 67 organisations FWB (tous types de contrats)
- **Fonction `isFWBOrganization()`** : Vérifie si un bénéficiaire fait partie de la liste FWB
- **Fonction `findFWBOrganization()`** : Trouve l'organisation FWB correspondante
- **Fonction `getFWBUrl()`** : Génère l'URL vers la page FWB ou le PDF (à compléter plus tard)
- **Normalisation des noms** : Utilise la même logique que le reste de l'app pour gérer les variantes

### 2. Badge FWB sur les cartes de la liste

**Emplacement** : À côté du nom du bénéficiaire, en haut à droite de chaque carte

**Apparence** :
- Badge orange-rouge avec dégradé : `from-orange-500 to-red-500`
- Texte "FWB" en blanc, gras
- Taille : `text-[8px] sm:text-[9px]` (très petit pour ne pas encombrer)
- Tooltip : "Organisation FWB - Musiques actuelles"

**Code ajouté** :
```tsx
{isFWBOrganization(subside.beneficiaire_begunstigde) && (
  <Badge 
    className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0 font-bold"
    title="Organisation FWB - Musiques actuelles"
  >
    FWB
  </Badge>
)}
```

### 3. Bouton FWB dans le dialog de détails

**Emplacement** : Dans la section "Liens externes", à côté des boutons KBO, North Data, Google, Source

**Apparence** :
- Bouton avec dégradé orange-rouge : `from-orange-500 to-red-500`
- Texte blanc, icône FileText
- Style cohérent avec les autres boutons de liens externes

**Comportement** :
- Au clic, ouvre la page FWB dans un nouvel onglet
- URL : `https://creationartistique.cfwb.be/contrats-et-cp-musiques-actuelles`
- (Pour l'instant, pointe vers la page principale - peut être amélioré pour pointer vers un PDF spécifique)

**Code ajouté** :
```tsx
{isFWBOrganization(subside.beneficiaire_begunstigde) && (
  <Button
    onClick={() => {
      const fwbUrl = getFWBUrl(subside.beneficiaire_begunstigde)
      window.open(fwbUrl, '_blank')
    }}
    className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-sm hover:shadow transition-all duration-200 rounded-md px-2 sm:px-2.5 py-1.5 sm:py-1.5 h-auto text-xs sm:text-xs font-medium font-semibold"
    aria-label={`Voir l'accord de subside FWB pour ${subside.beneficiaire_begunstigde} dans un nouvel onglet`}
  >
    <FileText className="w-3.5 h-3.5" />
    <span>FWB</span>
  </Button>
)}
```

---

## 🎨 Visualisation

### Carte dans la liste (avec badge FWB)
```
┌─────────────────────────────────────┐
│ ASBL Jazz Station          [FWB]    │ ← Badge orange-rouge
│                                      │
│ 45 234 €                             │
│                                      │
│ [2024] [Culture]                     │
└─────────────────────────────────────┘
```

### Dialog de détails (avec bouton FWB)
```
┌─────────────────────────────────────┐
│ ASBL Jazz Station                   │
│                                      │
│ Liens externes                       │
│ [KBO] [North Data] [Google] [Source] │
│ [FWB] ← Nouveau bouton orange-rouge │
│                                      │
│ ... (autres infos)                   │
└─────────────────────────────────────┘
```

---

## 📋 Liste des organisations FWB

67 organisations au total, réparties en :
- **22** Contrats-programmes (2024-2028)
- **3** Contrats de création (2024-2028 ou 2024-2026)
- **30** Contrats de diffusion (2024-2028 ou 2024-2026)
- **12** Contrats de service (2024-2028 ou 2024-2026)

---

## 🔄 Prochaines améliorations possibles

### 1. Lien vers PDF spécifique
Actuellement, le bouton FWB pointe vers la page principale. On pourrait :
- Ajouter un champ `pdfUrl` dans `FWBOrganization`
- Générer automatiquement les URLs des PDFs si disponibles
- Pointer directement vers le PDF de l'accord de subside

### 2. Page dédiée FWB
Créer une page `/fwb-musiques-actuelles` qui liste toutes les organisations avec leurs liens (comme prévu dans `SOLUTIONS_FWB_LINKS.md`)

### 3. Amélioration du matching
- Vérifier manuellement les matchings pour s'assurer qu'ils sont corrects
- Ajouter des alias/variantes de noms si nécessaire

---

## ✅ Tests à faire

1. **Vérifier le badge** : Ouvrir la page de recherche, chercher une organisation FWB (ex: "Jazz Station"), vérifier que le badge FWB apparaît
2. **Vérifier le bouton** : Cliquer sur une carte avec badge FWB, vérifier que le bouton FWB apparaît dans les liens externes
3. **Tester le lien** : Cliquer sur le bouton FWB, vérifier que la page FWB s'ouvre correctement
4. **Vérifier les non-FWB** : Chercher une organisation non-FWB, vérifier qu'il n'y a pas de badge/bouton

---

## 📝 Notes

- Le matching utilise la normalisation de noms existante, donc il devrait gérer automatiquement les variantes (majuscules, accents, etc.)
- Le badge est très petit pour ne pas encombrer les cartes
- Le bouton FWB utilise le même style que les autres boutons de liens externes pour la cohérence
- L'URL FWB peut être améliorée plus tard pour pointer vers un PDF spécifique ou une section de la page
