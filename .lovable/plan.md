# Espace Pro — marge 10 g réduite + gain affiché par format

## Objectif
1. Le 10 g rapporte plus à HSB : le coefficient minimum garanti au buraliste passe de x2 à **x1,7** uniquement sur le format 10 g (1 g, 2,5 g et 5 g restent à x2).
2. Sous le prix de chaque format (1 g / 2,5 g / 5 g / 10 g), afficher le **gain HT par pochon** pour le revendeur, juste sous le coefficient.

## Détail fonctionnel
- Le plancher de rentabilité reste calculé HT/HT (le tabac revend au même prix public que le site, TVA reversée déduite).
- Nouveau barème des coefficients minimums par format :
  - 1 g : x2
  - 2,5 g : x2
  - 5 g : x2
  - 10 g : x1,7
- Conséquence : sur le 10 g, le prix pro HT peut monter jusqu'à prix public HT / 1,7 (au lieu de /2), donc la remise dégressive volume est moins souvent plafonnée.
- Sous chaque format du catalogue pro : ligne « +XX,XX € / pochon » (prix public HT du format − prix d'achat HT du pochon).

## Technique
- `src/lib/proPricing.ts` : remplacer la constante unique `MIN_RESELLER_COEF` par une table `MIN_RESELLER_COEF_BY_FORMAT` ({1: 2, 2.5: 2, 5: 2, 10: 1.7}) avec repli à 2, et l'utiliser dans le plafonnement de `proPricePerGram`. Garder un export `MIN_RESELLER_COEF` (= 2) pour la compatibilité des textes existants.
- `src/pages/pro/ProCataloguePage.tsx` : sous le coefficient de chaque format, afficher le gain HT par pochon (`retail HT du format − ppg × format`). Ajuster le texte d'intro pour mentionner x2 sur 1/2,5/5 g et x1,7 sur 10 g.
- Aucun changement de base de données, la grille de paliers en base reste inchangée.
