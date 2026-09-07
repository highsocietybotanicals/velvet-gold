# Codes-barres produits + bonus de palier commercial

Deux ajouts : un code-barres unique par variété **et** par poids (1 / 2,5 / 5 / 10 g) pour que le buraliste passe le produit en caisse sans rien saisir, et un système de bonus de commission par palier de chiffre d'affaires.

## 1. Codes-barres EAN-13 internes

- Format EAN-13 avec préfixe **200** (plage réservée aux usages internes des commerces) : `200` + numéro de variété (6 chiffres) + code format (`001` = 1 g, `025` = 2,5 g, `050` = 5 g, `100` = 10 g) + clé de contrôle calculée.
- Chaque variété reçoit un numéro fixe une fois pour toutes : le code d'une variété/poids ne change plus jamais, même si le prix ou le nom bouge.
- Les codes sont stockés en base, donc réimprimables à l'identique et exportables.

### Où on les voit

**a) Sur les étiquettes produit existantes**
Le code-barres est ajouté en bas de l'étiquette 10×15 cm, sous le poids, avec le numéro imprimé en clair dessous.

**b) Planche de codes à imprimer (nouveau)**
Un bouton « Planche codes-barres » dans l'espace commercial et dans l'admin génère un PDF A4 : une vignette par variété × poids (nom, poids, prix public conseillé TTC, code-barres). Filtres : toutes les variétés, une seule variété, ou seulement certains poids. Format compatible planches d'étiquettes autocollantes (grille régulière 3 colonnes).

**c) Fiche produit dans le catalogue commercial**
À côté de chaque poids, le numéro EAN affiché + copie en un clic, pour dictée au téléphone ou saisie dans la caisse du tabac.

## 2. Bonus de palier sur le CA

Paliers appliqués sur le **CA HT généré par le commercial sur le mois** :

| CA HT du mois | Taux |
|---|---|
| jusqu'à 5 000 € | 10 % |
| 5 000 € à 10 000 € | 12 % |
| au-delà de 10 000 € | 15 % |

- Le taux du palier s'applique à **tout le CA du mois** (pas seulement à la tranche dépassée) : c'est plus motivant et plus simple à expliquer.
- Page « Commissions » de l'espace commercial : récap mois par mois avec CA HT, palier atteint, commission de base, **bonus de palier**, total dû, et une barre de progression « encore X € pour passer à 12 % ».
- Admin > Commerciaux : le bonus apparaît dans le total à verser, avec un bouton pour marquer le mois comme payé. Les paliers restent modifiables (montants et taux) depuis l'admin.

## Détails techniques

- Migration : table `product_barcodes` (`product_id`, `weight_grams`, `ean13`, unique sur product+poids) + `products.barcode_seq` (entier unique attribué automatiquement) ; GRANT + RLS (lecture pour `authenticated`, écriture `is_admin()`). Table `sales_commission_tiers` (`min_revenue_ht`, `commission_percent`) initialisée à 0/10, 5000/12, 10000/15, lecture commercial + admin, écriture admin. Table `sales_bonus_payouts` (`rep_id`, `period_month`, `revenue_ht`, `tier_percent`, `bonus_amount`, `status`, `paid_at`).
- `src/lib/barcode.ts` : calcul de la clé EAN-13, rendu du code en canvas/dataURL (aucune dépendance ajoutée).
- `src/lib/labelPdf.ts` : ajout du code-barres sur l'étiquette existante ; nouveau `src/lib/barcodeSheetPdf.ts` pour la planche A4 (jsPDF, déjà présent).
- `src/hooks/useBarcodes.ts` : lecture + génération à la demande des codes manquants.
- `src/hooks/useCommercial.ts` : agrégation mensuelle du CA HT, résolution du palier, calcul bonus ; `CommercialCommissionsPage.tsx` et `SalesRepsManager.tsx` mis à jour ; ajout du bouton planche dans `CommercialCataloguePage.tsx` et `ProductsManager.tsx`.
