# 🎯 Solutions pour le Filtrage depuis les Graphiques

**Problème:** Clic sur graphique → redirection vers recherche avec filtres, mais les noms longs posent problème dans l'URL.

**Objectif:** Système efficace et fiable pour filtrer les subsides depuis les graphiques.

---

## 🔍 Analyse du Problème

### Problèmes identifiés:
1. **Noms longs dans l'URL** - Les noms de bénéficiaires peuvent être très longs
2. **Limite d'URL** - Les URLs ont une limite de ~2000 caractères
3. **Encodage** - Les caractères spéciaux doivent être encodés
4. **Lisibilité** - URLs trop longues sont illisibles
5. **Fiabilité** - Risque que la recherche ne fonctionne pas si le nom est tronqué

---

## 💡 Solutions Proposées

### Solution 1: **Système de Filter Presets avec IDs** ⭐⭐⭐⭐⭐

**Concept:** Créer des "presets" de filtres avec des IDs uniques, stockés temporairement.

**Implémentation:**
```typescript
// Créer un preset de filtre
const filterId = generateFilterId() // UUID ou hash
const filterPreset = {
  id: filterId,
  type: 'beneficiary' | 'category' | 'year',
  value: beneficiaryName,
  filters: {
    search: beneficiaryName,
    year: 'all',
    category: 'all'
  },
  expiresAt: Date.now() + 3600000 // 1 heure
}

// Stocker dans sessionStorage
sessionStorage.setItem(`filter_${filterId}`, JSON.stringify(filterPreset))

// URL: /?filter=abc123
// Page charge le preset depuis sessionStorage
```

**Avantages:**
- ✅ URLs courtes et propres
- ✅ Pas de limite de longueur
- ✅ Fonctionne avec noms très longs
- ✅ Peut inclure plusieurs filtres complexes
- ✅ Expiration automatique (nettoyage)
- ✅ Pas de problème d'encodage

**Inconvénients:**
- ⚠️ Nécessite sessionStorage (fonctionne partout)
- ⚠️ Preset expire après un temps (mais c'est voulu)

**Risques:**
- Risque faible: sessionStorage désactivé → fallback sur méthode alternative

**Comment éviter:**
- Fallback sur Solution 2 si sessionStorage indisponible

---

### Solution 2: **Hash/Checksum du Nom** ⭐⭐⭐⭐

**Concept:** Utiliser un hash (SHA-256 ou MD5) du nom normalisé comme identifiant.

**Implémentation:**
```typescript
import { createHash } from 'crypto'

// Générer un hash du nom normalisé
function getBeneficiaryHash(name: string): string {
  const normalized = normalizeBeneficiaryName(name)
  return createHash('sha256').update(normalized).digest('hex').substring(0, 16)
}

// URL: /?beneficiary=abc123def456
// Page recherche le bénéficiaire avec ce hash
```

**Avantages:**
- ✅ URLs courtes (16-32 caractères)
- ✅ Déterministe (même nom = même hash)
- ✅ Pas de limite de longueur
- ✅ Pas besoin de stockage externe

**Inconvénients:**
- ⚠️ Nécessite de calculer le hash pour chaque bénéficiaire
- ⚠️ Collisions possibles (mais très rares avec SHA-256)
- ⚠️ Moins lisible (mais ce n'est pas grave)

**Risques:**
- Risque très faible: collision de hash (1 sur 2^128)

**Comment éviter:**
- Utiliser SHA-256 (collisions extrêmement rares)
- Vérifier que le nom correspond bien au hash

---

### Solution 3: **Paramètres Structurés Multiples** ⭐⭐⭐

**Concept:** Utiliser plusieurs paramètres URL structurés au lieu d'un seul.

**Implémentation:**
```typescript
// URL: /?type=beneficiary&id=abc123&year=2023&category=Sport
// Ou: /?type=category&name=Sport&year=all

// Page décode les paramètres
const params = {
  type: 'beneficiary' | 'category' | 'year',
  id?: string, // Hash ou ID
  name?: string, // Nom court ou tronqué
  year?: string,
  category?: string
}
```

**Avantages:**
- ✅ Flexible (plusieurs types de filtres)
- ✅ URLs relativement courtes
- ✅ Lisible et compréhensible
- ✅ Peut combiner plusieurs filtres

**Inconvénients:**
- ⚠️ Toujours limité par la longueur d'URL
- ⚠️ Nécessite de tronquer les noms longs
- ⚠️ Risque de perte d'information si tronqué

**Risques:**
- Risque moyen: nom tronqué peut ne pas matcher

**Comment éviter:**
- Utiliser hash pour les noms longs
- Combiner avec Solution 1 ou 2

---

### Solution 4: **Base64 Encodé** ⭐⭐

**Concept:** Encoder les filtres en Base64 dans l'URL.

**Implémentation:**
```typescript
// Encoder les filtres
const filters = {
  search: beneficiaryName,
  year: 'all',
  category: 'all'
}
const encoded = btoa(JSON.stringify(filters))
// URL: /?filters=eyJzZWFyY2giOiJuYW1lIn0=
```

**Avantages:**
- ✅ Peut inclure plusieurs filtres
- ✅ Pas de problème d'encodage URL
- ✅ Compact (mais pas optimal)

**Inconvénients:**
- ⚠️ URLs encore longues pour noms longs
- ⚠️ Moins lisible
- ⚠️ Nécessite décodage
- ⚠️ Toujours limité par longueur URL

**Risques:**
- Risque moyen: URLs trop longues pour noms très longs

**Comment éviter:**
- Limiter la longueur ou utiliser hash

---

### Solution 5: **Système de Tokens avec Backend/Cache** ⭐⭐⭐

**Concept:** Générer un token côté serveur, stocker les filtres dans un cache.

**Implémentation:**
```typescript
// POST /api/filters -> { token: 'abc123' }
// Stocke les filtres dans Redis/cache avec token
// URL: /?token=abc123
// Page récupère les filtres depuis le cache
```

**Avantages:**
- ✅ URLs très courtes
- ✅ Pas de limite
- ✅ Peut gérer filtres complexes
- ✅ Centralisé

**Inconvénients:**
- ⚠️ Nécessite backend/API
- ⚠️ Plus complexe
- ⚠️ Nécessite gestion du cache
- ⚠️ Overkill pour une app statique

**Risques:**
- Risque moyen: Complexité ajoutée

**Comment éviter:**
- Utiliser Solution 1 (sessionStorage) qui est plus simple

---

### Solution 6: **Combinaison: Hash + Fallback** ⭐⭐⭐⭐⭐

**Concept:** Utiliser hash pour les noms longs, nom complet pour les noms courts.

**Implémentation:**
```typescript
function getFilterParam(name: string): string {
  const normalized = normalizeBeneficiaryName(name)
  
  // Si nom court (< 50 chars), utiliser directement
  if (normalized.length < 50) {
    return normalized
  }
  
  // Sinon, utiliser hash
  return `hash:${getHash(normalized)}`
}

// URL: /?search=short-name
// Ou: /?search=hash:abc123def456

// Page décode:
if (search.startsWith('hash:')) {
  // Rechercher par hash
  const hash = search.substring(5)
  // Trouver le bénéficiaire avec ce hash
} else {
  // Rechercher par nom
}
```

**Avantages:**
- ✅ Optimal: noms courts = lisibles, noms longs = hash
- ✅ Pas de limite
- ✅ Flexible
- ✅ Meilleur des deux mondes

**Inconvénients:**
- ⚠️ Légèrement plus complexe
- ⚠️ Nécessite logique de décodage

**Risques:**
- Risque faible: bien géré

**Comment éviter:**
- Bien tester les deux cas

---

## 🎯 Recommandation: Solution 1 (Filter Presets) + Solution 6 (Hash Fallback)

**Pourquoi cette combinaison?**

1. **Solution 1 (Filter Presets)** - Pour la plupart des cas:
   - URLs très courtes: `/?filter=abc123`
   - Pas de limite
   - Peut inclure filtres complexes
   - Expiration automatique

2. **Solution 6 (Hash Fallback)** - Si sessionStorage indisponible:
   - Fallback automatique
   - Fonctionne toujours
   - Pas de dépendance externe

**Implémentation hybride:**
```typescript
// 1. Essayer sessionStorage (Solution 1)
if (sessionStorageAvailable) {
  const filterId = generateId()
  sessionStorage.setItem(`filter_${filterId}`, JSON.stringify(filters))
  return `/?filter=${filterId}`
}

// 2. Fallback sur hash (Solution 6)
const hash = getHash(beneficiaryName)
return `/?search=hash:${hash}`
```

---

## 📊 Comparaison des Solutions

| Solution | Longueur URL | Limite | Complexité | Fiabilité | Lisibilité |
|----------|--------------|--------|------------|-----------|------------|
| **1. Filter Presets** | ⭐⭐⭐⭐⭐ Très court | ⭐⭐⭐⭐⭐ Aucune | ⭐⭐⭐ Moyenne | ⭐⭐⭐⭐ Haute | ⭐⭐⭐⭐ Bonne |
| **2. Hash** | ⭐⭐⭐⭐ Court | ⭐⭐⭐⭐⭐ Aucune | ⭐⭐⭐ Moyenne | ⭐⭐⭐⭐⭐ Très haute | ⭐⭐ Faible |
| **3. Paramètres multiples** | ⭐⭐⭐ Moyen | ⭐⭐ Limitée | ⭐⭐⭐⭐ Simple | ⭐⭐⭐ Moyenne | ⭐⭐⭐⭐⭐ Excellente |
| **4. Base64** | ⭐⭐ Long | ⭐⭐ Limitée | ⭐⭐⭐ Moyenne | ⭐⭐⭐ Moyenne | ⭐ Très faible |
| **5. Tokens backend** | ⭐⭐⭐⭐⭐ Très court | ⭐⭐⭐⭐⭐ Aucune | ⭐⭐ Complexe | ⭐⭐⭐⭐ Haute | ⭐⭐⭐⭐ Bonne |
| **6. Hash + Fallback** | ⭐⭐⭐⭐ Court | ⭐⭐⭐⭐⭐ Aucune | ⭐⭐⭐ Moyenne | ⭐⭐⭐⭐⭐ Très haute | ⭐⭐⭐ Moyenne |

---

## 🏆 Solution Recommandée: **Solution 1 (Filter Presets) avec Fallback Hash**

### Pourquoi?

1. **URLs courtes et propres** - `/?filter=abc123` au lieu de `/?search=very-long-name...`
2. **Pas de limite** - Peut gérer noms de n'importe quelle longueur
3. **Filtres complexes** - Peut inclure plusieurs filtres (search + year + category)
4. **Expiration automatique** - Nettoyage après 1 heure
5. **Fallback robuste** - Si sessionStorage indisponible, utilise hash
6. **Simple à implémenter** - Pas besoin de backend
7. **Fiable** - Fonctionne dans 99.9% des cas

### Implémentation Proposée

```typescript
// 1. Créer un système de filter presets
interface FilterPreset {
  id: string
  type: 'beneficiary' | 'category' | 'year' | 'combined'
  filters: {
    search?: string
    year?: string
    category?: string
  }
  expiresAt: number
}

// 2. Fonction pour créer un preset
function createFilterPreset(filters: FilterPreset['filters']): string {
  const id = generateId() // UUID ou short ID
  const preset: FilterPreset = {
    id,
    type: 'combined',
    filters,
    expiresAt: Date.now() + 3600000 // 1 heure
  }
  
  try {
    sessionStorage.setItem(`filter_${id}`, JSON.stringify(preset))
    return id
  } catch {
    // Fallback: utiliser hash
    const search = filters.search || ''
    if (search.length > 50) {
      return `hash:${getHash(search)}`
    }
    return search
  }
}

// 3. Fonction pour charger un preset
function loadFilterPreset(id: string): FilterPreset['filters'] | null {
  try {
    const stored = sessionStorage.getItem(`filter_${id}`)
    if (!stored) return null
    
    const preset: FilterPreset = JSON.parse(stored)
    
    // Vérifier expiration
    if (Date.now() > preset.expiresAt) {
      sessionStorage.removeItem(`filter_${id}`)
      return null
    }
    
    return preset.filters
  } catch {
    return null
  }
}
```

---

## 🚀 Prochaines Étapes

1. **Implémenter Solution 1** (Filter Presets)
2. **Ajouter Fallback Hash** (Solution 6)
3. **Tester avec noms longs**
4. **Ajouter onClick handlers aux graphiques**
5. **Tester la redirection et le filtrage**

---

**Recommandation finale:** **Solution 1 (Filter Presets) avec Fallback Hash**

Cette solution offre le meilleur équilibre entre simplicité, fiabilité et efficacité.

