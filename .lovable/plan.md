

# Integration de la gamme "Force Noire"

## Concept

Differencier visuellement et structurellement les produits CBD classiques des produits enrichis avec une molecule supplementaire (Magic Sauce, 10-OH+).

**Deux gammes :**
- **Collection Classique** : Amnesia Signature Oniria, Platinum OG, Mint Kush, Ice O Lator, Golden CBN
- **Collection Force Noire** : 911 OG Indoor Master, Blue Mango Indoor Master, Nuage de Mousseux (tous ont une molecule en plus)

---

## Changements visuels

### Badge "Force Noire" sur les cartes produit
- Un badge distinctif noir/rouge sombre avec une icone de puissance (Zap ou Shield)
- Remplace ou complete le badge actuel (Magic Sauce, Rare 10-OH+)
- Effet visuel premium : bordure rouge sombre/noire, legere lueur

### Filtre supplementaire
- Sur la page d'accueil (ProductSection) et le catalogue : ajout d'un filtre "Force Noire" en plus de "Tout / Fleurs / Resines"
- Permet de voir uniquement les produits enrichis

### Indication sur la page produit detail
- Section expliquant ce qu'est la gamme "Force Noire" avec un texte court et luxueux

---

## Details techniques

### 1. `src/data/products.ts`
- Ajouter un champ `isForceNoire: boolean` au type `Product`
- Marquer les 3 produits concernes : 911 OG, Blue Mango, Nuage de Mousseux
- Ajouter un export `forceNoireProducts` filtrant les produits Force Noire

### 2. `src/components/ProductCard.tsx`
- Detecter `product.isForceNoire` pour afficher un badge "Force Noire" avec un style sombre/rouge premium
- Ajouter une legere bordure ou effet visuel different pour ces cartes (ex: bordure rouge sombre au survol)

### 3. `src/components/ProductSection.tsx` (page d'accueil)
- Ajouter un filtre "Force Noire" dans les boutons de categorie
- Quand selectionne, afficher uniquement les 3 produits Force Noire

### 4. `src/pages/CataloguePage.tsx`
- Ajouter "Force Noire" comme option de filtre dans les onglets de categorie
- Filtrer les produits en consequence

### 5. `src/pages/ProductPage.tsx`
- Afficher un encart "Collection Force Noire" sur les fiches des produits concernes
- Texte court expliquant la puissance superieure de ces produits

