Le PDF de la comptabilité liste les frais km sans info utile (juste "Livraison HSB-XXXXXX"). On va enrichir la donnée puis rendre un tableau dédié dans le PDF.

## Ce qui change

### 1. Chargement des données — `src/components/admin/AccountingManager.tsx`
- Élargir le `select` de `delivery_mileage` pour récupérer `arrival_address` et `departure_address` (déjà en table).
- Compléter le fetch "orders manquants" pour aussi ramener `guest_name`, `guest_email`, `user_id` afin de retrouver le nom du client de la livraison (même si la commande est hors période).
- Construire chaque `AccountingLine` mileage avec :
  - `client` = nom réel (guest_name / profile full_name / email) + N° commande
  - `details` = `depart → arrivée | X km × Y €/km`

### 2. Type — `src/lib/accountingPdf.ts`
- Ajouter des champs optionnels à `AccountingLine` : `departureAddress?`, `arrivalAddress?`, `distanceKm?`, `ratePerKm?`.

### 3. Rendu PDF — `src/lib/accountingPdf.ts`
Remplacer le tableau "Frais kilométriques" par un tableau dédié avec les colonnes suivantes (le tableau des factures reste inchangé) :

```text
N° | Date | Client | Départ | Arrivée | Km | €/km | Total TTC
```

- Autoriser le wrap texte pour Départ / Arrivée (colonnes plus larges, `cellWidth: 'auto'` + `overflow: 'linebreak'`).
- Départ affiché depuis `departureAddress` (fallback "15 rue des écoles, 44170 Abbaretz").
- Total du tableau + récap (nb livraisons, total TTC frais km) inchangés en bas.

### 4. Export CSV
- Ajouter les colonnes `depart;arrivee;km;taux` pour les lignes mileage (vides pour les factures).

## Détails techniques
- `arrival_address` existe déjà dans `delivery_mileage` (déjà sélectionné). Pas besoin de migration.
- `departure_address` est présent en table (schéma 14 colonnes) — à confirmer au moment du build via un `select` test si l'export TS le connaît ; sinon fallback constante.
- Aucun changement DB, aucun changement d'auth, uniquement affichage.

## Hors scope
- Pas de refonte des cartes de synthèse à l'écran.
- Pas de changement dans le calcul des km eux-mêmes.
