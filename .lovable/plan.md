## Problème

Les prix unitaires sur la facture PDF s'affichent **HT** alors que les prix sur le site sont **TTC**.

- Ice O Lator / Golden CBN : 12 € TTC sur le site → 10,00 € HT sur la facture (12 ÷ 1,20)
- 911 OG : 15 € TTC sur le site → 12,50 € HT sur la facture (15 ÷ 1,20)

D'où la confusion : la facture est mathématiquement correcte (TVA 20%), mais le client lit la colonne "Prix unit." comme du TTC. Les prix stockés dans `order_items.unit_price` sont bien corrects (12 € et 15 €, en TTC).

## Solution

Dans `supabase/functions/generate-invoice-pdf/index.ts`, basculer le tableau d'articles en **TTC** pour qu'il corresponde exactement à ce que voit le client sur le site, tout en gardant le détail HT / TVA / TTC dans le bloc des totaux (obligation comptable).

### Changements précis

1. **Tableau articles** :
   - Colonne "Prix unit. HT" → **"Prix unit. TTC"**, affichée avec `item.unit_price` brut (12 €, 15 €).
   - Colonne "Total HT" → **"Total TTC"**, affichée avec `item.total_price` brut.
   - Colonne "TVA" conservée (20 %).

2. **Bloc des totaux** (inchangé) :
   - Sous-total TTC, remise promo, Total HT, TVA, **TOTAL TTC** restent affichés. Cela conserve la conformité (mention HT + TVA + TTC obligatoire sur une facture).

3. **Aucun changement DB / aucune autre fonction touchée**. Les commandes existantes pourront regénérer une facture corrigée si besoin (le PDF est régénéré à la demande).

### Fichier modifié

- `supabase/functions/generate-invoice-pdf/index.ts` (lignes ~244-285 : libellés colonnes + calcul `unitHT`/`totalItemHT` retirés au profit de `unit_price` / `total_price` directs).

### Vérification

Après déploiement, regénérer la facture de la dernière commande pour valider : Ice O Lator s'affichera bien à **12,00 € / g** et 911 OG à **15,00 € / g**, avec le Total TTC inchangé.
