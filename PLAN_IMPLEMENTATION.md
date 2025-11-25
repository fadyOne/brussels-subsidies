# 📋 Plan d'Implémentation - Améliorations 1, 2 et 3

## ⚠️ Identification des Risques et Stratégies de Mitigation

### 🔴 Risque 1 : Refactorisation de la normalisation de données

**Risques identifiés :**
- ❌ **Régression silencieuse** : Si la logique de normalisation change, les données peuvent être mal formatées
- ❌ **Perte de compatibilité** : Les différents formats d'années (2019-2024) peuvent avoir des champs différents
- ❌ **Erreurs de typage** : Les types TypeScript peuvent ne pas correspondre après refactorisation
- ❌ **Performance** : La fonction extraite peut être appelée plus souvent qu'avant

**Stratégies de mitigation :**
- ✅ **Tests avant refactorisation** : Créer des tests qui valident le comportement actuel AVANT de refactoriser
- ✅ **Comparaison de résultats** : Comparer les résultats avant/après avec des données réelles
- ✅ **Migration progressive** : Garder l'ancien code en commentaire temporairement
- ✅ **Validation des types** : S'assurer que tous les types sont correctement exportés et importés
- ✅ **Tests de régression** : Tester avec des données de chaque année (2019-2024)

### 🔴 Risque 2 : Implémentation du cache localStorage

**Risques identifiés :**
- ❌ **Données obsolètes** : Le cache peut contenir d'anciennes données si les fichiers JSON changent
- ❌ **Quota localStorage** : Les données peuvent être volumineuses (7,635 subsides × plusieurs années)
- ❌ **Erreurs de sérialisation** : Les objets complexes peuvent ne pas être correctement sérialisés/désérialisés
- ❌ **Compatibilité navigateur** : localStorage peut ne pas être disponible (mode privé, certains navigateurs)
- ❌ **Conflits de version** : Si le format des données change, le cache peut être incompatible

**Stratégies de mitigation :**
- ✅ **Versioning du cache** : Ajouter un numéro de version au cache et invalider si version différente
- ✅ **Gestion des erreurs** : Try/catch autour de toutes les opérations localStorage
- ✅ **Fallback gracieux** : Si le cache échoue, charger depuis les fichiers JSON normalement
- ✅ **Limite de taille** : Vérifier la taille avant de stocker, compresser si nécessaire
- ✅ **Nettoyage automatique** : Supprimer les anciens caches automatiquement
- ✅ **Option de purge** : Permettre à l'utilisateur de vider le cache manuellement

### 🔴 Risque 3 : Configuration des tests

**Risques identifiés :**
- ❌ **Configuration complexe** : Vitest + React Testing Library nécessitent une configuration spécifique
- ❌ **Tests qui cassent** : Les tests peuvent révéler des bugs existants qu'il faudra corriger
- ❌ **Couverture incomplète** : Les tests peuvent ne pas couvrir tous les cas edge
- ❌ **Maintenance** : Les tests doivent être maintenus à chaque modification

**Stratégies de mitigation :**
- ✅ **Configuration progressive** : Commencer par des tests simples, puis complexifier
- ✅ **Tests non-bloquants** : Ne pas bloquer le développement si certains tests échouent initialement
- ✅ **Documentation** : Documenter comment exécuter les tests
- ✅ **CI/CD ready** : Préparer la configuration pour l'intégration continue

---

## 📝 Plan d'Exécution

### Phase 1 : Préparation et Tests de Base ✅
1. Créer des tests pour valider le comportement actuel de la normalisation
2. Vérifier que les tests passent avec les données réelles
3. Documenter les cas edge identifiés

### Phase 2 : Refactorisation (Amélioration 1) 🔄
1. Créer `src/lib/data-normalizer.ts` avec la fonction de normalisation
2. Extraire la logique de `parseAmount` également
3. Créer des types TypeScript pour les données brutes
4. Remplacer progressivement les deux occurrences dans `page.tsx`
5. Vérifier que les résultats sont identiques

### Phase 3 : Cache (Amélioration 2) ⏳
1. Créer `src/lib/cache.ts` avec les fonctions de cache
2. Implémenter le versioning et la gestion d'erreurs
3. Intégrer dans `loadData` avec fallback gracieux
4. Tester avec différentes tailles de données

### Phase 4 : Tests (Amélioration 3) ⏳
1. Configurer Vitest et React Testing Library
2. Écrire des tests pour le normalizer
3. Écrire des tests pour le cache
4. Ajouter des tests d'intégration basiques

---

## ✅ Checklist de Validation

Avant de considérer chaque phase comme terminée :

- [ ] Tous les tests passent
- [ ] Aucune régression visuelle (vérifier manuellement dans le navigateur)
- [ ] Les données chargées sont identiques avant/après
- [ ] Les erreurs sont gérées gracieusement
- [ ] La performance n'est pas dégradée
- [ ] Le code est documenté

