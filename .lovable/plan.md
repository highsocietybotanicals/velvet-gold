

# Livraison en point relais Colissimo (bureau de tabac, bureau de poste, etc.)

## Résumé

Ajouter une troisième option de livraison "Point Relais" au checkout. Le client entre son code postal, voit la liste des points relais Colissimo à proximité, en choisit un, et l'étiquette est générée avec le bon code produit (`A2P` pour relais Pickup / `BPR` pour bureau de poste).

## Changements

### 1. Edge function `colissimo-find-relay-points/index.ts` (nouveau)

- Appelle l'API Colissimo de recherche de points de retrait : `https://ws.colissimo.fr/pointretrait-ws-cxf/PointRetraitServiceWS/2.0/findRDVPointRetraitAchworking`
- Ou plus simple : utiliser l'API REST `https://ws.colissimo.fr/widget-point-retrait/rest/authenticate.rest` pour obtenir un token, puis chercher les points via le widget côté client
- Approche retenue : **API REST directe** `findRDVPointRetraitAchworking` avec le contractNumber/password
- Paramètres : code postal, type de point (tous), rayon
- Retourne la liste des points (nom, adresse, ID, horaires, type)

### 2. Migration — Colonnes sur `orders`

```sql
ALTER TABLE public.orders
  ADD COLUMN relay_point_id text,
  ADD COLUMN relay_point_name text,
  ADD COLUMN relay_point_address text;
```

### 3. `DeliverySection.tsx` — Troisième option "Point Relais"

- Nouveau type `"postal" | "personal" | "relay"`
- Bouton "Point Relais Colissimo" avec icône
- Quand sélectionné : champ code postal → bouton "Rechercher" → liste des points à proximité (nom, adresse, horaires)
- Le client clique sur un point pour le sélectionner
- Design noir/or cohérent

### 4. `CartDrawer.tsx` — Adapter le type de livraison

- Étendre le type delivery à 3 options
- Passer les infos du point relais (ID, nom, adresse) au PaymentButton
- Validation : vérifier qu'un point relais est sélectionné si mode relay
- Stocker relay_point_id/name/address dans la commande

### 5. `generate-colissimo-label/index.ts` — Code produit adapté

- Si `relay_point_id` présent sur la commande → utiliser `productCode: "A2P"` + `pickupLocationId: relay_point_id`
- Sinon → garder `productCode: "DOM"` (domicile)
- L'adresse du destinataire reste celle du client (Colissimo gère le routage vers le point relais)

### 6. `OrderSummaryPrint.tsx` — Afficher le point relais sur la facture

- Si commande avec point relais : afficher "Point Relais : [nom] — [adresse]"

## Fichiers créés/modifiés

- `supabase/functions/colissimo-find-relay-points/index.ts` — nouveau
- Migration SQL — colonnes relay_point sur orders
- `src/components/DeliverySection.tsx` — option relay + recherche + sélection
- `src/components/CartDrawer.tsx` — gestion du nouveau type
- `supabase/functions/generate-colissimo-label/index.ts` — productCode A2P
- `src/components/admin/OrderSummaryPrint.tsx` — affichage point relais

