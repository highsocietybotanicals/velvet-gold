# Vérification des fiches kilométriques mois par mois

## État réel (vérifié en base)

| Mois | Commandes livraison perso payées | Fiches km | Manquantes |
|---|---|---|---|
| 2026-03 | 1 | 1 | 0 |
| 2026-04 | 3 | 3 | 0 |
| 2026-05 | 6 | 5 | 1 |
| 2026-06 | 11 | 11 | 0 |
| 2026-07 | 13 | 5 | 8 |
| 2026-08 | 9 | 9 | 0 (mais 1 en « Échec ») |

Les commandes en livraison postale (2 au total) n'ont pas de fiche km, c'est normal.

## Détail des cas à traiter

- 8 commandes de juillet sans fiche (19, 21, 23 x2, 27 x2, 29 juillet) : adresse présente, calcul jamais lancé (période où la fonction était bloquée).
- 1 commande de juillet (HSB-528365, 17/07) et 1 de mai (HSB-622863, 23/05) : **aucune adresse de livraison enregistrée** — impossible à calculer automatiquement.
- 1 commande d'août (HSB-651775, 10/08) : fiche en « Échec », adresse non reconnue par le service de calcul d'itinéraire.

## Ce que je vais faire

1. Lancer le rattrapage sur les 8 commandes de juillet avec adresse, pour créer leurs fiches km automatiquement.
2. Relancer le calcul de la fiche d'août en échec ; si l'adresse reste non routable, la fiche restera modifiable à la main.
3. Rendre le rattrapage complet dans l'admin : le bouton « Calculer les commandes manquantes » de Logistique → Frais kilométriques prendra aussi en compte les fiches en statut « Échec » (aujourd'hui il ne traite que les commandes sans aucune fiche), et affichera un résumé des cas restants.
4. Pour les 2 commandes sans adresse : créer une fiche en saisie manuelle vide (arrivée « adresse non renseignée ») afin qu'elles apparaissent dans la liste et que tu puisses entrer les km au crayon, plutôt qu'elles disparaissent silencieusement de la compta.

## Détails techniques

- `MileageManager.tsx` : la sélection des commandes à rattraper inclura `delivery_mileage.status IN ('failed')` en plus des commandes sans ligne, avec un compteur OK / échec / à saisir manuellement.
- Aucun changement de schéma nécessaire ; le déclencheur automatique en base reste en place pour les futures commandes.
