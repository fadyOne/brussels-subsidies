# Analyse des Calculs sur la Home Page - Optimisation Cache

## 📊 Calculs Identifiés sur la Home Page

### 1. **evolutionData** (Ligne 608-623) ⚠️ À METTRE EN CACHE

**Description :**
- Calcule l'évolution des montants par année pour le mini-graphique
- Parcourt tous les `filteredSubsides` avec `forEach`
- Crée un Map, puis convertit en tableau, trie et garde les 6 dernières années

**Complexité :** O(n) où n = nombre de subsides filtrés

**Problème :**
- Recalculé à chaque changement de `filteredSubsides`
- Si l'utilisateur change juste la page (pagination), le calcul se refait inutilement
- Si l'utilisateur change juste la recherche, le calcul se refait même si les données de base sont les mêmes

**Solution :**
- Mettre en cache avec `getCachedComputation` / `setCachedComputation`
- Clé de cache : `evolutionData_${selectedDataYear}_${hash(filteredSubsides)}`
- Invalider seulement si les données sources changent

**Gain estimé :** ~50-100ms par recalcul évité

---

### 2. **detectRelationships** (Ligne 625-677) ⚠️ À METTRE EN CACHE

**Description :**
- Détecte les relations entre organisations
- Calcul très lourd : O(n²) dans le pire des cas
- Déjà optimisé avec délai de 2 secondes

**Problème :**
- Recalculé à chaque changement de `subsides`
- Si l'utilisateur revient sur la page avec les mêmes données, le calcul se refait
- Les relations ne changent que si les données sources changent

**Solution :**
- Mettre en cache avec `getCachedComputation` / `setCachedComputation`
- Clé de cache : `organizationRelationships_${selectedDataYear}_${hash(subsides)}`
- Invalider seulement si les données sources changent

**Gain estimé :** ~500-2000ms par recalcul évité (calcul très lourd)

---

### 3. **getAvailableYears** (Ligne 160-190) ⚠️ À METTRE EN CACHE

**Description :**
- Détecte les années disponibles en faisant des requêtes HEAD en parallèle
- Appelé au chargement initial et quand on charge "all"

**Problème :**
- Fait 6 requêtes HEAD à chaque appel
- Les années disponibles ne changent pas souvent (seulement quand on ajoute une nouvelle année)
- Inutile de refaire ces requêtes à chaque chargement de page

**Solution :**
- Mettre en cache dans `localStorage` avec une TTL de 24h
- Clé de cache : `availableYears`
- Invalider seulement si l'utilisateur force un refresh ou après 24h

**Gain estimé :** ~100-300ms par appel évité (6 requêtes réseau)

---

### 4. **Filtrage** (Ligne 518-589) ✅ DÉJÀ OPTIMISÉ

**Description :**
- Filtre les subsides selon la recherche et la commune
- Déjà optimisé avec `useDeferredValue`

**Statut :** ✅ Pas besoin de cache supplémentaire, déjà optimisé

---

### 5. **Pagination** (Ligne 592-597) ✅ DÉJÀ OPTIMISÉ

**Description :**
- Calcule la pagination (totalPages, paginatedSubsides)
- Déjà mémorisé avec `useMemo`

**Statut :** ✅ Pas besoin de cache supplémentaire, déjà optimisé

---

## 🎯 Plan d'Action Recommandé

### **Priorité 1 : Cache pour detectRelationships** (CRITIQUE)

**Impact :** Très élevé (calcul très lourd, ~500-2000ms)
**Effort :** Moyen
**Risque :** Faible

**Implémentation :**
```typescript
useEffect(() => {
  if (subsides.length === 0) {
    setOrganizationRelationships(new Map())
    return
  }

  // Vérifier le cache d'abord
  const cacheKey = `organizationRelationships_${selectedDataYear}`
  const dataHash = JSON.stringify(subsides.slice(0, 10).map(s => s.beneficiaire_begunstigde))
  const cached = getCachedComputation<Map<string, OrganizationRelationship[]>>(cacheKey, dataHash)
  
  if (cached) {
    // Convertir depuis le format sérialisé
    const relationshipsMap = new Map<string, OrganizationRelationship[]>()
    Object.entries(cached).forEach(([key, value]) => {
      relationshipsMap.set(key, value as OrganizationRelationship[])
    })
    setOrganizationRelationships(relationshipsMap)
    devLog('✅ Relations récupérées depuis le cache')
    return
  }

  // Sinon, calculer avec délai
  const timeoutId = setTimeout(() => {
    startTransition(async () => {
      // ... calcul existant ...
      // Mettre en cache après calcul
      setCachedComputation(cacheKey, relationshipsMap, subsides)
    })
  }, 2000)

  return () => clearTimeout(timeoutId)
}, [subsides, selectedDataYear])
```

---

### **Priorité 2 : Cache pour evolutionData** (IMPORTANT)

**Impact :** Moyen (~50-100ms par recalcul)
**Effort :** Faible
**Risque :** Très faible

**Implémentation :**
```typescript
const evolutionData = useMemo(() => {
  // Vérifier le cache d'abord
  const cacheKey = `evolutionData_${selectedDataYear}`
  const dataHash = JSON.stringify(filteredSubsides.slice(0, 10).map(s => ({
    year: s.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend,
    amount: s.montant_octroye_toegekend_bedrag
  })))
  
  const cached = getCachedComputation<Array<{year: string, amount: number}>>(cacheKey, dataHash)
  if (cached) {
    return cached
  }

  // Sinon, calculer
  const yearMap = new Map<string, number>()
  filteredSubsides.forEach(subside => {
    const year = subside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend
    if (year && year !== 'Non spécifié') {
      const current = yearMap.get(year) || 0
      yearMap.set(year, current + subside.montant_octroye_toegekend_bedrag)
    }
  })
  
  const result = Array.from(yearMap.entries())
    .map(([year, amount]) => ({ year, amount }))
    .sort((a, b) => a.year.localeCompare(b.year))
    .slice(-6)
  
  // Mettre en cache
  setCachedComputation(cacheKey, result, filteredSubsides)
  
  return result
}, [filteredSubsides, selectedDataYear])
```

---

### **Priorité 3 : Cache pour getAvailableYears** (OPTIONNEL)

**Impact :** Faible-Moyen (~100-300ms par appel)
**Effort :** Faible
**Risque :** Très faible

**Implémentation :**
```typescript
const getAvailableYears = useCallback(async (): Promise<string[]> => {
  // Vérifier le cache d'abord
  const cacheKey = 'availableYears'
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    const now = Date.now()
    // Cache valide pendant 24h
    if (now - timestamp < 24 * 60 * 60 * 1000) {
      devLog('✅ Années récupérées depuis le cache')
      return data
    }
  }

  // Sinon, détecter
  try {
    const possibleYears = ["2024", "2023", "2022", "2021", "2020", "2019"]
    // ... code existant ...
    
    // Mettre en cache
    localStorage.setItem(cacheKey, JSON.stringify({
      data: years,
      timestamp: Date.now()
    }))
    
    return years
  } catch (error) {
    // ... fallback ...
  }
}, [])
```

---

## 📈 Gains Estimés

**Avant optimisations :**
- `detectRelationships` : ~500-2000ms à chaque chargement
- `evolutionData` : ~50-100ms à chaque changement de filtres
- `getAvailableYears` : ~100-300ms à chaque chargement

**Après optimisations :**
- `detectRelationships` : ~0ms (cache hit) ou ~500-2000ms (premier calcul seulement)
- `evolutionData` : ~0ms (cache hit) ou ~50-100ms (premier calcul seulement)
- `getAvailableYears` : ~0ms (cache hit) ou ~100-300ms (premier calcul seulement)

**Gain total estimé :** 650-2400ms par visite (après le premier chargement)

---

## ⚠️ Points d'Attention

1. **Invalidation du cache :**
   - Le cache doit être invalidé si les données sources changent
   - Utiliser un hash des données pour détecter les changements

2. **Taille du cache :**
   - `detectRelationships` peut être volumineux (Map avec toutes les relations)
   - Vérifier la taille avant de mettre en cache (limite 2MB par entrée)

3. **Compatibilité :**
   - Le cache utilise `localStorage`, vérifier la disponibilité
   - Gérer les erreurs gracieusement (fallback vers calcul direct)

4. **TTL (Time To Live) :**
   - `detectRelationships` : 1 heure (déjà défini dans `cache.ts`)
   - `evolutionData` : 1 heure
   - `getAvailableYears` : 24 heures (les années ne changent pas souvent)

