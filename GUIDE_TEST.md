# 🧪 Guide de Test - Version Actuelle

## 🚀 Installation et Démarrage

```bash
# Installer les dépendances
pnpm install

# Démarrer l'application en mode développement
pnpm dev

# Exécuter les tests
pnpm test

# Tests avec interface graphique
pnpm test:ui

# Tests avec couverture de code
pnpm test:coverage
```

---

## ✅ Checklist de Test

### 1. Tests Fonctionnels de Base

- [ ] **Chargement des données**
  - Ouvrir l'application
  - Vérifier que les données se chargent (toutes les années)
  - Vérifier qu'une année spécifique se charge correctement
  - Vérifier les messages dans la console

- [ ] **Fonctionnement du cache**
  - Charger une année (ex: 2024)
  - Recharger la page (F5)
  - Vérifier dans la console : message "✅ Cache hit"
  - Vérifier que le chargement est plus rapide

- [ ] **Recherche et filtres**
  - Tester la recherche par bénéficiaire
  - Tester le filtre par catégorie
  - Tester le filtre par année
  - Vérifier que les résultats sont corrects

- [ ] **Graphiques**
  - Vérifier que les graphiques s'affichent
  - Tester les onglets "Par catégorie" et "Par année"
  - Vérifier que les données dans les graphiques sont cohérentes

### 2. Tests de Performance

- [ ] **Temps de chargement**
  - Mesurer le temps de chargement initial (sans cache)
  - Mesurer le temps de chargement avec cache
  - Comparer les deux (le cache devrait être beaucoup plus rapide)

- [ ] **Performance avec toutes les années**
  - Charger "Toutes les années"
  - Vérifier que l'application reste réactive
  - Vérifier que les graphiques se chargent correctement

### 3. Tests de Robustesse

- [ ] **Gestion d'erreurs**
  - Simuler une erreur réseau (désactiver le réseau)
  - Vérifier que l'application affiche un message d'erreur clair
  - Vérifier le bouton "Réessayer"

- [ ] **Données manquantes**
  - Vérifier le comportement avec des données incomplètes
  - Vérifier que les valeurs par défaut sont appliquées

- [ ] **Cache corrompu**
  - Dans la console : `localStorage.clear()`
  - Recharger la page
  - Vérifier que l'application fonctionne normalement

### 4. Tests de Compatibilité

- [ ] **Différentes années**
  - Tester chaque année individuellement (2019-2024)
  - Vérifier que toutes les données sont correctement normalisées
  - Vérifier que les montants sont correctement parsés

- [ ] **Format des données**
  - Vérifier que les montants avec virgules sont corrects
  - Vérifier que les montants avec points sont corrects
  - Vérifier les numéros BCE

### 5. Tests des Tests Automatisés

- [ ] **Exécution des tests**
  ```bash
  pnpm test
  ```
  - Vérifier que tous les tests passent
  - Vérifier qu'il n'y a pas d'erreurs

- [ ] **Couverture de code**
  ```bash
  pnpm test:coverage
  ```
  - Vérifier la couverture du normalizer
  - Identifier les zones non testées

---

## 🔍 Points d'Attention Spécifiques

### Pour l'Analyse de Données

1. **Vérifier la cohérence des calculs** :
   - Les totaux dans les graphiques correspondent-ils aux données ?
   - Les pourcentages sont-ils corrects ?
   - Les montants sont-ils bien formatés ?

2. **Vérifier la normalisation** :
   - Les données de différentes années sont-elles cohérentes ?
   - Les champs manquants sont-ils gérés correctement ?
   - Les formats alternatifs (2019 vs 2024) sont-ils supportés ?

3. **Vérifier les performances d'analyse** :
   - Les calculs sont-ils rapides avec beaucoup de données ?
   - Les graphiques se mettent-ils à jour rapidement lors des filtres ?
   - La pagination fonctionne-t-elle bien ?

---

## 📊 Données de Test Recommandées

Pour tester efficacement, vérifier avec :

1. **Petit dataset** : Une seule année avec peu de données
2. **Grand dataset** : Toutes les années (7,635 subsides)
3. **Données edge cases** :
   - Montants à 0
   - Montants très élevés
   - Champs manquants
   - Numéros BCE manquants

---

## 🐛 Bugs Potentiels à Surveiller

1. **Cache** :
   - Les données en cache sont-elles à jour ?
   - Le cache se vide-t-il correctement après 24h ?
   - Le cache fonctionne-t-il avec toutes les années ?

2. **Normalisation** :
   - Les montants sont-ils correctement parsés pour toutes les années ?
   - Les champs alternatifs sont-ils bien détectés ?
   - Les valeurs par défaut sont-elles correctes ?

3. **Performance** :
   - Y a-t-il des ralentissements avec beaucoup de données ?
   - Les graphiques se chargent-ils rapidement ?
   - La recherche est-elle fluide ?

---

## 📝 Notes de Test

Utilisez cette section pour noter vos observations :

```
Date du test : ___________

Observations :
- 
- 
- 

Bugs trouvés :
- 
- 

Suggestions :
- 
- 
```

---

## ✅ Après les Tests

Une fois les tests terminés, nous pourrons décider des prochaines améliorations en fonction de :

1. **Problèmes identifiés** : Quels bugs ou problèmes de performance ?
2. **Besoins utilisateurs** : Quelles fonctionnalités manquent pour l'analyse ?
3. **Priorités** : Qu'est-ce qui apporterait le plus de valeur ?

Consultez `PROCHAINES_AMELIORATIONS.md` pour voir les suggestions basées sur la nature analytique de l'application.

