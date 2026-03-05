

## Plan : Intégration Viva Wallet Smart Checkout

### Étape 1 — Stocker les secrets
Enregistrer dans Lovable Cloud via l'outil `add_secret` :
- `VIVA_MERCHANT_ID` = `00b96b79-8e40-4e1d-b3c3-27bab434ade1`
- `VIVA_API_KEY` = `0J3mD76AqjRebk352a82Hq1U7n4vTD`

### Étape 2 — Edge function `create-viva-payment`
Crée un ordre de paiement via l'API Viva Wallet (Basic Auth avec Merchant ID + API Key) :
- Reçoit le montant et les infos de commande du frontend
- Appelle `https://demo.vivapayments.com/api/orders` pour obtenir un `orderCode`
- Retourne l'`orderCode` au frontend
- Ajouter dans `supabase/config.toml` avec `verify_jwt = false`

### Étape 3 — Edge function `viva-webhook`
Reçoit les notifications de paiement de Viva :
- Vérifie la transaction via l'API Viva
- Met à jour le statut de la commande en base (`pending` → `preparing`)
- Ajouter dans `supabase/config.toml` avec `verify_jwt = false`

### Étape 4 — Ajouter colonnes à la table `orders`
Migration SQL pour ajouter :
- `viva_order_code` (text, nullable) — pour lier la commande au paiement Viva
- `payment_status` (text, default `'unpaid'`) — suivi du paiement

### Étape 5 — Pages frontend
- `src/pages/PaymentSuccessPage.tsx` — confirmation de paiement réussi, crée la commande en base
- `src/pages/PaymentFailurePage.tsx` — message d'échec avec bouton pour réessayer
- Ajouter les routes dans `App.tsx`

### Étape 6 — Bouton payer dans le panier
Modifier `CartDrawer.tsx` (lignes 512-518) :
- Remplacer le bouton désactivé par un bouton actif "Payer par carte"
- Au clic : appelle `create-viva-payment`, puis redirige vers `https://demo.vivapayments.com/web/checkout?ref={orderCode}`

### Fichiers créés/modifiés
- `supabase/functions/create-viva-payment/index.ts` (nouveau)
- `supabase/functions/viva-webhook/index.ts` (nouveau)
- `supabase/config.toml` (ajout des 2 fonctions)
- `src/pages/PaymentSuccessPage.tsx` (nouveau)
- `src/pages/PaymentFailurePage.tsx` (nouveau)
- `src/components/CartDrawer.tsx` (bouton payer)
- `src/App.tsx` (routes)
- Migration SQL (colonnes `viva_order_code`, `payment_status`)

### Note importante
On utilisera l'URL **demo** (`demo.vivapayments.com`) pour les tests. Le passage en production nécessitera simplement de changer l'URL vers `www.vivapayments.com`.

