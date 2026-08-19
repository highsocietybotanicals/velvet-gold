# Commande manuelle : ajouter briquets, feuilles et pochons

## Objectif
Dans Logistique > Commande manuelle, le menu « Choisir un produit » propose désormais des sous-catégories, dont une nouvelle section **Accessoires** (Briquet HSB, Feuilles Slim HSB, Petit Pochon, Grand Pochon), pour pouvoir les ajouter à la commande — payants ou offerts (prix à 0 €).

## Ce que tu verras
Menu déroulant organisé en 3 groupes :

```text
FLEURS
  Mango X Ice (Fleur)
  911 OG "Indoor Master" (Fleur)
  ...
RÉSINES
  Ice O Lator (Résine)
  ...
ACCESSOIRES
  Briquet HSB — 2.50 €
  Feuilles Slim HSB — 3.00 €
  Petit Pochon — 1.50 €
  Grand Pochon — 3.00 €
```

Pour une ligne accessoire :
- Le champ « g » devient un champ **quantité** (1, 2, 3…), pas de grammage.
- Le prix TTC de la ligne est pré-rempli (prix unitaire x quantité) et reste **librement modifiable** — mets `0` pour l'offrir.
- L'affichage « €/g » est remplacé par « €/unité ».
- Un badge « Offert » apparaît quand le prix de la ligne est à 0.

## Règles conservées
- Les accessoires ne comptent **pas** dans le poids de fleurs : ils n'ouvrent aucun droit à échantillon 1g ni à kit cadeau automatique (feuilles + briquet par tranche de 10g), qui continue de fonctionner comme aujourd'hui.
- Total commande, code promo, facture PDF, comptabilité et rentabilité reprennent les lignes accessoires avec leur prix réel (0 € si offert).

## Détails techniques
- `src/components/admin/ManualOrderCreator.tsx` :
  - Import de `accessories` depuis `src/data/accessories.ts`.
  - `OrderLine` reste `{ productId, weight, priceOverride }` ; `weight` sert de quantité pour un accessoire.
  - Helper `isAccessory(productId)` (recherche dans `accessories`).
  - `autoLineTotal` : pour un accessoire, `accessory.price * weight` au lieu de `calculateItemPrice`.
  - `totalFlowerWeight` : ignore déjà les non-fleurs (`allProducts.find` renvoie `undefined`), comportement vérifié inchangé.
  - Select découpé en `SelectGroup` + `SelectLabel` (Fleurs / Résines / Accessoires).
  - Insertion `order_items` pour un accessoire : `product_type: "accessory"`, `weight: null`, `quantity: line.weight`, `unit_price` = prix unitaire pratiqué, `total_price` = total de ligne.
- Aucun changement de base de données ni d'edge function ; la facture PDF affiche déjà `product_name` + total de ligne.

## Vérifications
- Ajouter 10g de 911 OG + 1 Briquet à 0 € : total = prix des fleurs, briquet listé « Offert ».
- Ajouter 2 Feuilles Slim à 3 € : ligne à 6 €, 3.00 €/unité, repris dans le total et la facture.
- Le kit cadeau automatique par 10g reste séparé et non dupliqué.
