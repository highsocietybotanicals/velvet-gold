# Commissions : 10/12/15 % sur les nouveaux clients, 10 % fixe sur les réassorts

## Ce qui est en place aujourd'hui (vérifié)

Le barème progressif par tranche (10 % jusqu'à 5 000 € HT, 12 % de 5 000 à 10 000 €, 15 % au-delà) s'applique à **tout** le chiffre d'affaires du mois, sans distinction entre nouveaux clients et réassorts. La prime de 50 € par nouveau client n'est nulle part dans le calcul : elle n'est mentionnée que dans les documents imprimés. Aucune commission n'a encore été enregistrée en base, donc rien à recalculer sur le passé.

## La nouvelle règle

Chaque ligne de commission est étiquetée **Nouveau client** ou **Réassort**.

- **Nouveau client** : toutes les commandes du client pendant son mois d'ouverture. Ce chiffre s'accumule sur le mois et le barème progressif par tranche s'y applique (10 % jusqu'à 5 000 €, 12 % sur la part de 5 000 à 10 000 €, 15 % sur la part au-delà) — comme les tranches d'impôt.
- **Réassort** : toute commande passée après le mois d'ouverture du client. 10 % fixe, toujours, sans effet sur les tranches.
- **Prime nouveau client** : 50 € par client pro nouvellement facturé, ajoutés automatiquement au total du mois.

Le classement est automatique : à la création d'une facture, si c'est la première fois que ce client est facturé ce mois-là ou qu'il n'a jamais été facturé, la vente compte comme nouveau client ; dès le mois suivant, c'est un réassort. Le commercial n'a rien à cocher.

### Exemple d'un mois

```text
Nouveaux clients trouvés : 12 000 € HT   → 5 000 x 10 %  =  500 €
                                           5 000 x 12 %  =  600 €
                                           2 000 x 15 %  =  300 €
Réassorts                 : 8 000 € HT   → 8 000 x 10 %  =  800 €
3 nouveaux clients signés                → 3 x 50 €      =  150 €
                                           TOTAL DU MOIS = 2 350 €
```

## Ce qui change dans l'application

**Espace commercial — Mes commissions**
Deux blocs distincts : « Nouveaux clients » (chiffre du mois, tranche atteinte, progression vers la tranche suivante) et « Réassorts » (chiffre du mois, 10 % fixe). Une ligne « Primes nouveaux clients » avec le nombre de clients et le montant. Le tableau mois par mois gagne les colonnes chiffre nouveaux clients / chiffre réassorts / primes / total dû. Le détail par client indique pour chaque ligne s'il s'agit d'un nouveau client ou d'un réassort.

**Administration — Commerciaux**
Le décompte à verser par commercial suit la même règle : tranches sur les nouveaux clients, 10 % sur les réassorts, primes incluses. Le bouton « Verser » du mois couvre l'ensemble.

**Guide commercial (PDF)**
Le chapitre rémunération est réécrit avec la règle exacte et l'exemple chiffré ci-dessus, à la place du texte actuel.

## Détails techniques

- Migration : ajout d'une colonne `sale_type` (`'new'` / `'reassort'`, défaut `'reassort'`) et `new_client_bonus` (numérique, défaut 0) sur `sales_commissions`. Aucune colonne supprimée ni renommée ; la table est vide, donc aucun backfill nécessaire.
- `supabase/functions/commercial-invoice/index.ts` : avant l'insertion de la commission, recherche d'une ligne antérieure pour le même couple (rep, client) ; si aucune ou si la plus ancienne est dans le mois courant → `sale_type = 'new'` et `new_client_bonus = 50` sur la première facture du client, sinon `'reassort'`. Le `commission_percent` stocké reste indicatif ; le calcul du dû est fait à l'affichage.
- `src/hooks/useCommercial.ts` : `aggregateMonthly` renvoie désormais `newClientRevenue`, `reassortRevenue`, `newClientCommission` (progressive), `reassortCommission` (10 % fixe), `bonusTotal`, `newClientCount` et `totalDue`. `computeProgressiveCommission` est conservé tel quel et n'est appliqué qu'au chiffre nouveaux clients. Le taux réassort vient du palier de base des `sales_commission_tiers` (10 %).
- `CommercialCommissionsPage.tsx` et `SalesRepsManager.tsx` consomment les nouveaux champs.
- `src/lib/proDocsPdf.ts` : chapitre 10 du guide réécrit.
- Vérifications : typecheck, génération du guide PDF et contrôle visuel du chapitre rémunération, puis contrôle des deux pages commissions dans le navigateur.
