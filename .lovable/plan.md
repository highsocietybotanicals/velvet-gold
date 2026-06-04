## Objectif

À chaque commande **payée** en mode **Livraison personnelle**, générer automatiquement une fiche de trajet (départ → client + distance routière A/R) consultable dans l'admin avec total mensuel et export CSV pour la comptabilité kilométrique.

> Note : la mémoire projet indique « Google Maps interdit ». Tu as explicitement demandé Google Maps Routes pour la précision : je lève cette contrainte uniquement pour ce calcul de distance back-office (non exposé côté client). Je mettrai à jour la mémoire en conséquence.

## Adresse de départ

`15 rue des écoles, 44170 Abbaretz` (constante en code, modifiable si besoin plus tard).

## Nouvelle table `delivery_mileage`

| Colonne | Type | Notes |
|---|---|---|
| id | uuid PK | |
| order_id | uuid unique | référence `orders.id` |
| departure_address | text | toujours l'adresse Abbaretz |
| arrival_address | text | adresse client (depuis `delivery_address`) |
| distance_km_one_way | numeric | calculé via Google Routes |
| distance_km_round_trip | numeric | × 2 |
| duration_min | numeric | indicatif |
| rate_per_km | numeric | snapshot du barème au moment du calcul |
| cost_euros | numeric | `round_trip × rate_per_km` |
| status | text | `computed` / `manual` / `failed` |
| computed_at | timestamptz | |
| created_at / updated_at | timestamptz | |

RLS : admin only (SELECT/INSERT/UPDATE/DELETE) + service_role full. GRANT appropriés.

## Nouvelle table `mileage_settings` (barème)

Une seule ligne (id = 1) : `rate_per_km numeric` (ex. 0.636 €/km — barème fiscal modifiable). Admin only.

## Trigger DB

Trigger `AFTER UPDATE` sur `orders` : quand `payment_status` passe à `paid` ET `delivery_type = 'personal'` ET aucune ligne `delivery_mileage` n'existe → insertion d'une ligne `status='pending'` puis appel HTTP (via `pg_net`) de l'edge function `compute-mileage`.

Alternative simple (retenue) : déclencher l'edge function directement depuis `verify-payment` et `viva-webhook` (fire-and-forget, comme l'email de confirmation), uniquement si `delivery_type = 'personal'`.

## Nouvelle edge function `compute-mileage`

Input : `{ orderId }`.
Étapes :
1. Charger la commande (service role), vérifier `delivery_type='personal'` et `payment_status='paid'`.
2. Lire `rate_per_km` depuis `mileage_settings`.
3. Appeler Google Routes API via le connecteur Google Maps Platform (gateway `routes/directions/v2:computeRoutes`) avec origine = adresse Abbaretz, destination = `orders.delivery_address`.
4. Stocker `distance_one_way`, `round_trip = ×2`, `duration`, `cost = round_trip × rate_per_km`, `status='computed'`.
5. En cas d'échec API : insérer la ligne avec `status='failed'` (admin pourra saisir manuellement).

Config : `verify_jwt = false`, appelée avec service role key.

## Connecteur Google Maps Platform

À lier via `standard_connectors--connect` (connector `google_maps`). Aucune clé manuelle à fournir : le gateway gère l'auth.

## UI Admin — nouvel onglet « Frais kilométriques »

Dans `AdminPage.tsx`, nouvel onglet contenant :
- **Bloc paramètres** : input `Barème €/km` (lecture/MAJ `mileage_settings`).
- **Filtre période** : mois courant par défaut, sélecteur de mois.
- **Tableau** : N° commande (HSB-…), date, client, adresse arrivée, km A/R, durée, €/km, coût €, statut (calculé / manuel / échec). Bouton « Recalculer » sur les lignes `failed`. Bouton « Saisir manuellement » pour éditer km.
- **Totaux en pied de tableau** : total km, total €, nombre de courses.
- **Bouton « Exporter CSV »** : génère un CSV (date, n° commande, départ, arrivée, km A/R, €/km, coût €) téléchargeable côté navigateur.

## Recalcul rétroactif

Bouton admin « Calculer les commandes perso payées sans fiche » → boucle sur les commandes perso payées sans entrée `delivery_mileage` et invoque `compute-mileage` pour chacune.

## Hors périmètre

- Pas d'affichage côté client.
- Pas de mise à jour automatique si l'adresse de la commande change après calcul (recalcul manuel possible).
- Pas de gestion multi-dépôts (un seul point de départ Abbaretz).
- Pas de génération PDF par fiche (CSV uniquement, comme demandé).
