# Ristourne cumulée par catégorie + cadeaux dès 10 g

## Objectif
Dans Logistique > Commande manuelle, la remise dégressive ne se calcule plus ligne par ligne mais sur le **poids cumulé de chaque catégorie de prix**. Et les cadeaux (briquet + feuilles slim) se déclenchent dès 10 g cumulés, peu importe les variétés.

## Comportement attendu
- On additionne le poids par catégorie :
  - Groupe A (CBD classiques) : total A
  - Groupe B / Force Noire, Nectar Divin, Exotique : total B (grille par produit)
- Chaque ligne est ensuite facturée au tarif du palier atteint par le **total de sa catégorie**.
  - Exemple : 3 variétés du groupe A à 2 g = 6 g cumulés → chaque ligne bénéficie du palier « 5 g » ; à 10 g cumulés, palier « 10 g » (-33 % groupe A).
  - Même principe côté Force Noire : le palier atteint par le cumul du groupe donne le €/g appliqué à chaque ligne de ce groupe.
- Les prix forcés manuellement restent prioritaires (aucun changement) ; le « tarif auto » affiché devient le tarif cumulé, donc le bouton ↺ renvoie au bon prix.
- Le €/g affiché par ligne reflète le tarif cumulé.

## Cadeaux
- Le compteur de cadeaux passe sur le **poids total fleurs + résines** (aujourd'hui seules les fleurs comptent en commande manuelle).
- 1 kit (1 briquet + 1 paquet de feuilles slim) par tranche de 10 g cumulés, ajouté automatiquement à la commande — comme sur le site client.
- Les échantillons 1 g gratuits suivent la même base cumulée (1 par tranche de 10 g).

## Détails techniques
- `src/lib/pricing.ts` : ajout d'un helper `calculateCumulativeItemPrice(basePrice, weight, cumulativeWeight, priceGroup, productId)` qui choisit le palier avec `cumulativeWeight` mais applique le €/g résultant au `weight` de la ligne. Pour Force Noire : `calculateForceNoirePrice(productId, cumulativeWeight, basePrice) / cumulativeWeight * weight`.
- `src/components/admin/ManualOrderCreator.tsx` :
  - calcul de `groupWeights = { A, B }` à partir des lignes fleurs/résines (accessoires exclus),
  - `autoLineTotal(line)` utilise le poids cumulé du groupe de la ligne,
  - `totalFlowerWeight` inclut les résines (catégories `fleur` et `resine`), ce qui pilote `allowedSamples` et `giftKitsCount`,
  - la case « inclure les cadeaux » reste cochée par défaut.
- Aucun changement de base de données, ni du panier client (déjà cumulatif pour les cadeaux).

## Vérifications
- 5 lignes de 2 g groupe A → 10 g : chaque ligne à 8,00 €/g (-33 %), total 80 €, 1 kit cadeau + 1 échantillon proposés.
- 3 lignes groupe A (2 g) + 2 lignes Force Noire (2 g) → remises distinctes : 6 g pour A, 4 g pour B, et 1 kit cadeau (10 g cumulés).
- Prix forcé sur une ligne : total inchangé, badge « Prix forcé » et écart calculés par rapport au nouveau tarif cumulé.
