# Analyse Performance Page Graph - Solutions Professionnelles

**Date:** 2025-12-05  
**Problème:** Lenteur et non-réactivité lors du clic sur "Graph"  
**Objectif:** Identifier et résoudre les goulots d'étranglement de performance

---

## Diagnostic du Problème

Lors du clic sur "Graph", plusieurs opérations coûteuses s'exécutent :
1. **Chargement des données** : Fetch de plusieurs fichiers JSON (2019-2024) si pas en cache
2. **Normalisation des données** : Traitement de milliers d'entrées
3. **Calculs lourds** : `groupBeneficiaries()`, `topGlobalBeneficiaries`, `topBeneficiariesByCategory`
4. **Rendu des graphiques** : Nivo, Recharts chargés et rendus immédiatement
5. **Blocage du thread principal** : Tous les calculs s'exécutent de manière synchrone

---

## Solution 1: Lazy Loading et Code Splitting avec React.lazy()

### Description

Implémenter le lazy loading des composants de graphiques et des calculs lourds en utilisant `React.lazy()` et `Suspense`. La page Graph ne chargera que le code nécessaire au moment où elle est accédée, réduisant le bundle initial et améliorant le temps de chargement de la page principale.

### Implémentation

Séparer la page Analyse en composants lazy-loaded : les graphiques (NivoBarChart, Top10PieChart), les calculs de données (topGlobalBeneficiaries), et même la logique de comparaison d'organisations. Utiliser `Suspense` avec des fallbacks appropriés (SkeletonLoader) pour maintenir une expérience utilisateur fluide. Le router Next.js chargera automatiquement le code de la page `/analyse` uniquement quand l'utilisateur clique sur le lien, mais on peut aller plus loin en lazy-loadant les composants internes.

### Avantages

Réduction significative du bundle initial (potentiellement 30-50% de réduction), amélioration du First Contentful Paint (FCP) et du Time to Interactive (TTI) de la page principale. L'utilisateur perçoit une navigation plus rapide car la page Recherche se charge instantanément. Les graphiques ne sont chargés que quand nécessaire, économisant de la bande passante et de la mémoire.

### Risques et Mitigation

**Risque 1:** Flash de contenu non stylé (FOUC) lors du chargement dynamique. **Mitigation:** Utiliser des SkeletonLoaders cohérents avec le design final, et précharger les chunks critiques avec `<link rel="prefetch">` dans le head.

**Risque 2:** Délai supplémentaire au premier clic sur Graph (chargement du chunk). **Mitigation:** Implémenter un prefetch intelligent : détecter le hover sur le bouton "Graphs" et précharger le chunk en arrière-plan, rendant le clic instantané.

**Risque 3:** Complexité accrue du code avec plusieurs points de Suspense. **Mitigation:** Créer un composant `LazyChartWrapper` réutilisable qui gère le Suspense de manière centralisée, réduisant la duplication de code.

---

## Solution 2: Optimisation des Calculs avec Web Workers et Débouncing

### Description

Déplacer les calculs lourds (groupBeneficiaries, agrégations de données) dans un Web Worker pour ne pas bloquer le thread principal. Implémenter un système de calcul progressif où les données essentielles sont calculées en premier (pour afficher rapidement), puis les calculs secondaires s'exécutent en arrière-plan. Ajouter un debouncing intelligent pour éviter les recalculs inutiles lors des changements d'état.

### Implémentation

Créer un worker dédié (`data-processor.worker.ts`) qui reçoit les données brutes et retourne les résultats calculés. Utiliser `useMemo` avec des dépendances optimisées et implémenter un système de priorité : calculer d'abord `yearData` (simple et rapide), puis `topGlobalBeneficiaries` (moyen), et enfin `topBeneficiariesByCategory` (le plus lourd) en arrière-plan. Utiliser `requestIdleCallback` pour les calculs non-critiques et afficher progressivement les graphiques au fur et à mesure que les données sont prêtes.

### Avantages

Le thread principal reste réactif, permettant à l'interface de répondre immédiatement aux clics même pendant les calculs. L'expérience utilisateur est fluide avec un affichage progressif : les graphiques simples apparaissent rapidement, puis les graphiques complexes se chargent. Les performances sont améliorées sur les appareils moins puissants car les calculs ne bloquent plus l'UI. Possibilité d'afficher des indicateurs de progression pour les calculs longs.

### Risques et Mitigation

**Risque 1:** Complexité de la gestion d'état asynchrone avec les Web Workers. **Mitigation:** Utiliser une bibliothèque comme `comlink` pour simplifier la communication avec les workers, ou créer un hook personnalisé `useWorkerData` qui abstrait la complexité.

**Risque 2:** Overhead de sérialisation/désérialisation des données vers/du worker. **Mitigation:** Utiliser `Transferable Objects` pour les grandes structures de données, et ne transférer que les données nécessaires (éviter de transférer tout l'objet Subside si on n'a besoin que de quelques champs).

**Risque 3:** Compatibilité navigateur (Web Workers supportés mais peut nécessiter un polyfill pour certains cas). **Mitigation:** Implémenter un fallback automatique : si les workers ne sont pas disponibles, exécuter les calculs sur le thread principal mais avec des `setTimeout` pour permettre au navigateur de respirer entre les calculs.

---

## Solution 3: Préchargement Intelligent et Optimisation du Cache

### Description

Implémenter un système de préchargement intelligent qui détecte l'intention de l'utilisateur (hover sur le bouton "Graphs") et précharge les données et le code en arrière-plan. Optimiser le système de cache existant pour stocker non seulement les données brutes mais aussi les résultats des calculs lourds. Utiliser le Service Worker pour mettre en cache les fichiers JSON et les résultats de calculs, permettant un chargement quasi-instantané lors des visites suivantes.

### Implémentation

Ajouter un `onMouseEnter` sur le bouton "Graphs" qui déclenche un préchargement : fetch des données JSON en priorité basse (`fetch(url, { priority: 'low' })`), préchargement du chunk JavaScript avec `next/dynamic` et `prefetch`, et pré-calcul des données essentielles en arrière-plan. Étendre le système de cache pour inclure les résultats de `groupBeneficiaries()` et `topGlobalBeneficiaries` avec une clé basée sur le hash des données sources. Implémenter un cache en mémoire avec expiration (TTL) pour les résultats de calculs, évitant de recalculer à chaque navigation.

### Avantages

Expérience utilisateur perçue comme instantanée : quand l'utilisateur clique après avoir survolé, tout est déjà chargé. Réduction drastique du temps de chargement lors des visites répétées grâce au cache des calculs. Pas de changement majeur de l'architecture existante, solution progressive et non-invasive. Compatible avec l'infrastructure actuelle (Next.js, cache localStorage).

### Risques et Mitigation

**Risque 1:** Consommation de bande passante inutile si l'utilisateur ne clique pas finalement. **Mitigation:** Utiliser `AbortController` pour annuler les requêtes si l'utilisateur quitte la page, et limiter le préchargement aux données essentielles (pas tout le bundle). Implémenter un système de "prefetch budget" qui limite le nombre de préchargements simultanés.

**Risque 2:** Augmentation de l'utilisation mémoire avec le cache des calculs. **Mitigation:** Implémenter un système LRU (Least Recently Used) pour le cache, limitant la taille totale et évictant automatiquement les entrées les moins utilisées. Ajouter une option pour vider le cache si nécessaire.

**Risque 3:** Staleness des données en cache si les fichiers JSON sont mis à jour. **Mitigation:** Utiliser des ETags ou des timestamps dans les métadonnées des fichiers JSON, et invalider automatiquement le cache quand une nouvelle version est détectée. Ajouter un bouton manuel "Rafraîchir les données" pour forcer le rechargement.

---

## Recommandation

**Solution recommandée : Combinaison Solution 1 + Solution 3**

Commencer par la **Solution 3 (Préchargement Intelligent)** car elle apporte des gains immédiats avec un risque minimal et une implémentation relativement simple. Ensuite, implémenter progressivement la **Solution 1 (Lazy Loading)** pour les composants les plus lourds, créant une architecture scalable et performante.

Cette approche hybride offre le meilleur compromis : réactivité immédiate grâce au préchargement, et réduction du bundle initial grâce au lazy loading, tout en minimisant les risques techniques.

---

## Métriques de Succès

- **Temps de chargement initial** : < 500ms (objectif)
- **Temps de réponse au clic** : < 100ms (objectif)
- **First Contentful Paint (FCP)** : < 1.5s
- **Time to Interactive (TTI)** : < 3s
- **Score Lighthouse Performance** : > 90

