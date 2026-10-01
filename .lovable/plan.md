# Marge par commande : même CA que les Statistiques

## Cause de l'écart
- **Statistiques** : 8 539,88 € TTC, soit 7 420,38 € de commandes payées + **1 119,50 € des 2 factures pro de dépôt-vente**.
- **Marge par commande** : 7 420,38 € seulement, car les factures de dépôt-vente pro n'y figurent pas.

L'écart vient uniquement de ces 2 factures pro. Les commandes sont les mêmes des deux côtés.

## Ce qui change
- Les factures pro de dépôt-vente (hors annulées) apparaissent dans « Marge / commande », marquées « Dépôt pro », avec leur numéro FA-PRO, leur date, le montant facturé et le poids.
- Leur coût = grammes déposés × prix d'achat au gramme de chaque variété, plus le conditionnement. Pas de commission Viva, pas de frais de livraison.
- Les 3 cartes du haut (CA, coûts, bénéfice) incluent ces factures : le CA total retombe sur le même chiffre que le tableau des Statistiques.
- La limite d'affichage passe de 200 à 1 000 lignes, pour que l'écart ne revienne pas quand les commandes augmenteront.

## Détails techniques
- `OrderMarginTable.tsx` : requête supplémentaire `pro_invoices` (statut ≠ cancelled) avec `pro_deposits` (`product_id`, `weight_grams`, `quantity`). Chaque facture devient une ligne : revenu = `total_invoiced_ttc`, coût calculé via `costs` (coût/g + emballage), sans commission ni km. Fusion avec les commandes, triées par date.
- `.limit(200)` passe à `.limit(1000)` sur les commandes.
