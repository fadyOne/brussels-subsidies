# Analyse - Délai de Sélection Visuelle des Boutons de Navigation

**Date:** 2025-12-05  
**Problème:** Délai important avant que le bouton sélectionné (Recherche/Graphs) ne s'affiche visuellement comme actif après un clic

---

## 🔍 Diagnostic du Problème

### Problème Identifié

Lorsqu'un utilisateur clique sur un bouton de navigation (Recherche, Graphs, Aide), il y a un délai important avant que le bouton ne s'affiche visuellement comme sélectionné. Le bouton reste dans son état inactif pendant plusieurs secondes, donnant l'impression que le clic n'a pas été enregistré.

### Cause Racine

**Le feedback visuel dépend du rendu complet de la nouvelle page :**

1. **Architecture actuelle :**
   - `currentPage` est passé comme prop statique dans chaque page (`currentPage="search"`, `currentPage="analyse"`, etc.)
   - Le style actif est conditionné par `currentPage === 'search'` dans `AppHeader`
   - `AppHeader` est rendu **dans chaque page**, pas dans le layout

2. **Séquence problématique :**
   ```
   Clic utilisateur → Navigation Next.js → Nouvelle page commence à charger
   → useEffect s'exécutent → Calculs lourds (loadData, groupBeneficiaries, etc.)
   → Page se rend complètement → AppHeader reçoit currentPage prop
   → Style actif appliqué (TROP TARD !)
   ```

3. **Pourquoi c'est lent :**
   - Page `/analyse` : Charge les données JSON, normalise, calcule `topGlobalBeneficiaries`, etc. (plusieurs secondes)
   - Page `/` : Charge les données, filtre, calcule les totaux, etc.
   - Le style visuel ne change qu'après que toute la page soit rendue

### Fichiers Concernés

- `src/components/AppHeader.tsx` - Détermine le style actif basé sur `currentPage` prop
- `src/app/page.tsx` - Passe `currentPage="search"`
- `src/app/analyse/page.tsx` - Passe `currentPage="analyse"` (page lente avec calculs)
- `src/app/aide/page.tsx` - Passe `currentPage="aide"`

---

## 💡 Solutions Proposées

### Solution 1: Utiliser `usePathname()` pour Feedback Immédiat (RECOMMANDÉE)

**Description :**
Utiliser le hook `usePathname()` de Next.js dans `AppHeader` pour déterminer la page active côté client, indépendamment du chargement de la page. Le style actif change immédiatement au clic, avant même que la nouvelle page ne se charge.

**Avantages :**
- ✅ Feedback visuel instantané (0ms)
- ✅ Pas de dépendance au rendu de la nouvelle page
- ✅ Solution native Next.js, pas de state management supplémentaire
- ✅ Fonctionne même si la page est lente à charger

**Implémentation :**
```typescript
import { usePathname } from 'next/navigation'

export function AppHeader({ ... }) {
  const pathname = usePathname()
  
  // Déterminer currentPage depuis pathname
  const currentPage = useMemo(() => {
    if (pathname === '/') return 'search'
    if (pathname === '/analyse') return 'analyse'
    if (pathname === '/aide') return 'aide'
    return 'search' // default
  }, [pathname])
  
  // ... reste du code
}
```

**Risques et Mitigation :**
- **Risque 1:** Conflit si `currentPage` prop est encore passé. **Mitigation:** Rendre `currentPage` prop optionnel, utiliser `usePathname()` en priorité.
- **Risque 2:** Pathname peut changer avant que la page soit prête. **Mitigation:** C'est le comportement souhaité - feedback immédiat.

---

### Solution 2: Optimistic UI avec État Local

**Description :**
Ajouter un état local dans `AppHeader` qui se met à jour immédiatement au clic, avant la navigation. Utiliser `onClick` sur les `Link` pour mettre à jour l'état local.

**Avantages :**
- ✅ Feedback instantané
- ✅ Contrôle total sur le timing

**Inconvénients :**
- ❌ Nécessite de gérer l'état manuellement
- ❌ Peut créer des incohérences si la navigation échoue
- ❌ Plus complexe que Solution 1

**Implémentation :**
```typescript
const [optimisticPage, setOptimisticPage] = useState<string | null>(null)

const handleLinkClick = (page: 'search' | 'analyse' | 'aide') => {
  setOptimisticPage(page)
  // Navigation Next.js se fait automatiquement via Link
}

// Utiliser optimisticPage en priorité, sinon currentPage prop
const activePage = optimisticPage || currentPage
```

---

### Solution 3: Context API pour État Global

**Description :**
Créer un contexte React pour gérer la page active globalement. Mettre à jour le contexte immédiatement au clic.

**Avantages :**
- ✅ État partagé entre composants
- ✅ Extensible pour d'autres besoins futurs

**Inconvénients :**
- ❌ Overhead de setup (Context Provider)
- ❌ Plus complexe que nécessaire pour ce cas
- ❌ Solution 1 est plus simple et efficace

---

### Solution 4: Transitions Next.js avec `useTransition`

**Description :**
Utiliser `useTransition` de React pour marquer la navigation comme "pending" et afficher un état de chargement.

**Avantages :**
- ✅ Feedback visuel pendant le chargement
- ✅ API React moderne

**Inconvénients :**
- ❌ Ne résout pas directement le problème de sélection visuelle
- ❌ Nécessite de gérer les états pending
- ❌ Plus complexe

---

## 🎯 Recommandation

**Solution 1 : Utiliser `usePathname()`** est la meilleure solution car :
1. **Simplicité** : Une seule ligne de code, hook natif Next.js
2. **Performance** : Feedback instantané, pas de dépendance au rendu
3. **Fiabilité** : Fonctionne toujours, même si la page est très lente
4. **Maintenabilité** : Pas de state management supplémentaire

### Plan d'Implémentation

1. Modifier `AppHeader` pour utiliser `usePathname()`
2. Rendre `currentPage` prop optionnel (fallback si pathname non disponible)
3. Tester la navigation entre toutes les pages
4. Vérifier que le style actif s'applique immédiatement

---

## 📊 Impact Attendu

### Avant
- Délai de sélection : **2-5 secondes** (selon la page)
- Expérience utilisateur : Frustration, impression que le clic n'a pas fonctionné
- Confiance : Faible, utilisateur peut cliquer plusieurs fois

### Après (Solution 1)
- Délai de sélection : **< 50ms** (instantané)
- Expérience utilisateur : Feedback immédiat, confiance restaurée
- Confiance : Élevée, utilisateur sait que son action est enregistrée

---

## 🔧 Fichiers à Modifier

1. `src/components/AppHeader.tsx`
   - Ajouter `usePathname()` import
   - Déterminer `currentPage` depuis pathname
   - Rendre prop `currentPage` optionnelle (fallback)

2. `src/app/page.tsx`, `src/app/analyse/page.tsx`, `src/app/aide/page.tsx`
   - Optionnel : Retirer `currentPage` prop (ou garder comme fallback)

---

## ✅ Critères de Succès

- [ ] Le bouton sélectionné change de style **immédiatement** au clic (< 100ms)
- [ ] Pas de délai visible entre le clic et le changement visuel
- [ ] Fonctionne sur toutes les pages (Recherche, Graphs, Aide)
- [ ] Pas de régression sur les autres fonctionnalités
- [ ] Testé sur différents navigateurs

---

## 🚀 Prochaines Étapes

1. Implémenter Solution 1 (`usePathname()`)
2. Tester la navigation
3. Mesurer l'amélioration (devrait être instantanée)
4. Documenter le changement

