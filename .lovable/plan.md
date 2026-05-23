## Objectif

Permettre aux clients classiques d'accéder à la **Livraison personnelle** avec des minimums adaptés à la distance, au lieu de la règle unique actuelle (100g min ou Pro).

## Nouvelle règle de seuils

| Distance depuis l'entrepôt (44) | Minimum de fleurs |
|---|---|
| Moins de 10 km | 2,5 g |
| Moins de 25 km | 5 g |
| Moins de 50 km | 50 g |
| Moins de 100 km | 100 g (règle actuelle conservée) |
| Pro validé | Aucun minimum (inchangé) |

## Changements UI (`src/components/DeliverySection.tsx`)

1. Remplacer la simple case à cocher « moins de 100km » par un **sélecteur de zone** à 4 options radio :
   - « Moins de 10 km » (min 2,5 g)
   - « Moins de 25 km » (min 5 g)
   - « Moins de 50 km » (min 50 g)
   - « Moins de 100 km » (min 100 g)
2. Le bouton "Livraison personnelle" est **activé** dès que le panier atteint ≥ 2,5 g (au lieu de ≥ 100 g) pour un client non-Pro.
3. Chaque option de zone n'est sélectionnable que si le panier respecte son minimum ; sinon grisée avec « À partir de Xg ».
4. Le `DeliveryScheduler` s'affiche dès qu'une zone valide est sélectionnée (remplace `isWithin100km`).
5. Texte du bouton mis à jour : « Je me déplace chez vous (Loire-Atlantique, jusqu'à 100 km) — à partir de 2,5 g ».

## Changements logique panier (`src/components/CartDrawer.tsx`)

- Remplacer l'état booléen `isWithin100km` par `personalDeliveryZone: "10" | "25" | "50" | "100" | null`.
- Validation : la zone choisie doit être compatible avec le poids du panier.
- Livraison personnelle reste gratuite (logique de frais inchangée).
- Pas de nouvelle colonne DB : la zone choisie est ajoutée dans `delivery_address`.

## Hors périmètre

- Pas de vérification automatique distance/code postal (le client confirme sa zone).
- Pas de changement des modes Postal / Point Relais.
- Pas de changement back-end / RLS / edge functions.
