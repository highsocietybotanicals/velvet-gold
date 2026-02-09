

# Poids par defaut a 1g sur tout le site

## Probleme

Actuellement, le poids par defaut est regle sur 2.5g partout, ce qui affiche un premier prix de 30 euros qui peut faire peur aux visiteurs. L'utilisateur veut que le poids par defaut soit 1g pour montrer un prix d'entree plus accessible.

## Modifications

### 1. Ajouter 1g dans les poids pre-definis

**Fichier : `src/lib/pricing.ts`** (ligne 67)

Changer `PRESET_WEIGHTS` de `[2.5, 10, 25, 50, 100]` a `[1, 2.5, 10, 25, 50, 100]` pour que le bouton 1g soit disponible.

### 2. Poids par defaut a 1g sur les cartes produit

**Fichier : `src/components/ProductCard.tsx`** (lignes 125-126)

Changer les valeurs initiales :
- `selectedWeight` : de `2.5` a `1`
- `customWeight` : de `"2.5"` a `"1"`

### 3. Poids par defaut a 1g sur la page produit

**Fichier : `src/pages/ProductPage.tsx`** (lignes 53-54)

Meme changement :
- `selectedWeight` : de `2.5` a `1`
- `customWeight` : de `"2.5"` a `"1"`

## Resultat

- Le bouton "1g" apparait en premier dans la liste des poids
- Tous les produits affichent le prix pour 1g par defaut (12 euros ou 14 euros selon le groupe)
- Beaucoup plus accessible visuellement pour les nouveaux visiteurs

