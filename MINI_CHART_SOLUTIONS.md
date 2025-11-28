# Solutions pour Mini-Graphique d'Évolution dans le Header

## Objectif
Ajouter un petit graphique d'évolution temporelle des montants filtrés à côté du titre "Liste des subsides" pour visualiser rapidement si l'évolution est normale ou anormale.

---

## Solution 1: Mini Sparkline (Ligne simple) ⭐⭐⭐⭐⭐

**Design ultra-léger et minimaliste**

### Caractéristiques:
- ✅ Ligne simple sans axes visibles
- ✅ Hauteur: 40-50px
- ✅ Largeur: 150-200px
- ✅ Couleur dynamique (vert si stable/croissant, orange/rouge si décroissant)
- ✅ Point sur la dernière valeur
- ✅ Tooltip au survol avec année et montant

### Avantages:
- Très compact, ne prend pas de place
- Visuel immédiat de la tendance
- Design moderne (sparkline)
- Pas de distraction

### Implémentation:
- Utiliser Recharts LineChart avec axes masqués
- Calculer l'évolution par année des `filteredSubsides`
- Couleur basée sur la tendance

---

## Solution 2: Mini Bar Chart (Barres horizontales) ⭐⭐⭐⭐

**Barres empilées compactes**

### Caractéristiques:
- ✅ Barres verticales miniatures
- ✅ Hauteur: 50-60px
- ✅ Largeur: 200-250px
- ✅ 3-4 barres max (dernières années)
- ✅ Couleur uniforme ou dégradé
- ✅ Tooltip avec détails

### Avantages:
- Plus d'informations visibles
- Facile à comprendre
- Bon compromis taille/info

### Inconvénients:
- Prend un peu plus de place
- Peut être moins élégant

---

## Solution 3: Mini Area Chart (Zone remplie) ⭐⭐⭐

**Zone colorée avec ligne**

### Caractéristiques:
- ✅ Zone remplie avec dégradé
- ✅ Ligne au-dessus
- ✅ Hauteur: 45-55px
- ✅ Largeur: 180-220px
- ✅ Effet visuel plus marqué

### Avantages:
- Visuellement attrayant
- Montre bien la tendance
- Design moderne

### Inconvénients:
- Peut être un peu chargé
- Nécessite plus d'espace

---

## Solution 4: Indicateur Simple (Badge + Icône) ⭐⭐

**Pas vraiment un graphique, mais indicateur**

### Caractéristiques:
- ✅ Badge avec tendance (↑ ↓ →)
- ✅ Pourcentage de variation
- ✅ Couleur selon tendance
- ✅ Très compact

### Avantages:
- Ultra compact
- Information directe

### Inconvénients:
- Moins visuel
- Pas vraiment un graphique

---

## 🎯 Recommandation: Solution 1 (Mini Sparkline)

**Pourquoi:**
1. **Ultra-compact** : Ne prend presque pas de place
2. **Visuel immédiat** : On voit la tendance d'un coup d'œil
3. **Design moderne** : Sparklines sont très utilisés dans les dashboards
4. **Informations au survol** : Tooltip avec détails
5. **Couleur dynamique** : Indique si évolution normale ou anormale

**Position:**
- À droite du titre "Liste des subsides (X résultats)"
- Dans le même CardHeader
- Responsive: masqué sur mobile si nécessaire

**Données:**
- Grouper `filteredSubsides` par année
- Calculer le total par année
- Afficher les 5-6 dernières années ou toutes si < 6

---

## Implémentation Technique

### Composant: `MiniEvolutionChart.tsx`

```typescript
interface MiniEvolutionChartProps {
  data: Array<{ year: string; amount: number }>
  height?: number
  width?: number
  showTooltip?: boolean
}
```

### Calcul des données:
```typescript
const evolutionData = useMemo(() => {
  const yearMap = new Map<string, number>()
  
  filteredSubsides.forEach(subside => {
    const year = subside.l_annee_de_debut_d_octroi_de_la_subvention_beginjaar_waarin_de_subsidie_wordt_toegekend
    if (year && year !== 'Non spécifié') {
      const current = yearMap.get(year) || 0
      yearMap.set(year, current + subside.montant_octroye_toegekend_bedrag)
    }
  })
  
  return Array.from(yearMap.entries())
    .map(([year, amount]) => ({ year, amount }))
    .sort((a, b) => a.year.localeCompare(b.year))
}, [filteredSubsides])
```

### Style:
- Axes masqués
- Ligne fine (2px)
- Point sur dernière valeur
- Couleur selon tendance
- Tooltip compact

