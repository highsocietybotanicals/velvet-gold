

# Code Promo NUAGE300 — Usage unique global, 100g Nuage de Mousseux à 300€ + livraison gratuite

## Résumé

Code promo `NUAGE300` utilisable **une seule fois au total** (pas par compte, une seule utilisation globale). Après qu'un client l'utilise, plus personne ne peut s'en servir.

- Le panier doit contenir **100g de Nuage de Mousseux**
- Prix fixé à **300€** tout compris
- **Livraison gratuite**

## Modifications

### 1. `src/components/CartDrawer.tsx` — Validation client NUAGE300

- Reconnaître `NUAGE300` dans `handleApplyPromo`
- Vérifier que le panier contient `nuage-de-mousseux` avec weight = 100
- Vérifier l'usage global : query `promo_code_usage` WHERE `code = 'NUAGE300'` (sans filtre user_id) — si un résultat existe → erreur "Ce code a déjà été utilisé"
- L'utilisateur doit être connecté
- Calculer le % de réduction pour atteindre 300€, activer livraison gratuite
- Non cumulable avec BIENVENUE15

### 2. `supabase/functions/create-viva-payment/index.ts` — Validation serveur

- Vérifier côté serveur que `NUAGE300` n'a **jamais** été utilisé (check global dans `promo_code_usage`)
- Si valide : forcer `serverTotal = 300`, pas de frais de livraison
- Enregistrer dans `promo_code_usage` après paiement

### 3. `src/contexts/CartContext.tsx` — Flag `freeShipping`

- Ajouter `freeShipping: boolean` et `setFreeShipping` au contexte

## Fichiers impactés
- `src/components/CartDrawer.tsx`
- `supabase/functions/create-viva-payment/index.ts`
- `src/contexts/CartContext.tsx`

