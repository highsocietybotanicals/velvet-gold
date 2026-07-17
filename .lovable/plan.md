
## Correction Haribo — Prix + Visuel

### 1. Grille de prix (retenue : 15/35/60/100)

Ajouter Haribo à la grille fixe par produit dans `src/lib/pricing.ts`. Cette grille prime déjà sur les tiers Groupe B (voir `FORCE_NOIRE_PRICE_GRID` : quand un produit y figure, `calculatePrice` et `getLowestPricePerGram` utilisent la grille au lieu du dégressif).

Grille Haribo (TTC) :
```
1g   →  15 €
2.5g →  35 €
5g   →  60 €
10g  → 100 €
```
Au-delà de 10g : base 10 €/g (100 ÷ 10) + dégressif additionnel léger déjà en place dans la fonction (−10 % à 25g, −15 % à 50g, −20 % à 100g).

Renommage minimal : la constante `FORCE_NOIRE_PRICE_GRID` sera renommée `PRODUCT_PRICE_GRID` (plus neutre, car elle sert désormais aussi à Nectar Divin). Toutes les références internes (`calculateForceNoirePrice`, `getLowestPricePerGram`, `calculatePrice`, `calculateItemPrice`, `getDiscountLabel`) sont mises à jour dans le même fichier. La fonction `calculateForceNoirePrice` reste appelée ainsi (comportement identique), pour éviter de toucher d'autres fichiers.

Vérification affichage : le "À partir de" utilisera `getLowestPricePerGram` → grille 100g extrapolée = 10 €/g × (1 − 0.20) = **8 €/g** affiché.

### 2. Visuel produit (retenu : nouvelle photo studio premium)

Générer un nouveau rendu **haute joaillerie** cohérent avec Ice O Lator / Golden CBN / Nuage de Mousseux :

- Fond noir profond, éclairage dramatique clair-obscur, reflets dorés subtils.
- Sujet : bloc de résine ambrée-dorée translucide (rappel de la couleur du plan HARIBO), texture cristalline/laquée, mise en scène type nature morte de joaillerie.
- Cadrage carré (1024×1024), profondeur de champ courte, léger reflet au sol.
- Aucun texte, aucun logo, aucune marque.
- Style et palette calés sur les autres résines premium du catalogue.

Sortie : `src/assets/resins/haribo-premium.jpg` (image standard, pas d'asset CDN — mêmes conventions que les autres résines du catalogue statique).

L'ancien pointeur CDN `src/assets/resins/haribo.jpg.asset.json` est supprimé (avec `lovable-assets delete` pour retirer aussi le binaire du CDN) puisqu'inutilisé.

### 3. Synchronisation

- `src/data/products.ts` : remplacer `image: hariboAsset.url` par un import du nouveau fichier `haribo-premium.jpg`, retirer l'import du pointeur JSON.
- `public.products.image_url` en base : mettre à jour vers le chemin du nouvel asset via `supabase--insert` (UPDATE simple).
- Aucun autre changement (thème Nectar Divin, badge, catégorie, description, catalogue → déjà en place).

### Fichiers touchés

- `src/lib/pricing.ts` — ajout entrée grille Haribo (+ renommage interne facultatif).
- `src/data/products.ts` — swap de l'import image.
- `src/assets/resins/haribo-premium.jpg` — nouveau visuel généré.
- `src/assets/resins/haribo.jpg.asset.json` — supprimé + purge CDN.
- Table `products` — UPDATE du `image_url` de la ligne `haribo`.
