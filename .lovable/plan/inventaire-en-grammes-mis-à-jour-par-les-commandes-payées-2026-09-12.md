# Inventaire en grammes, mis à jour par les commandes payées

## Objectif

Une page "Inventaire" dans l'administration où tu saisis le stock réel de chaque variété en grammes. Dès qu'une commande passe en payée, les grammes vendus (cadeaux et échantillons compris) sont automatiquement déduits.

## Ce que tu verras

Nouvelle page **Inventaire** dans le menu admin :

- Un tableau de toutes les fleurs et résines : nom, stock restant en grammes, seuil d'alerte, statut.
- Saisie directe du stock (mise à jour immédiate) et bouton "+ / − grammes" pour un réapprovisionnement rapide.
- Ligne en alerte orange quand le stock passe sous le seuil, en rouge à zéro.
- Compteurs en haut : variétés en alerte, variétés épuisées, total de grammes en stock.
- Historique des mouvements (vente, réappro, correction manuelle) avec la date et la commande concernée.

## Automatisme

- Quand une commande devient **payée** (paiement en ligne, webhook, commande pro ou passage manuel en payé par toi), chaque ligne de la commande déduit son poids du stock de la variété correspondante.
- Les cadeaux et échantillons sont déduits aussi, comme demandé.
- Une commande déjà comptabilisée ne peut pas être déduite deux fois.
- Si une commande payée est annulée, les grammes sont recrédités.
- Quand un stock atteint 0, la variété passe automatiquement en **rupture** sur le site et n'est plus commandable. Dès que tu remets du stock, elle redevient disponible.

## Détails techniques

**Base de données (migration)**

- Table `product_inventory` : `product_id` (clé, réf. `products`), `stock_grams` numeric, `low_stock_threshold_g` numeric défaut 10, `updated_at`. GRANT + RLS : lecture/écriture admin uniquement (`is_admin()`), `service_role` complet.
- Table `inventory_movements` : `product_id`, `order_id` nullable, `delta_grams`, `reason` (`sale` | `restock` | `manual` | `cancel`), `note`, `created_at`. RLS admin en lecture, insert admin + service_role.
- Contrainte d'unicité `(order_id, product_id, reason)` pour l'idempotence des ventes.
- Fonction `apply_order_stock(p_order_id uuid, p_direction int)` SECURITY DEFINER : agrège `order_items` par `product_id` (`coalesce(weight,0) * coalesce(quantity,1)`, toutes lignes hors `accessory`), insère les mouvements et met à jour `product_inventory` (upsert, stock peut aller à 0 minimum).
- Trigger `AFTER UPDATE OF payment_status ON orders` : `unpaid|pending → paid` déclenche la déduction ; `paid → refunded/annulé` ou `status = 'cancelled'` sur commande payée recrédite. Trigger `AFTER INSERT` couvre les commandes créées directement en payé (commandes manuelles / pro).
- Trigger sur `product_inventory` : `is_out_of_stock = (stock_grams <= 0)` sur `products` à chaque changement de stock.

**Front**

- `src/hooks/useInventory.ts` : lecture jointe `products` + `product_inventory`, mutations set stock / ajuster / seuil, invalidation des caches `products` et `catalog-products`.
- `src/components/admin/InventoryManager.tsx` + `src/pages/admin/InventoryPage.tsx`, route et entrée de menu dans `AdminSidebar` (icône Boxes), style Gilded Botanica existant.
- Les accessoires (briquets, feuilles, pochons) restent hors inventaire : ils ne sont pas dans la table produits. À traiter dans un second temps si tu le souhaites.

## Initialisation

Les stocks démarrent à 0 pour toutes les variétés ; tu saisis les quantités réelles une première fois sur la page Inventaire.
