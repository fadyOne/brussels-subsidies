# 🛡️ Plan d'Implémentation - Filter Presets (Approche Prudente)

**Objectif:** Implémenter le système de filtrage depuis les graphiques de manière sûre et progressive.

---

## 📋 Plan d'Implémentation par Étapes

### Étape 1: Créer le système de base (Filter Presets)
**Objectif:** Créer le module de base sans l'utiliser encore.

**Risques:**
- ⚠️ **Risque:** Bugs dans la logique de stockage/chargement
- ⚠️ **Risque:** Problèmes de compatibilité sessionStorage
- ⚠️ **Risque:** Gestion d'erreurs insuffisante

**Mitigations:**
- ✅ Créer des tests unitaires complets
- ✅ Gérer tous les cas d'erreur (sessionStorage indisponible, etc.)
- ✅ Fallback automatique si sessionStorage échoue
- ✅ Validation stricte des données

**Critères de succès:**
- [ ] Module créé et testé
- [ ] Tests unitaires passent
- [ ] Gestion d'erreurs complète
- [ ] Fallback fonctionne

---

### Étape 2: Intégrer le chargement de presets dans la page de recherche
**Objectif:** La page de recherche peut charger des presets depuis l'URL.

**Risques:**
- ⚠️ **Risque:** Preset expiré ou invalide → erreur
- ⚠️ **Risque:** Preset corrompu → crash
- ⚠️ **Risque:** Conflit avec filtres existants
- ⚠️ **Risque:** Boucle infinie de redirection

**Mitigations:**
- ✅ Vérifier expiration avant utilisation
- ✅ Valider structure du preset
- ✅ Nettoyer les presets expirés au chargement
- ✅ Ne charger qu'une fois au mount
- ✅ Désactiver le chargement si déjà chargé

**Critères de succès:**
- [ ] Page charge les presets correctement
- [ ] Presets expirés sont ignorés
- [ ] Pas de conflit avec filtres manuels
- [ ] Pas de boucle de redirection

---

### Étape 3: Ajouter onClick handlers aux graphiques (sans redirection)
**Objectif:** Les graphiques peuvent créer des presets, mais ne redirigent pas encore.

**Risques:**
- ⚠️ **Risque:** Clic accidentel crée des presets inutiles
- ⚠️ **Risque:** Performance si trop de clics
- ⚠️ **Risque:** Noms très longs → problème de stockage

**Mitigations:**
- ✅ Limiter la création de presets (debounce)
- ✅ Vérifier la taille avant stockage
- ✅ Nettoyer les anciens presets
- ✅ Logger les créations pour debug

**Critères de succès:**
- [ ] Clics créent des presets
- [ ] Pas de problème de performance
- [ ] Noms longs gérés correctement
- [ ] Logs pour debugging

---

### Étape 4: Ajouter la redirection vers la page de recherche
**Objectif:** Clic sur graphique → redirection avec preset.

**Risques:**
- ⚠️ **Risque:** Redirection avant création du preset
- ⚠️ **Risque:** Preset non trouvé après redirection
- ⚠️ **Risque:** Perte de contexte (année, etc.)
- ⚠️ **Risque:** URLs invalides

**Mitigations:**
- ✅ Créer preset AVANT redirection
- ✅ Vérifier que preset existe avant redirection
- ✅ Inclure tous les filtres nécessaires dans le preset
- ✅ Valider l'URL avant navigation
- ✅ Fallback si preset non trouvé

**Critères de succès:**
- [ ] Redirection fonctionne
- [ ] Preset toujours disponible après redirection
- [ ] Tous les filtres appliqués correctement
- [ ] Fallback si problème

---

### Étape 5: Ajouter fallback hash pour sessionStorage indisponible
**Objectif:** Si sessionStorage ne fonctionne pas, utiliser hash.

**Risques:**
- ⚠️ **Risque:** Hash collision (même hash pour noms différents)
- ⚠️ **Risque:** Recherche par hash ne trouve rien
- ⚠️ **Risque:** Performance si beaucoup de calculs de hash

**Mitigations:**
- ✅ Utiliser SHA-256 (collisions extrêmement rares)
- ✅ Vérifier que le nom correspond au hash
- ✅ Cache des hashs calculés
- ✅ Fallback sur recherche normale si hash échoue

**Critères de succès:**
- [ ] Fallback fonctionne si sessionStorage indisponible
- [ ] Hash collisions détectées et gérées
- [ ] Performance acceptable
- [ ] Recherche fonctionne toujours

---

### Étape 6: Tests complets et nettoyage
**Objectif:** Tester tous les cas et nettoyer le code.

**Risques:**
- ⚠️ **Risque:** Cas limites non testés
- ⚠️ **Risque:** Code mort ou non utilisé
- ⚠️ **Risque:** Problèmes de performance

**Mitigations:**
- ✅ Tests pour tous les cas limites
- ✅ Tests de performance
- ✅ Nettoyage du code
- ✅ Documentation complète

**Critères de succès:**
- [ ] Tous les tests passent
- [ ] Performance acceptable
- [ ] Code propre et documenté
- [ ] Prêt pour production

---

## 🛡️ Risques Globaux et Mitigations

### Risque 1: SessionStorage désactivé ou plein
**Impact:** Haute - Système ne fonctionne pas

**Mitigation:**
- ✅ Détecter si sessionStorage disponible
- ✅ Fallback automatique sur hash
- ✅ Message d'erreur clair si aucun fallback ne fonctionne
- ✅ Tester avec sessionStorage désactivé

### Risque 2: Presets corrompus ou invalides
**Impact:** Moyenne - Erreurs ou comportement inattendu

**Mitigation:**
- ✅ Validation stricte de la structure
- ✅ Try-catch autour de JSON.parse
- ✅ Nettoyer les presets invalides automatiquement
- ✅ Logger les erreurs pour debug

### Risque 3: Performance avec beaucoup de presets
**Impact:** Moyenne - Ralentissement

**Mitigation:**
- ✅ Limiter le nombre de presets (max 50)
- ✅ Nettoyer les presets expirés régulièrement
- ✅ Utiliser des IDs courts
- ✅ Ne pas stocker de données volumineuses

### Risque 4: Conflits avec filtres manuels
**Impact:** Moyenne - Confusion utilisateur

**Mitigation:**
- ✅ Charger preset seulement au mount initial
- ✅ Ne pas écraser les filtres manuels
- ✅ Indicateur visuel si preset chargé
- ✅ Bouton pour effacer les filtres

### Risque 5: URLs partagées ne fonctionnent pas
**Impact:** Basse - Partage limité

**Mitigation:**
- ✅ Documenter que les URLs ne sont pas partageables (pour l'instant)
- ✅ Préparer migration future vers backend pour partage
- ✅ Message clair si preset expiré

---

## ✅ Checklist de Sécurité

Avant chaque étape:
- [ ] Tests unitaires écrits
- [ ] Gestion d'erreurs complète
- [ ] Fallbacks en place
- [ ] Validation des données
- [ ] Logging pour debug

Après chaque étape:
- [ ] Tests passent
- [ ] Pas de régressions
- [ ] Performance acceptable
- [ ] Code review
- [ ] Documentation mise à jour

---

## 🚀 Ordre d'Implémentation

1. **Étape 1:** Module de base (sans utilisation)
2. **Étape 2:** Chargement dans page recherche (sans création)
3. **Étape 3:** Création depuis graphiques (sans redirection)
4. **Étape 4:** Redirection complète
5. **Étape 5:** Fallback hash
6. **Étape 6:** Tests et nettoyage

---

**Approche:** Prudente, étape par étape, avec tests et validations à chaque étape.

