# 🤝 Guide de Contribution

Merci de votre intérêt pour contribuer à **Subsides Bruxelles** ! Ce guide vous aidera à participer efficacement au projet.

## 🎯 Objectif du projet

Notre mission est de **rendre transparente la distribution des subsides publics** dans la Région de Bruxelles-Capitale pour **restaurer la confiance des citoyens** dans l'utilisation de l'argent public.

## 🚀 Comment commencer

### 1. Fork et Clone
```bash
git clone https://github.com/[votre-username]/brussels-sub.git
cd brussels-sub
npm install
```

### 2. Lancer le projet
```bash
npm run dev
```

### 3. Créer une branche
```bash
git checkout -b feature/votre-fonctionnalite
```

## 🎨 Types de contributions

### 🐛 Corrections de bugs
- Corriger des erreurs existantes
- Améliorer la gestion d'erreurs
- Optimiser les performances

### ✨ Nouvelles fonctionnalités
- Améliorer l'interface utilisateur
- Ajouter de nouvelles visualisations
- Créer de nouveaux filtres
- Améliorer la recherche

### 📊 Amélioration des données
- Affiner la catégorisation des subsides
- Ajouter de nouvelles métriques
- Améliorer l'analyse des données

### 🎨 Design & UX
- Améliorer l'interface
- Optimiser l'expérience mobile
- Créer de nouveaux composants

### 📝 Documentation
- Améliorer le README
- Créer des guides utilisateur
- Documenter le code

## 🛠️ Structure du projet

```
src/
├── app/                 # Pages Next.js
│   ├── page.tsx        # Page principale
│   └── layout.tsx      # Layout global
├── components/         # Composants réutilisables
│   └── ui/            # Composants UI (Shadcn)
└── lib/               # Utilitaires et configuration
public/
├── data-*.json        # Données des subsides
└── README-DATA.md     # Documentation des données
```

## 📋 Standards de code

### TypeScript
- Utiliser TypeScript pour tout le code
- Typer toutes les fonctions et variables
- Éviter `any` autant que possible

### Style
- Utiliser Prettier pour le formatage
- Suivre les conventions ESLint
- Commenter le code complexe

### Composants
- Utiliser des composants fonctionnels
- Préférer les hooks React
- Garder les composants petits et focalisés

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec couverture
npm run test:coverage
```

## 📝 Processus de contribution

### 1. Issue
- Vérifiez s'il existe déjà une issue
- Créez une issue si nécessaire
- Assignez-vous l'issue

### 2. Développement
- Créez une branche depuis `main`
- Développez votre fonctionnalité
- Testez vos changements
- Documentez si nécessaire

### 3. Pull Request
- Créez une PR claire et détaillée
- Liez l'issue correspondante
- Ajoutez des captures d'écran si pertinent
- Attendez la review

### 4. Review
- Répondez aux commentaires
- Faites les modifications demandées
- Testez après chaque changement

## 🎯 Priorités actuelles

### 🔥 Urgent
- [ ] Améliorer la catégorisation des bénéficiaires
- [ ] Optimiser les performances de recherche
- [ ] Corriger les bugs d'affichage mobile

### 📈 Important
- [ ] Ajouter des tests unitaires
- [ ] Améliorer l'accessibilité
- [ ] Créer de nouvelles visualisations

### 💡 Idées
- [ ] Export PDF des données
- [ ] Notifications de nouveaux subsides
- [ ] API publique
- [ ] Application mobile

## 🐛 Signaler un bug

Utilisez le template d'issue pour les bugs :

```markdown
**Description du bug**
Une description claire du problème.

**Étapes pour reproduire**
1. Aller à '...'
2. Cliquer sur '...'
3. Voir l'erreur

**Comportement attendu**
Ce qui devrait se passer.

**Captures d'écran**
Si applicable.

**Environnement**
- OS: [ex: Windows, macOS, Linux]
- Navigateur: [ex: Chrome, Firefox, Safari]
- Version: [ex: 1.0.0]
```

## 💡 Proposer une fonctionnalité

```markdown
**Description de la fonctionnalité**
Une description claire de ce que vous voulez.

**Problème résolu**
Quel problème cela résout-il ?

**Solution proposée**
Comment vous imaginez la solution ?

**Alternatives considérées**
D'autres solutions possibles ?
```

## 📞 Communication

- **Issues GitHub** : Pour les bugs et suggestions
- **Discussions** : Pour les questions générales
- **Pull Requests** : Pour les contributions de code

## 🙏 Code de conduite

- Soyez respectueux et bienveillant
- Acceptez les critiques constructives
- Aidez les autres contributeurs
- Respectez les opinions différentes

## 🎉 Reconnaissance

Tous les contributeurs seront mentionnés dans le README et les releases. Merci de participer à ce projet d'intérêt public !

---

**Ensemble, rendons la transparence accessible à tous ! 🏛️✨**
