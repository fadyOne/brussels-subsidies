# Analyse Complète de Performance - Page d'Accueil

## 🔍 Problème Identifié

La page d'accueil (`/`) est **beaucoup trop lente à s'afficher**, alors que ce n'était pas le cas avant.

## 📊 Analyse des Causes Potentielles

### 1. **PROBLÈME CRITIQUE : Détection Automatique des Années (2025 inclus)**

**Fichier concerné :** `src/app/page.tsx` - Fonction `getAvailableYears()`

**Problème :**
- La fonction `getAvailableYears()` détecte **automatiquement** toutes les années disponibles en scannant les fichiers `data-*.json` dans `/public`
- Le fichier `data-2025-incomplete.json` existe et est probablement détecté
- Si 2025 est inclus dans la liste, le chargement de "all" pourrait essayer de charger 2025
- Même si le chargement échoue, le temps de tentative ralentit la page

**Impact :**
- Tentative de chargement d'un fichier incomplet/lourd
- Erreurs réseau qui ralentissent le chargement parallèle
- Normalisation de données 2025 qui peuvent être dans un format différent

**Solution :**
- **Exclure explicitement 2025** de la détection automatique
- Filtrer `data-2025*.json` dans `getAvailableYears()`
- Ne charger que les années 2019-2024

### 2. **Calcul Lourd : Détection des Relations entre Organisations**

**Fichier concerné :** `src/app/page.tsx` - Ligne 615-657

**Problème :**
- Le calcul `detectRelationships(subsides, 0.6)` se lance **automatiquement** après le chargement des données
- Ce calcul parcourt **tous les subsides** pour détecter les relations
- Complexité : O(n²) dans le pire des cas
- Avec 7635 subsides, cela peut être très lent

**Impact :**
- Bloque le thread principal même avec `startTransition`
- Consomme beaucoup de mémoire
- Ralentit l'affichage de la page

**Solution :**
- Déplacer ce calcul dans un Web Worker
- Ou le calculer uniquement quand nécessaire (lazy)
- Ou le calculer en arrière-plan avec un délai

### 3. **Normalisation des Données au Chargement**

**Fichier concerné :** `src/lib/data-normalizer.ts`

**Problème :**
- `normalizeSubsidesArray()` est appelée pour **chaque année** chargée
- Avec "all", cela normalise 6 fichiers JSON
- Chaque normalisation parcourt tous les subsides

**Impact :**
- Si 2025 est inclus, normalisation supplémentaire d'un fichier incomplet
- Format 2025 peut être différent, causant des erreurs/retards

**Solution :**
- Exclure 2025 du chargement
- Optimiser la normalisation (batch processing)

### 4. **Filtrage et Recherche en Temps Réel**

**Fichier concerné :** `src/app/page.tsx` - Ligne 500-575

**Problème :**
- Le filtrage se fait sur **tous les subsides** à chaque changement
- Avec 7635 subsides, le filtrage peut être lent
- Le debounce de 300ms peut ne pas suffire

**Impact :**
- Ralentit l'interactivité
- Recalculs fréquents

**Solution :**
- Optimiser le filtrage avec des index
- Utiliser `useDeferredValue` pour la recherche

### 5. **Calcul de l'Évolution par Année**

**Fichier concerné :** `src/app/page.tsx` - Ligne 594-609

**Problème :**
- `evolutionData` est recalculé à chaque changement de `filteredSubsides`
- Parcourt tous les subsides filtrés

**Impact :**
- Recalculs fréquents
- Peut être optimisé

**Solution :**
- Mémoriser plus agressivement
- Calculer uniquement quand nécessaire

## 🎯 Solutions Prioritaires

### **Solution 1 : Exclure 2025 de la Détection (CRITIQUE)**

**Fichier :** `src/app/page.tsx`

**Modification :**
```typescript
const getAvailableYears = useCallback(async (): Promise<string[]> => {
  if (typeof window === 'undefined') {
    return ["all", "2024", "2023", "2022", "2021", "2020", "2019"]
  }

  try {
    // Détecter les années disponibles en testant les fichiers
    const years: string[] = []
    const yearList = ["2024", "2023", "2022", "2021", "2020", "2019"]
    
    // ✅ EXCLURE EXPLICITEMENT 2025
    // Ne tester que les années 2019-2024
    for (const year of yearList) {
      try {
        const response = await fetch(`/data-${year}.json`, { method: 'HEAD' })
        if (response.ok) {
          years.push(year)
        }
      } catch {
        // Ignorer les erreurs silencieusement
      }
    }

    return ["all", ...years.sort().reverse()]
  } catch {
    // Fallback : retourner les années connues (sans 2025)
    return ["all", "2024", "2023", "2022", "2021", "2020", "2019"]
  }
}, [])
```

**Avantages :**
- ✅ Empêche le chargement de 2025
- ✅ Évite les erreurs de normalisation
- ✅ Réduit le temps de chargement
- ✅ Simple à implémenter

**Risques :**
- ⚠️ Si 2025 devient disponible plus tard, il faudra l'ajouter manuellement
- ⚠️ Nécessite de modifier le code pour ajouter 2025 plus tard

**Mitigation :**
- Ajouter un commentaire clair expliquant pourquoi 2025 est exclu
- Créer une constante `EXCLUDED_YEARS = ['2025']` pour faciliter la maintenance

### **Solution 2 : Déplacer detectRelationships dans un Web Worker**

**Fichier :** `src/app/page.tsx` + nouveau fichier `src/lib/organization-relationships.worker.ts`

**Modification :**
- Créer un Web Worker pour `detectRelationships`
- Calculer les relations en arrière-plan
- Ne pas bloquer l'affichage de la page

**Avantages :**
- ✅ Ne bloque pas le thread principal
- ✅ Calcul en arrière-plan
- ✅ Page s'affiche immédiatement

**Risques :**
- ⚠️ Complexité accrue
- ⚠️ Support des Web Workers dans Next.js

**Mitigation :**
- Tester sur différents navigateurs
- Fallback vers le calcul synchrone si Web Workers non supportés

### **Solution 3 : Lazy Load detectRelationships**

**Fichier :** `src/app/page.tsx`

**Modification :**
- Ne calculer les relations que quand l'utilisateur survole un subside avec relation
- Ou calculer avec un délai de 2-3 secondes après le chargement

**Avantages :**
- ✅ Page s'affiche immédiatement
- ✅ Calcul seulement si nécessaire
- ✅ Simple à implémenter

**Risques :**
- ⚠️ Les relations ne sont pas disponibles immédiatement
- ⚠️ Expérience utilisateur légèrement dégradée

**Mitigation :**
- Afficher un indicateur de chargement pour les relations
- Calculer en arrière-plan avec un délai raisonnable

## 📋 Plan d'Action Recommandé

### **Phase 1 : Corrections Immédiates (CRITIQUE)**

1. ✅ **Exclure 2025 de `getAvailableYears()`**
   - Modifier la fonction pour ne retourner que 2019-2024
   - Ajouter un filtre explicite pour exclure `data-2025*.json`

2. ✅ **Vérifier que 2025 n'est pas chargé dans `loadData()`**
   - S'assurer que le filtre `year !== "all"` exclut 2025
   - Ajouter une vérification explicite

### **Phase 2 : Optimisations (IMPORTANT)**

3. ⚠️ **Déplacer `detectRelationships` dans un Web Worker**
   - Créer le worker
   - Modifier `page.tsx` pour utiliser le worker
   - Tester la performance

4. ⚠️ **Optimiser le filtrage**
   - Utiliser `useDeferredValue` pour la recherche
   - Créer des index pour accélérer les recherches

### **Phase 3 : Améliorations (OPTIONNEL)**

5. 💡 **Optimiser `evolutionData`**
   - Mémoriser plus agressivement
   - Calculer uniquement quand nécessaire

6. 💡 **Lazy load des composants lourds**
   - Vérifier si d'autres composants peuvent être lazy-loaded

## 🔧 Fichiers à Modifier

1. **`src/app/page.tsx`**
   - Fonction `getAvailableYears()` : Exclure 2025
   - Fonction `loadData()` : Vérifier l'exclusion de 2025
   - `detectRelationships` : Déplacer dans Web Worker ou lazy load

2. **`src/lib/organization-relationships.ts`** (si Web Worker)
   - Adapter pour fonctionner dans un worker

3. **Nouveau : `src/lib/organization-relationships.worker.ts`** (si Web Worker)
   - Worker pour calculer les relations

## ✅ Vérifications à Faire

- [ ] Vérifier que `data-2025-incomplete.json` n'est pas chargé
- [ ] Tester le temps de chargement avant/après
- [ ] Vérifier que les années 2019-2024 se chargent correctement
- [ ] Tester avec "all" et avec une année spécifique
- [ ] Vérifier que `detectRelationships` ne bloque pas l'affichage

## 📊 Métriques de Performance

**Avant :**
- Temps de chargement initial : ? ms
- Temps jusqu'à affichage : ? ms
- Temps de calcul `detectRelationships` : ? ms

**Après (objectif) :**
- Temps de chargement initial : < 500 ms
- Temps jusqu'à affichage : < 200 ms
- Temps de calcul `detectRelationships` : En arrière-plan (non-bloquant)
