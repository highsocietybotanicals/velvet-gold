

# Remplacer NUAGE300 par DEMI160

## Résumé

Supprimer le code promo `NUAGE300` (100g Nuage de Mousseux à 300€) et le remplacer par `DEMI160` : **50g de n'importe quel produit fleur/résine à 160€**, livraison gratuite, usage unique global.

## Changements

### 1. `src/components/CartDrawer.tsx` — Remplacer NUAGE300 par DEMI160

- Remplacer toutes les références `NUAGE300` par `DEMI160`
- Condition : le panier doit contenir exactement **50g** au total (tout produit confondu)
- Prix fixé à **160€** tout compris + livraison gratuite
- Même logique d'usage unique global (check `promo_code_usage` WHERE `code = 'DEMI160'` sans filtre user)
- Non cumulable avec BIENVENUE15
- Messages et labels adaptés

### 2. `supabase/functions/create-viva-payment/index.ts` — Validation serveur DEMI160

- Remplacer la validation serveur `NUAGE300` par `DEMI160`
- Vérifier que le poids total des items = 50g
- Vérifier usage unique global dans `promo_code_usage`
- Forcer `serverTotal = 160`, pas de frais de livraison
- Enregistrer dans `promo_code_usage` après validation

### Fichiers modifiés
- `src/components/CartDrawer.tsx`
- `supabase/functions/create-viva-payment/index.ts`

