# Solutions pour Afficher Tous les Subsides d'un Bénéficiaire

## 📋 Contexte

L'utilisateur souhaite que lorsqu'on clique sur le nom du bénéficiaire dans le Dialog de détail d'un subside, cela affiche tous les subsides de ce bénéficiaire.

---

## 🎯 Version 1 : Fermer le Dialog et Filtrer la Liste (Recommandée)

### Principe
- Cliquer sur le nom du bénéficiaire ferme le Dialog
- Applique automatiquement un filtre de recherche avec le nom du bénéficiaire
- La liste principale affiche tous les subsides de ce bénéficiaire

### Avantages ✅
- **Réutilise l'infrastructure existante** : Utilise le système de recherche déjà en place
- **Cohérent avec l'UX** : L'utilisateur reste sur la même page, voit la liste filtrée
- **Simple à implémenter** : Juste besoin de fermer le Dialog et mettre à jour `searchTerm`
- **Performance** : Pas besoin de charger des données supplémentaires dans le Dialog
- **Fonctionne avec le système de filter presets** : Peut créer un preset pour partager le filtre

### Inconvénients ❌
- Ferme le Dialog (perd le contexte du subside actuel)
- Nécessite de rouvrir un subside pour voir ses détails

### Implémentation

```typescript
// Dans le DialogContent, rendre le nom cliquable
<div>
  <h5 className="font-medium text-sm sm:text-base text-gray-600">Nom</h5>
  <button
    onClick={() => {
      // Fermer le Dialog
      // Appliquer le filtre de recherche
      setSearchTerm(subside.beneficiaire_begunstigde)
      // Optionnel : créer un filter preset pour partage
      const filterId = createFilterPreset({
        search: subside.beneficiaire_begunstigde,
        year: selectedDataYear !== 'all' ? selectedDataYear : undefined,
      }, 'beneficiary')
    }}
    className="font-semibold text-sm sm:text-base text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
  >
    {subside.beneficiaire_begunstigde}
  </button>
</div>
```

### Code Complet

```typescript
// Dans src/app/page.tsx, section "Informations bénéficiaire"
<div className="space-y-2 sm:space-y-3">
  <h4 className="font-semibold text-base sm:text-lg">Informations bénéficiaire</h4>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
    <div>
      <h5 className="font-medium text-sm sm:text-base text-gray-600">Nom</h5>
      <button
        onClick={() => {
          // Utiliser le système de filter presets pour cohérence
          const filterId = createFilterPreset(
            {
              search: subside.beneficiaire_begunstigde,
              year: selectedDataYear !== 'all' ? selectedDataYear : undefined,
            },
            'beneficiary'
          )
          
          // Fermer le Dialog et rediriger vers la liste filtrée
          if (filterId && typeof window !== 'undefined') {
            window.location.href = `/?filter=${filterId}`
          } else {
            // Fallback : fermer le Dialog et appliquer le filtre localement
            setSearchTerm(subside.beneficiaire_begunstigde)
            // Le Dialog se fermera automatiquement car on change l'état
          }
        }}
        className="font-semibold text-sm sm:text-base text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
        title={`Voir tous les subsides de ${subside.beneficiaire_begunstigde}`}
      >
        {subside.beneficiaire_begunstigde}
      </button>
    </div>
    {/* ... reste du code ... */}
  </div>
</div>
```

---

## 🎯 Version 2 : Afficher la Liste dans le Dialog (Alternative)

### Principe
- Cliquer sur le nom du bénéficiaire garde le Dialog ouvert
- Affiche une section supplémentaire dans le Dialog avec tous les subsides du bénéficiaire
- Scrollable dans le Dialog

### Avantages ✅
- **Garde le contexte** : Le Dialog reste ouvert, on voit toujours les détails du subside actuel
- **Navigation rapide** : Peut cliquer sur d'autres subsides du même bénéficiaire directement
- **Vue d'ensemble** : Voit tous les subsides du bénéficiaire en un coup d'œil

### Inconvénients ❌
- **Plus complexe** : Nécessite de gérer l'état d'affichage dans le Dialog
- **Performance** : Charge et affiche potentiellement beaucoup de données dans le Dialog
- **UX potentiellement chargée** : Le Dialog peut devenir très long
- **Pas de réutilisation** : Ne réutilise pas le système de recherche existant

### Implémentation

```typescript
// Ajouter un état pour gérer l'affichage de la liste
const [showBeneficiarySubsides, setShowBeneficiarySubsides] = useState(false)

// Calculer les subsides du bénéficiaire
const beneficiarySubsides = useMemo(() => {
  if (!showBeneficiarySubsides) return []
  return subsides.filter(s => 
    s.beneficiaire_begunstigde === subside.beneficiaire_begunstigde
  )
}, [showBeneficiarySubsides, subsides, subside.beneficiaire_begunstigde])

// Dans le DialogContent
<div>
  <h5 className="font-medium text-sm sm:text-base text-gray-600">Nom</h5>
  <button
    onClick={() => setShowBeneficiarySubsides(!showBeneficiarySubsides)}
    className="font-semibold text-sm sm:text-base text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
  >
    {subside.beneficiaire_begunstigde}
    <span className="ml-2 text-xs">
      ({subsides.filter(s => s.beneficiaire_begunstigde === subside.beneficiaire_begunstigde).length} subsides)
    </span>
  </button>
</div>

{/* Section affichant la liste des subsides du bénéficiaire */}
{showBeneficiarySubsides && (
  <div className="mt-4 border-t pt-4">
    <h4 className="font-semibold text-base sm:text-lg mb-3">
      Tous les subsides de {subside.beneficiaire_begunstigde}
      <span className="text-sm font-normal text-gray-500 ml-2">
        ({beneficiarySubsides.length} résultat{beneficiarySubsides.length > 1 ? 's' : ''})
      </span>
    </h4>
    <div className="space-y-2 max-h-[300px] overflow-y-auto">
      {beneficiarySubsides.map((benefSubside, idx) => (
        <div
          key={`${benefSubside.article_complet_volledig_artikel}-${idx}`}
          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
          onClick={() => {
            // Optionnel : scroll vers le subside dans la liste principale
            // ou fermer le Dialog et ouvrir ce subside
          }}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-medium text-sm">{benefSubside.nom_de_la_subvention_naam_van_de_subsidie}</p>
              <p className="text-xs text-gray-500 mt-1">
                {benefSubside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-sm text-green-600">
                {benefSubside.montant_octroye_toegekend_bedrag.toLocaleString()} €
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

### Code Complet avec Gestion d'État

```typescript
// Au niveau du composant principal
const [expandedBeneficiary, setExpandedBeneficiary] = useState<string | null>(null)

// Dans chaque Dialog
<Dialog>
  <DialogTrigger asChild>
    {/* ... carte du subside ... */}
  </DialogTrigger>
  <DialogContent>
    {/* ... contenu existant ... */}
    
    {/* Section bénéficiaire avec toggle */}
    <div className="space-y-2 sm:space-y-3">
      <h4 className="font-semibold text-base sm:text-lg">Informations bénéficiaire</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <h5 className="font-medium text-sm sm:text-base text-gray-600">Nom</h5>
          <button
            onClick={() => {
              setExpandedBeneficiary(
                expandedBeneficiary === subside.beneficiaire_begunstigde 
                  ? null 
                  : subside.beneficiaire_begunstigde
              )
            }}
            className="font-semibold text-sm sm:text-base text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left flex items-center gap-2"
          >
            {subside.beneficiaire_begunstigde}
            <span className="text-xs font-normal text-gray-500">
              ({subsides.filter(s => s.beneficiaire_begunstigde === subside.beneficiaire_begunstigde).length})
            </span>
          </button>
        </div>
        {/* ... */}
      </div>
    </div>

    {/* Liste des subsides du bénéficiaire */}
    {expandedBeneficiary === subside.beneficiaire_begunstigde && (
      <div className="mt-4 border-t pt-4">
        <h4 className="font-semibold text-base sm:text-lg mb-3">
          Tous les subsides de {subside.beneficiaire_begunstigde}
        </h4>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {subsides
            .filter(s => s.beneficiaire_begunstigde === subside.beneficiaire_begunstigde)
            .sort((a, b) => {
              // Trier par année décroissante, puis par montant décroissant
              const yearA = parseInt(a.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend)
              const yearB = parseInt(b.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend)
              if (yearA !== yearB) return yearB - yearA
              return b.montant_octroye_toegekend_bedrag - a.montant_octroye_toegekend_bedrag
            })
            .map((benefSubside, idx) => (
              <div
                key={`${benefSubside.article_complet_volledig_artikel}-${idx}`}
                className={`p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                  benefSubside.article_complet_volledig_artikel === subside.article_complet_volledig_artikel
                    ? 'bg-blue-50 border-blue-200'
                    : 'cursor-pointer'
                }`}
                onClick={() => {
                  if (benefSubside.article_complet_volledig_artikel !== subside.article_complet_volledig_artikel) {
                    // Fermer ce Dialog et ouvrir le nouveau
                    // Nécessite de gérer l'état du Dialog ouvert
                  }
                }}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 line-clamp-2">
                      {benefSubside.nom_de_la_subvention_naam_van_de_subsidie}
                    </p>
                    <div className="flex gap-2 mt-1.5">
                      <Badge variant="outline" className="text-xs">
                        {benefSubside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {categorizeSubside(benefSubside.l_objet_de_la_subvention_doel_van_de_subsidie)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm text-green-600">
                      {benefSubside.montant_octroye_toegekend_bedrag.toLocaleString()} €
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
```

---

## 📊 Comparaison des Versions

| Critère | Version 1 (Fermer + Filtrer) | Version 2 (Liste dans Dialog) |
|---------|------------------------------|-------------------------------|
| **Simplicité** | ⭐⭐⭐⭐⭐ Très simple | ⭐⭐⭐ Moyennement complexe |
| **Réutilisation** | ⭐⭐⭐⭐⭐ Utilise le système existant | ⭐⭐ Code spécifique |
| **Performance** | ⭐⭐⭐⭐⭐ Pas de surcharge | ⭐⭐⭐ Charge dans Dialog |
| **UX** | ⭐⭐⭐⭐ Cohérent avec la page | ⭐⭐⭐⭐ Pratique mais chargé |
| **Maintenabilité** | ⭐⭐⭐⭐⭐ Facile à maintenir | ⭐⭐⭐ Plus de code à maintenir |
| **Partage** | ⭐⭐⭐⭐⭐ Supporte les filter presets | ⭐⭐ Pas de partage direct |

---

## 🎯 Recommandation : Version 1

### Pourquoi ?
1. **Réutilise l'infrastructure existante** : Le système de recherche et de filter presets est déjà en place
2. **Cohérent avec l'UX** : L'utilisateur reste sur la page principale, voit la liste filtrée
3. **Simple et maintenable** : Moins de code, moins de bugs potentiels
4. **Performance** : Pas de chargement supplémentaire dans le Dialog
5. **Partageable** : Peut créer un filter preset pour partager le filtre

### Améliorations Possibles
- Ajouter un indicateur visuel (badge) montrant le nombre de subsides du bénéficiaire
- Afficher un message de confirmation avant de fermer le Dialog
- Optionnel : Garder le Dialog ouvert mais désactivé pendant le filtrage

---

## 🚀 Implémentation Recommandée (Version 1)

### Étape 1 : Rendre le nom cliquable
```typescript
// Dans la section "Informations bénéficiaire"
<button
  onClick={handleBeneficiaryClick}
  className="font-semibold text-sm sm:text-base text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
>
  {subside.beneficiaire_begunstigde}
</button>
```

### Étape 2 : Créer le handler
```typescript
const handleBeneficiaryClick = useCallback((beneficiaryName: string) => {
  // Créer un filter preset pour partage
  const filterId = createFilterPreset(
    {
      search: beneficiaryName,
      year: selectedDataYear !== 'all' ? selectedDataYear : undefined,
    },
    'beneficiary'
  )
  
  // Rediriger vers la liste filtrée
  if (filterId && typeof window !== 'undefined') {
    window.location.href = `/?filter=${filterId}`
  }
}, [selectedDataYear])
```

### Étape 3 : Ajouter un indicateur visuel
```typescript
// Afficher le nombre de subsides du bénéficiaire
const beneficiaryCount = subsides.filter(
  s => s.beneficiaire_begunstigde === subside.beneficiaire_begunstigde
).length

<button
  onClick={() => handleBeneficiaryClick(subside.beneficiaire_begunstigde)}
  className="..."
>
  {subside.beneficiaire_begunstigde}
  <Badge variant="outline" className="ml-2 text-xs">
    {beneficiaryCount} subside{beneficiaryCount > 1 ? 's' : ''}
  </Badge>
</button>
```

---

## 📝 Notes d'Implémentation

### Points d'Attention
1. **Gestion du Dialog** : Le Dialog se fermera automatiquement lors de la redirection
2. **État de recherche** : Le filter preset sera chargé automatiquement via l'URL
3. **Performance** : Le calcul du nombre de subsides peut être optimisé avec `useMemo`
4. **Accessibilité** : Ajouter `aria-label` et `title` pour les lecteurs d'écran

### Tests à Prévoir
- Vérifier que le filtre s'applique correctement
- Vérifier que le filter preset est créé
- Vérifier que la redirection fonctionne
- Vérifier le comportement sur mobile

