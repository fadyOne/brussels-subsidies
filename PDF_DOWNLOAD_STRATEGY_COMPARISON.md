# Comparaison des Stratégies de Téléchargement de PDFs

## Problème Actuel

Le script actuel explore les pages et télécharge les PDFs en même temps. Cela crée plusieurs problèmes :
- Si le script crash, on perd la progression de l'exploration
- Difficile de relancer uniquement les téléchargements échoués
- Impossible de paralléliser efficacement les téléchargements
- L'exploration est ralentie par les téléchargements

---

## Solution 1 : Approche en Deux Phases (Découverte puis Téléchargement)

### Description

Séparer complètement l'exploration de la récupération en deux phases distinctes :

**Phase 1 - Découverte** :
- Parcourir toutes les pages HTML récursivement
- Extraire et stocker toutes les URLs de PDFs trouvées dans un fichier JSON
- Ne télécharger AUCUN PDF pendant cette phase
- Stocker aussi les métadonnées (page source, profondeur, date de découverte)
- Continuer jusqu'à ce qu'il n'y ait plus de nouvelles pages à explorer

**Phase 2 - Téléchargement** :
- Lire le fichier JSON avec toutes les URLs de PDFs
- Télécharger tous les PDFs (avec retry, rate limiting, etc.)
- Mettre à jour l'index au fur et à mesure
- Permettre de relancer cette phase indépendamment si des téléchargements échouent

### Avantages

- **Séparation des préoccupations** : l'exploration est pure, le téléchargement est isolé
- **Reprise après crash** : on peut relancer la phase 2 sans re-explorer
- **Parallélisation facile** : on peut télécharger plusieurs PDFs en parallèle car on a toutes les URLs
- **Meilleure gestion des erreurs** : on peut marquer les URLs qui ont échoué et les retenter
- **Exploration plus rapide** : pas ralentie par les téléchargements
- **Statistiques précises** : on sait exactement combien de PDFs on va télécharger avant de commencer
- **Possibilité de filtrage** : on peut filtrer les URLs avant de télécharger (par année, par pattern, etc.)

### Inconvénients

- **Deux exécutions nécessaires** : il faut lancer le script deux fois (ou avec un flag)
- **Stockage intermédiaire** : nécessite un fichier JSON pour stocker les URLs
- **Pas de feedback immédiat** : on ne voit pas les PDFs téléchargés pendant l'exploration
- **Complexité accrue** : il faut gérer deux phases distinctes

### Risques

- Le fichier JSON peut devenir très volumineux (milliers d'URLs)
- Si la phase 1 crash, on peut perdre la progression (mais on peut sauvegarder périodiquement)
- Les URLs peuvent devenir obsolètes entre la phase 1 et la phase 2
- Risque de doublons si on relance la phase 1 plusieurs fois

### Éviter les Risques

- Sauvegarder le fichier JSON périodiquement pendant la phase 1 (toutes les 100 pages)
- Utiliser un format compact pour le JSON (pas de métadonnées inutiles)
- Implémenter une déduplication des URLs (normalisation, Set, etc.)
- Ajouter un timestamp pour détecter les URLs obsolètes
- Permettre de fusionner plusieurs fichiers JSON de découverte

---

## Solution 2 : Approche Hybride (Découverte avec Cache + Téléchargement Différé)

### Description

Combiner les deux approches : explorer et télécharger normalement, MAIS aussi stocker toutes les URLs trouvées dans un cache. Si on relance le script, on peut :
- Option A : Utiliser le cache pour télécharger directement (skip l'exploration)
- Option B : Re-explorer mais utiliser le cache pour éviter de re-télécharger les PDFs déjà trouvés
- Option C : Mode "découverte seule" qui ne fait que mettre à jour le cache

Le cache contient :
- Toutes les URLs de PDFs trouvées (avec métadonnées)
- L'état de chaque URL (non téléchargé, téléchargé, échec, etc.)
- La date de dernière découverte

### Avantages

- **Flexibilité** : on peut utiliser l'approche actuelle OU la nouvelle approche
- **Récupération après crash** : on peut relancer uniquement les téléchargements échoués
- **Progression sauvegardée** : le cache permet de reprendre où on s'est arrêté
- **Compatibilité** : fonctionne avec le code existant (ajout progressif)

### Inconvénients

- Plus complexe à implémenter (deux modes de fonctionnement)
- Nécessite de maintenir la cohérence entre le cache et l'index
- Peut créer de la confusion (quelle approche utiliser ?)

### Risques

- Le cache peut devenir désynchronisé avec la réalité
- Complexité de maintenance accrue
- Risque de bugs si les deux modes ne sont pas bien testés

### Éviter les Risques

- Utiliser le cache comme source de vérité principale
- Implémenter une commande de "nettoyage" du cache
- Ajouter des flags CLI clairs (`--discover-only`, `--download-only`, `--normal`)
- Tester les deux modes séparément

---

## Solution 3 : Approche avec Queue et Workers (Asynchrone)

### Description

Implémenter un système de queue asynchrone :
- **Queue de découverte** : les pages HTML à explorer sont ajoutées à une queue
- **Queue de téléchargement** : les URLs de PDFs trouvées sont ajoutées à une autre queue
- **Workers séparés** : des workers différents traitent les deux queues en parallèle
- **Persistance** : les deux queues sont sauvegardées sur disque (fichiers JSON ou base de données légère)

Le système fonctionne ainsi :
1. Worker de découverte : explore les pages, extrait les liens PDFs, les ajoute à la queue de téléchargement
2. Worker de téléchargement : télécharge les PDFs de la queue, met à jour l'index
3. Les deux workers fonctionnent en parallèle et indépendamment

### Avantages

- **Parallélisation maximale** : découverte et téléchargement en même temps
- **Résilience** : si un worker crash, l'autre continue
- **Scalabilité** : on peut ajouter plus de workers de téléchargement si nécessaire
- **Reprise facile** : les queues persistent, on peut relancer les workers
- **Priorisation** : on peut prioriser certaines URLs dans les queues

### Inconvénients

- **Complexité élevée** : nécessite un système de queue, de workers, de synchronisation
- **Ressources** : consomme plus de CPU, mémoire, connexions réseau
- **Debugging difficile** : plus complexe à déboguer avec plusieurs workers
- **Dépendances** : peut nécessiter une bibliothèque de queue (Bull, BullMQ, etc.) ou implémentation custom

### Risques

- **Race conditions** : deux workers pourraient télécharger le même PDF
- **Surcharge du serveur** : trop de requêtes simultanées
- **Fuites de ressources** : les workers peuvent ne pas libérer correctement les ressources
- **Complexité** : beaucoup de code à maintenir

### Éviter les Risques

- Utiliser des locks pour éviter les race conditions
- Implémenter un rate limiter global partagé entre tous les workers
- Utiliser un pool de workers avec timeout et limites
- Ajouter un système de monitoring pour détecter les workers bloqués
- Commencer simple (2 workers) avant de complexifier

---

## Solution 4 : Approche Hybride Optimisée (Recommandée)

### Description

Combiner les meilleurs aspects des solutions précédentes :

**Architecture** :
1. **Phase de découverte** (optionnelle, peut être sautée si cache existe) :
   - Explorer toutes les pages et stocker les URLs de PDFs dans un fichier `discovered-pdfs.json`
   - Sauvegarder périodiquement (toutes les 50-100 pages)
   - Marquer chaque URL avec son état initial (`pending`)

2. **Phase de téléchargement** (peut être lancée indépendamment) :
   - Lire `discovered-pdfs.json`
   - Télécharger tous les PDFs avec état `pending`
   - Mettre à jour l'état (`downloaded`, `failed`, `skipped`)
   - Permettre de relancer pour retenter les `failed`

3. **Mode hybride** (par défaut) :
   - Explorer ET télécharger en même temps (comme actuellement)
   - MAIS aussi sauvegarder les URLs dans le cache
   - Permet de relancer les téléchargements échoués plus tard

**Fichiers de données** :
- `discovered-pdfs.json` : toutes les URLs de PDFs trouvées avec métadonnées
- `download-queue.json` : queue des PDFs à télécharger (état, retry, etc.)
- `index.json` : index des PDFs téléchargés (existant)

**Commandes CLI** :
- `node download-pdfs-recursive.js` : mode hybride (explore + télécharge)
- `node download-pdfs-recursive.js --discover-only` : phase 1 seulement
- `node download-pdfs-recursive.js --download-only` : phase 2 seulement (utilise le cache)
- `node download-pdfs-recursive.js --retry-failed` : retente les téléchargements échoués

### Avantages

- **Flexibilité maximale** : on peut utiliser n'importe quelle approche
- **Reprise après crash** : on peut relancer les téléchargements échoués
- **Compatibilité** : fonctionne avec le code existant
- **Progression sauvegardée** : on ne perd jamais la découverte des URLs
- **Optimisation progressive** : on peut commencer simple et ajouter des features

### Inconvénients

- Plus de fichiers à gérer
- Nécessite de maintenir la cohérence entre les fichiers
- Légèrement plus complexe que l'approche actuelle

### Risques

- Les fichiers peuvent devenir désynchronisés
- Complexité de gestion des états
- Risque de doublons si mal géré

### Éviter les Risques

- Utiliser un format JSON structuré avec validation
- Implémenter des commandes de "nettoyage" et "synchronisation"
- Ajouter des checksums pour détecter les incohérences
- Documenter clairement chaque mode d'utilisation

---

## Recommandation : Solution 4 (Hybride Optimisée)

La **Solution 4** est la meilleure car elle :
1. **Garde la simplicité** : le mode par défaut fonctionne comme actuellement
2. **Ajoute la flexibilité** : on peut utiliser les phases séparées si besoin
3. **Permet la reprise** : on ne perd jamais les URLs découvertes
4. **Évolutive** : on peut ajouter des features progressivement

### Implémentation Progressive

**Étape 1** : Ajouter le cache de découverte (sauvegarder les URLs trouvées)
**Étape 2** : Ajouter le mode `--download-only` (utiliser le cache)
**Étape 3** : Ajouter le mode `--discover-only` (exploration pure)
**Étape 4** : Ajouter la parallélisation du téléchargement (optionnel)

Cette approche permet d'améliorer le script progressivement sans casser ce qui fonctionne déjà.

