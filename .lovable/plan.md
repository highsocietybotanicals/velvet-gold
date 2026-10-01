# Quantité écoulée par mois dans les statistiques

## Ce que tu verras
Page Statistiques de l'admin, dans le tableau de l'historique mensuel : une nouvelle colonne **« Quantité écoulée »** à côté du CA, en grammes (ex. « 245,5 g »). Elle figure aussi :
- dans l'info-bulle du graphique des mois ;
- en total sur les 12 mois ;
- dans l'export CSV.

## Ce qui est compté
- Les grammes vendus sur les commandes **payées et non annulées** du mois (site, commandes manuelles, commandes pro), c'est-à-dire les mêmes commandes que celles du CA.
- Les grammes des dépôts-vente pro facturés dans le mois, s'ils sont renseignés.
- Les accessoires ne sont pas comptés.

## Détails techniques
- `StatsManager.tsx` : ajout de `grams` dans `monthly`, calculé avec la somme de `total_flower_weight` des commandes du mois.
- Ajout de `pro_deposits` (`weight_grams × quantity`, `invoice_id` non nul, regroupés par mois de la facture liée) dans les données chargées.
- Ajout de la colonne au tableau et au CSV, et d'un total sur 12 mois.
