# Catalogue pro : badges de stock + gestion rupture

## Constat

Le catalogue pro (`/pro/catalogue`) affiche déjà les 10 variétés actives — dont BHM, Lemon Punch Hash et Piatella — avec leurs prix pro HT corrects et la dégressivité volume. Les paliers en base sont à jour pour chaque variété.

Ce qui manque : le catalogue pro n'affiche pas le stock disponible. Le client pro ne voit pas si une variété est en stock, en stock faible ou en rupture — alors que c'est déjà le cas dans l'espace commercial (`CommercialCataloguePage.tsx` avec `StockBadge`).

## Changements

### 1. Badges de stock dans le catalogue pro

Reprendre le même système que l'espace commercial :

- Hook `useProStock` (query `product_inventory` : `product_id, stock_grams, low_stock_threshold_g`) — identique à `useCommercialStock` mais avec une queryKey dédiée `["pro","stock"]`.
- Composant `StockBadge` réutilisé (vert « X g en stock », orange « Stock faible — X g », rouge « Rupture »).
- Affichage du badge à côté du nom du produit dans chaque carte du catalogue pro.

### 2. Produits en rupture

- Un produit `is_out_of_stock = true` (rupture) reste visible dans le catalogue pro (pour information) mais :
  - Carte estompée (opacity réduite)
  - Badge « Rupture » affiché
  - Les inputs de quantité sont désactivés (on ne peut pas commander une variété en rupture)

### 3. Section « À vendre en priorité »

- En haut du catalogue pro, un petit bandeau reprenant les 5 variétés avec le plus de stock (pour écouler les surplus) — identique à ce qui existe dans l'espace commercial si pertinent, sinon omis.

## Fichiers touchés

- `src/pages/pro/ProCataloguePage.tsx` — ajout des badges de stock, estompement des produits en rupture, désactivation des inputs
- Aucun changement de base de données, de prix ou de logique de commande

## Vérification

- Typecheck propre (`npx tsgo --noEmit -p tsconfig.app.json`)
- Playwright sur `/pro/catalogue` : toutes les variétés visibles, badges de stock corrects, produit en rupture estompé et inputs désactivés
