

## Plan : Promo 1g offert basée sur le poids TOTAL du panier

### Problème actuel
Le seuil dans le panier est calculé avec `/12` (ligne 87 de CartContext.tsx) au lieu de `/10`. De plus, le sommelier ne précise pas que la promo s'applique sur le poids total combiné de tous les produits.

### Corrections

**1. `src/contexts/CartContext.tsx`**
- Changer `Math.floor(currentWeight / 12)` → `Math.floor(currentWeight / 10)` aux lignes 87 et 127
- Cela permet : 3 fleurs × 4g = 12g total → 1g offert

**2. `supabase/functions/sommelier-chat/index.ts`**
- Préciser dans l'OFFRE SPÉCIALE que c'est le poids **total** de la commande (tous produits confondus) qui compte, pas par produit individuel
- Ajouter un exemple concret : "3 fleurs différentes à 4g chacune = 12g total → 1g offert au choix"

### Fichiers modifiés
- `src/contexts/CartContext.tsx` — seuil 12 → 10
- `supabase/functions/sommelier-chat/index.ts` — clarifier promo sur poids total

