# Visualisation : Page FWB Musiques Actuelles

## 📍 Accès à la page

### Option 1 : Nouveau bouton dans le menu de navigation
```
┌─────────────────────────────────────────────────────────┐
│  [Recherche]  [Graphs]  [INFO]  [FWB] ← Nouveau bouton │
└─────────────────────────────────────────────────────────┘
```

### Option 2 : Lien dans la page INFO
Un lien dans la section "Source" ou "À propos" qui pointe vers la page FWB.

### Option 3 : URL directe
`/fwb-musiques-actuelles` - accessible directement ou via un lien externe.

---

## 🎨 Apparence de la page

### Structure générale
```
┌─────────────────────────────────────────────────────────────┐
│  [Header avec navigation]                                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Contrats et CP - Musiques actuelles                │   │
│  │                                                       │   │
│  │  Liste des associations bénéficiaires avec liens    │   │
│  │  vers leurs accords de subside                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ASBL 1001 Valises (Balkan Trafik)                   │   │
│  │  [contrat-programme] [2024-2028]                     │   │
│  │                                    [Voir les subsides]│   │
│  │                                    3 subsides • 45K€ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ASBL Animacy (Fifty Lab)                            │   │
│  │  [contrat-programme] [2024-2028]                     │   │
│  │                                    [Voir les subsides]│   │
│  │                                    1 subside • 12K€  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ASBL Belgomania (Les Francofolies de Spa)           │   │
│  │  [contrat-programme] [2024-2028]                     │   │
│  │                                                       │   │
│  │  (Pas de lien - aucune correspondance trouvée)       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ... (autres associations)                                    │
│                                                               │
│  [Footer]                                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Exemples visuels détaillés

### Association AVEC subsides (lien visible)

```
┌──────────────────────────────────────────────────────────────┐
│  ASBL 1001 Valises (Balkan Trafik)                           │
│                                                               │
│  ┌──────────────────┐  ┌──────────┐                         │
│  │ contrat-programme│  │ 2024-2028│                         │
│  └──────────────────┘  └──────────┘                         │
│                                                               │
│                                    ┌──────────────────────┐  │
│                                    │ 📄 Voir les subsides │  │
│                                    │    (bouton vert)     │  │
│                                    └──────────────────────┘  │
│                                                               │
│                                   3 subsides • 45 234 €      │
└──────────────────────────────────────────────────────────────┘
```

**Comportement :**
- Le bouton "Voir les subsides" est **visible et cliquable**
- Au clic, redirige vers `/` avec recherche pré-remplie : `?search=ASBL 1001 Valises (Balkan Trafik)`
- Affiche les résultats filtrés pour cette association

---

### Association SANS subsides (pas de lien)

```
┌──────────────────────────────────────────────────────────────┐
│  ASBL Belgomania (Les Francofolies de Spa)                   │
│                                                               │
│  ┌──────────────────┐  ┌──────────┐                         │
│  │ contrat-programme│  │ 2024-2028│                         │
│  └──────────────────┘  └──────────┘                         │
│                                                               │
│  (Aucun lien affiché - pas de correspondance dans la base)   │
└──────────────────────────────────────────────────────────────┘
```

**Comportement :**
- **Aucun bouton** n'est affiché
- L'association est quand même listée (pour transparence)
- L'utilisateur peut toujours chercher manuellement dans la page Recherche

---

## 🎯 Design détaillé (inspiré du style existant)

### Carte d'association (avec subsides)
```tsx
<div className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all bg-white">
  <div className="flex items-start justify-between gap-4">
    {/* Nom de l'association */}
    <div className="flex-1">
      <h3 className="font-semibold text-lg mb-2 text-gray-900">
        ASBL 1001 Valises (Balkan Trafik)
      </h3>
      
      {/* Badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          contrat-programme
        </Badge>
        <Badge variant="outline" className="bg-green-50 text-green-700">
          2024-2028
        </Badge>
      </div>
    </div>
    
    {/* Section avec lien */}
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="default"
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
      >
        <FileText className="w-4 h-4" />
        Voir les subsides
      </Button>
      <p className="text-xs text-gray-500 text-right">
        3 subsides • 45 234 €
      </p>
    </div>
  </div>
</div>
```

### Carte d'association (sans subsides)
```tsx
<div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 opacity-75">
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1">
      <h3 className="font-semibold text-lg mb-2 text-gray-700">
        ASBL Belgomania (Les Francofolies de Spa)
      </h3>
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline">contrat-programme</Badge>
        <Badge variant="outline">2024-2028</Badge>
      </div>
    </div>
    
    {/* Pas de bouton - espace vide ou message discret */}
    <div className="text-xs text-gray-400 italic">
      Aucun subside trouvé
    </div>
  </div>
</div>
```

---

## 📊 Groupement par type de contrat

### Option : Sections organisées

```
┌─────────────────────────────────────────────────────────────┐
│  Contrats-Programmes                                         │
│  ────────────────────────────────────────────────────────   │
│                                                               │
│  [ASBL 1001 Valises] [Voir les subsides]                    │
│  [ASBL Animacy] [Voir les subsides]                         │
│  [ASBL Belgomania] (pas de lien)                            │
│  ...                                                         │
│                                                               │
│  Contrats de création                                        │
│  ────────────────────────────────────────────────────────   │
│                                                               │
│  [ASBL Collectif du Lion] [Voir les subsides]              │
│  ...                                                         │
│                                                               │
│  Contrats de diffusion                                        │
│  ────────────────────────────────────────────────────────   │
│                                                               │
│  [ASBL 13 Rue Roture] [Voir les subsides]                   │
│  ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Comportement du lien "Voir les subsides"

### Au clic sur le bouton :

1. **Redirection vers la page Recherche** (`/`)
2. **Recherche automatique** avec le nom de l'association
3. **Affichage des résultats filtrés** pour cette association

**URL générée :**
```
/?search=ASBL 1001 Valises (Balkan Trafik)
```

**Résultat :**
- La page Recherche s'affiche
- Le champ de recherche est pré-rempli avec le nom de l'association
- Les subsides correspondants sont affichés automatiquement
- L'utilisateur peut voir tous les détails (montants, années, etc.)

---

## 📱 Responsive (mobile)

### Sur mobile :
```
┌─────────────────────────────┐
│ ASBL 1001 Valises          │
│ (Balkan Trafik)            │
│                             │
│ [contrat-programme]         │
│ [2024-2028]                 │
│                             │
│ ┌───────────────────────┐   │
│ │ 📄 Voir les subsides  │   │
│ └───────────────────────┘   │
│                             │
│ 3 subsides • 45 234 €       │
└─────────────────────────────┘
```

- Layout vertical
- Bouton pleine largeur
- Badges empilés

---

## 🎨 Couleurs et style

### Inspiré du design existant :
- **Bouton "Voir les subsides"** : Vert (`bg-green-600`) pour indiquer "disponible"
- **Badges** : Couleurs différentes selon le type de contrat
- **Cartes** : Bordure grise, ombre au survol
- **Associations sans subsides** : Opacité réduite, style grisé

---

## 📈 Statistiques (optionnel)

### En-tête de page avec stats :
```
┌─────────────────────────────────────────────────────────────┐
│  Contrats et CP - Musiques actuelles                        │
│                                                               │
│  67 associations • 23 avec subsides • 45 sans subsides      │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Résumé pour l'utilisateur

**Ce que l'utilisateur verra :**

1. **Une nouvelle page** accessible via le menu ou directement
2. **Une liste de toutes les associations** de la page FWB
3. **Un bouton "Voir les subsides"** uniquement pour les associations qui ont des subsides dans la base
4. **Au clic** : redirection vers la page Recherche avec les résultats filtrés
5. **Design cohérent** avec le reste de l'application

**Avantages pour l'utilisateur :**
- ✅ Transparence : voir toutes les associations
- ✅ Accès direct : lien vers les subsides en un clic
- ✅ Pas de confusion : seules les associations avec subsides ont un lien
- ✅ Navigation fluide : retour vers la recherche avec résultats pré-filtrés

