# Analyse - Page Analyse Lente au Chargement

**Date:** 2025-12-05  
**Problème:** La page `/analyse` est très lente à s'afficher après le clic sur "Graphs", même si le bouton change visuellement

---

## 🔍 Diagnostic du Vrai Problème

### Problème Identifié

Le feedback visuel du bouton fonctionne (grâce à `usePathname()`), mais **la page elle-même ne s'affiche pas** tant que :
1. Les données JSON ne sont pas chargées
2. Les calculs lourds (`groupBeneficiaries`, `topGlobalBeneficiaries`) ne sont pas terminés
3. Tous les `useMemo` ne sont pas calculés

**Séquence problématique :**
```
Clic sur "Graphs" 
→ Navigation Next.js (pathname change, bouton devient actif ✅)
→ Page /analyse commence à se charger
→ useEffect s'exécute → loadData() appelé
→ setLoading(true) → Page affiche SkeletonLoader
→ Fetch JSON (plusieurs fichiers si "all")
→ Normalisation des données
→ Calculs lourds (groupBeneficiaries, topGlobalBeneficiaries)
→ setLoading(false) → Page s'affiche enfin (TROP TARD !)
```

### Causes Identifiées

1. **Double chargement potentiel :**
   - `selectedDataYear` initialisé à "all"
   - Puis peut-être changé par URL dans useEffect
   - Cela déclenche `loadData` deux fois

2. **Calculs lourds bloquants :**
   - `topGlobalBeneficiaries` utilise `groupBeneficiaries()` qui est très lourd
   - Ces calculs s'exécutent même si `loading = true`
   - Ils bloquent le rendu initial

3. **Pas de rendu progressif :**
   - La page n'affiche rien tant que `loading = true`
   - Pas de skeleton visible immédiatement
   - L'utilisateur voit une page blanche

---

## 💡 Solutions Proposées

### Solution 1: Afficher le Skeleton Immédiatement (CRITIQUE)

**Problème:** La page ne s'affiche pas du tout pendant le chargement.

**Solution:** Afficher le SkeletonLoader **immédiatement** au montage, avant même que `loadData` soit appelé.

**Code Actuel:**
```typescript
const [loading, setLoading] = useState(true) // OK
// ...
useEffect(() => {
  // ...
  loadData(selectedDataYear)
}, [selectedDataYear])
```

**Problème:** Le SkeletonLoader n'est peut-être pas affiché correctement ou la structure de la page bloque.

**Vérification nécessaire:** Voir comment la page gère l'affichage pendant `loading`.

---

### Solution 2: Initialiser selectedDataYear depuis URL Immédiatement

**Problème:** `selectedDataYear` est initialisé à "all", puis changé par URL, créant un double chargement.

**Solution:** Initialiser directement depuis l'URL dans le state initial.

**Code Actuel:**
```typescript
const [selectedDataYear, setSelectedDataYear] = useState<string>("all")

useEffect(() => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    const year = urlParams.get('year')
    if (year) setSelectedDataYear(year) // Change après le premier render
  }
  loadData(selectedDataYear) // Appelé avec "all" d'abord
}, [selectedDataYear])
```

**Code Proposé:**
```typescript
const [selectedDataYear, setSelectedDataYear] = useState<string>(() => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('year') || 'all'
  }
  return 'all'
})

useEffect(() => {
  loadData(selectedDataYear) // Appelé une seule fois avec la bonne valeur
}, [selectedDataYear])
```

**Avantages:**
- ✅ Pas de double chargement
- ✅ Chargement direct avec la bonne année
- ✅ Plus rapide

---

### Solution 3: Déléguer les Calculs Lourds après le Premier Render

**Problème:** Les calculs lourds (`topGlobalBeneficiaries`) s'exécutent même pendant le chargement, bloquant le rendu.

**Solution:** Utiliser `useDeferredValue` ou `startTransition` pour différer les calculs lourds.

**Code Proposé:**
```typescript
import { useDeferredValue, startTransition } from 'react'

const deferredSubsides = useDeferredValue(subsides)

const topGlobalBeneficiaries = useMemo(() => {
  // Utiliser deferredSubsides au lieu de subsides
  // Les calculs s'exécutent après le premier render
}, [deferredSubsides, topBeneficiariesCount, selectedDataYear])
```

**Avantages:**
- ✅ Page s'affiche immédiatement
- ✅ Calculs lourds en arrière-plan
- ✅ Meilleure perception de performance

---

### Solution 4: Vérifier le Cache AVANT le Premier Render

**Problème:** Le cache est vérifié dans `loadData`, qui est appelé dans un `useEffect`.

**Solution:** Vérifier le cache immédiatement au montage et afficher les données en cache si disponibles.

**Code Proposé:**
```typescript
const [subsides, setSubsides] = useState<Subside[]>(() => {
  // Vérifier le cache immédiatement
  const cached = getCachedData(selectedDataYear)
  if (cached) {
    return cached // Afficher immédiatement les données en cache
  }
  return []
})

const [loading, setLoading] = useState(() => {
  // Si on a des données en cache, pas besoin de loading
  const cached = getCachedData(selectedDataYear)
  return !cached
})
```

**Avantages:**
- ✅ Affichage instantané si données en cache
- ✅ Pas de skeleton si données disponibles
- ✅ Meilleure expérience utilisateur

---

## 🎯 Plan d'Action Prioritaire

### Étape 1: Vérifier l'Affichage du Skeleton
- [ ] Vérifier que le SkeletonLoader s'affiche correctement
- [ ] S'assurer que la structure de la page permet l'affichage immédiat

### Étape 2: Initialiser selectedDataYear depuis URL
- [ ] Modifier l'initialisation de `selectedDataYear`
- [ ] Éliminer le double chargement

### Étape 3: Vérifier le Cache Immédiatement
- [ ] Initialiser `subsides` et `loading` depuis le cache
- [ ] Afficher les données en cache instantanément si disponibles

### Étape 4: Différer les Calculs Lourds
- [ ] Utiliser `useDeferredValue` pour les calculs lourds
- [ ] Permettre au rendu initial de se faire rapidement

---

## 📊 Impact Attendu

### Avant
- Temps avant affichage : **3-5 secondes**
- Expérience : Page blanche, puis skeleton, puis contenu
- Perception : Très lent, frustrant

### Après
- Temps avant affichage : **< 200ms** (si cache) ou **< 500ms** (skeleton visible)
- Expérience : Skeleton immédiat, puis contenu progressif
- Perception : Rapide, fluide

---

## 🔧 Fichiers à Modifier

1. `src/app/analyse/page.tsx`
   - Initialiser `selectedDataYear` depuis URL
   - Initialiser `subsides` et `loading` depuis cache
   - Utiliser `useDeferredValue` pour calculs lourds

