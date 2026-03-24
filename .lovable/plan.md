

# Livraison en Point Relais Colissimo

## Résumé

Ajouter une option "Point Relais" au checkout. Le client entre son code postal, une liste de points relais Colissimo s'affiche, il en sélectionne un. L'étiquette Colissimo est générée avec le code produit `A2P` (relay) au lieu de `DOM` (domicile).

## Changements

### 1. Migration — Colonnes relay sur `orders`

```sql
ALTER TABLE public.orders
  ADD COLUMN relay_point_id text,
  ADD COLUMN relay_point_name text,
  ADD COLUMN relay_point_address text;
```

### 2. Edge function `colissimo-find-relay-points/index.ts` (nouveau)

- Reçoit `{ postalCode }` en body
- Appelle l'API Colissimo Point Retrait : `https://ws.colissimo.fr/pointretrait-ws-cxf/PointRetraitServiceWSRest/2.0/findRDVPointRetraitAchworking` avec le `accountNumber` (COLISSIMO_CONTRACT_NUMBER) et le code postal
- Retourne la liste des points (identifiant, nom, adresse, horaires, type)
- CORS + validation du code postal (5 chiffres)

### 3. `DeliverySection.tsx` — Option "Point Relais"

- Étendre le type `deliveryType` à `"postal" | "personal" | "relay"`
- Nouveau bouton radio "Point Relais Colissimo" avec icône MapPin
- Quand sélectionné : champ code postal + bouton "Rechercher"
- Liste des résultats cliquables (nom, adresse, type de point)
- Point sélectionné affiché en surbrillance
- Nouvelles props : `relayPointId`, `relayPointName`, `relayPointAddress` remontées au parent

### 4. `CartDrawer.tsx` — Prise en charge du type relay

- État pour `relayPointId`, `relayPointName`, `relayPointAddress`
- Passer ces infos au `PaymentButton`
- Dans le body envoyé à `create-viva-payment` : ajouter `relayPointId`, `relayPointName`, `relayPointAddress`
- Validation : un point relais doit être sélectionné si `deliveryType === "relay"`

### 5. `create-viva-payment/index.ts` — Stocker les infos relay

- Lire les champs `relayPointId`, `relayPointName`, `relayPointAddress` du body
- Les insérer dans la commande lors de la création

### 6. `generate-colissimo-label/index.ts` — Code produit A2P

- Si `order.relay_point_id` est présent :
  - `productCode: "A2P"` au lieu de `"DOM"`
  - Ajouter `pickupLocationId: order.relay_point_id` dans le service
- Sinon : comportement actuel inchangé (`DOM`)

### 7. `OrderSummaryPrint.tsx` — Afficher le point relais

- Si la commande a un `relay_point_name` : afficher "Point Relais : [nom] — [adresse]" dans la facture

## Fichiers créés/modifiés

- Migration SQL (3 colonnes sur orders)
- `supabase/functions/colissimo-find-relay-points/index.ts` — nouveau
- `supabase/config.toml` — ajouter config pour la nouvelle function
- `src/components/DeliverySection.tsx`
- `src/components/CartDrawer.tsx`
- `supabase/functions/create-viva-payment/index.ts`
- `supabase/functions/generate-colissimo-label/index.ts`
- `src/components/admin/OrderSummaryPrint.tsx`

