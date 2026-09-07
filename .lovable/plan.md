# Paliers de commission : passer au barème progressif par tranche

## Contexte
Actuellement les paliers de rémunération des commerciaux appliquent le **taux du palier atteint à tout le CA HT du mois** (ex. 6 000 € HT → 12 % sur tout = 720 €). Le mode voulu est un **barème progressif par tranche** : 10 % sur les 5 000 premiers € HT, 12 % sur la tranche 5 000–10 000 €, 15 % au-delà (6 000 € → 500 + 120 = 620 €).

Le modèle de données ne change pas : chaque ligne `sales_commissions` reste enregistrée au taux flat du commercial (10 % par défaut). Le bonus mensuel reste le complément qui fait passer la commission totale du taux flat au barème progressif.

Aucune migration de base de données nécessaire — c'est un changement de calcul côté frontend uniquement.

## Changements

### 1. `src/hooks/useCommercial.ts`
- Ajouter une fonction `computeProgressiveCommission(tiers, revenueHT)` qui somme tranche par tranche : pour chaque palier `t`, la part de CA entre `t.min_revenue_ht` et le palier suivant est multipliée par `t.commission_percent`.
- Dans `aggregateMonthly` :
  - `tierCommission` devient le résultat de `computeProgressiveCommission(tiers, revenueHT)`.
  - `tierPercent` devient le **taux moyen effectif** = `revenueHT > 0 ? tierCommission / revenueHT * 100 : 0` (affiché comme « Taux moyen »).
  - `bonus` reste `max(0, tierCommission - baseCommission)`.
- `resolveTier` et `nextTier` restent inchangés (servent à la barre de progression vers la tranche suivante).

### 2. `src/pages/commercial/CommercialCommissionsPage.tsx`
- Libellé colonne « Palier » → « Taux moyen ».
- Les badges de paliers restent « Jusqu'à 5 000 € : 10 % » / « Dès 5 000 € : 12 % » / « Dès 10 000 € : 15 % » (toujours valables en mode tranche).
- Ajouter une ligne d'explication courte : « Barème progressif : 10 % jusqu'à 5 000 € HT, 12 % de 5 000 à 10 000 €, 15 % au-delà. »

### 3. `src/components/admin/SalesRepsManager.tsx`
- L'affichage `{m.tierPercent} %` par mois prend automatiquement le taux moyen effectif. Aucun autre changement nécessaire.

## Vérification
- `npx tsgo --noEmit -p tsconfig.app.json` après les éditions.
- Vérifier la page `/commercial` (CommercialCommissionsPage) et l'admin `SalesRepsManager` avec Playwright : badges, taux moyen, barre de progression, et bonus mensuels corrects.
