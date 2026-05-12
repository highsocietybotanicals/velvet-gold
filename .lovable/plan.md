## Objectif

Remplacer l'affichage du prix par défaut (basé sur 1g) par **« À partir de X€/g »** sur chaque produit, où X est le **prix au gramme le plus bas** atteignable (palier 100g pour les CBD classiques, palier le plus avantageux pour l'Élixir Noir).

## Prix le plus bas par produit

**Groupe A — CBD classiques (12€/g de base, -50% à partir de 100g)**
- Tous → **À partir de 6,00€/g**

**Élixir Noir (grille fixe + dégressif additionnel -20% au-delà de 100g)**
- Nuage de Mousseux : 65€/10g → -20% à 100g → **À partir de 5,20€/g**
- 911 OG : 90€/10g → -20% à 100g → **À partir de 7,20€/g**
- Blue Mango : 80€/10g → -20% à 100g → **À partir de 6,40€/g**

## Où afficher la mention

1. **Cartes produits** (`ProductCard.tsx`) — petit label "À partir de X€/g" affiché sous (ou à côté de) le nom, en complément du prix dynamique selon le poids sélectionné. Reste visible même quand l'utilisateur change le format.
2. **Page produit** (`ProductPage.tsx`) — même mention, près du titre / du sélecteur de poids.
3. **Catalogue** — hérite via `ProductCard`.

Le prix principal (calculé selon le poids choisi) reste affiché tel quel — la mention « À partir de » est une **information additionnelle** pour montrer le meilleur tarif possible, pas un remplacement du prix dynamique.

## Détails techniques

- Ajouter dans `src/lib/pricing.ts` une fonction `getLowestPricePerGram(basePrice, priceGroup, productId)` qui :
  - Pour Force Noire : prend la grille du produit, calcule `calculateForceNoirePrice(productId, 100) / 100`.
  - Pour Groupe A/B : applique le `discount` du dernier palier (100g+) à `basePrice`.
- Ajouter un petit composant d'affichage (texte gold/muted, type `text-xs text-muted-foreground`) dans `ProductCard.tsx` et `ProductPage.tsx` : `À partir de {prix.toFixed(2)}€/g`.
- Pas de changement DB, pas de changement panier, pas de changement de la logique de calcul existante.

## Question ouverte

Tu veux la mention :
- **Uniquement sur les cartes du catalogue** (visible avant clic), ou
- **Partout** (cartes + page produit détaillée) — recommandé pour cohérence.

Par défaut je pars sur **partout**.
