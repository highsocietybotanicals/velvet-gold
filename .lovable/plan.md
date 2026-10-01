# Commande de Claire Trit (100 € TTC)

## La commande
- Cliente : Claire Trit — clairetrit@hotmail.fr, 06 82 65 83 30, 9 toulon 44170 Nozay (même fiche que ses 3 commandes précédentes).
- Livraison en main propre, commande créée **payée** et **livrée** (elle a déjà ses produits).
- Total : **100 € TTC tout rond**, soit 2 € le gramme, réparti ligne par ligne :

| Produit | Poids | Prix TTC |
|---|---|---|
| Mango x Ice | 20 g | 40 € |
| Heisenberg | 10 g | 20 € |
| Piatella | 10 g | 20 € |
| BHM (Bubble Hash Matureté) | 5 g | 10 € |
| Lemon Punch Hash | 5 g | 10 € |
| **Total** | **50 g** | **100 €** |

## Stock
- Mango x Ice, Heisenberg, Piatella : **aucun impact** sur le stock.
- BHM : −5 g. Lemon Punch Hash : −5 g. Ces deux sorties apparaîtront dans l'historique de l'inventaire, rattachées à cette commande.

## Vérification
- La commande apparaît dans l'admin avec son numéro HSB, 100 € et les 5 lignes.
- Le stock de BHM et de Lemon a baissé de 5 g chacun ; celui des trois autres variétés n'a pas changé.

## Détails techniques
- Insertion directe : commande `paid`/`delivered`, `order_channel` manuel, puis `order_items`. La déduction automatique se déclenche à l'insertion de la commande, avant les lignes : elle ne retire donc rien.
- Sorties manuelles ensuite pour BHM et Lemon uniquement (`product_inventory` −5 g + `inventory_movements` `sale` avec l'`order_id`).
- Heisenberg est retiré de la vente : la ligne reste enregistrée normalement, sans le remettre en vente.
- Livraison en main propre payée : une fiche kilométrique sera créée automatiquement pour Nozay, comme pour ses commandes précédentes.
