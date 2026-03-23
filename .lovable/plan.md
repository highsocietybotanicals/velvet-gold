

# Masquer les infos sensibles (adresse perso + identifiants Colissimo)

## Problème

1. **Logs edge function** : `console.log("Label request payload:", jsonPayload)` affiche le numéro de contrat `322687` et le mot de passe en clair dans les logs
2. **Facture imprimée** (OrderSummaryPrint.tsx) : affiche "44390 Puceul — France" visible par le client
3. **DeliverySection.tsx** : mentionne "Puceul (44170)" pour la zone de livraison perso — c'est normal pour l'info de zone, mais on peut généraliser

## Changements

### 1. `supabase/functions/generate-colissimo-label/index.ts`
- **Supprimer le log du payload complet** (ligne 268) qui expose contractNumber + password
- Garder uniquement un log de l'orderId (sans données sensibles)

### 2. `src/components/admin/OrderSummaryPrint.tsx`
- Remplacer `44390 Puceul — France` par simplement `France` ou `highsocietybotanicals.com` dans le header de la facture

### 3. `src/components/DeliverySection.tsx`
- Remplacer "Puceul (44170)" par "notre entrepôt (Loire-Atlantique, 44)" — même info géographique sans l'adresse exacte

## Fichiers modifiés
- `supabase/functions/generate-colissimo-label/index.ts`
- `src/components/admin/OrderSummaryPrint.tsx`
- `src/components/DeliverySection.tsx`
- `src/pages/LivraisonRetoursPage.tsx` (même remplacement "Puceul" → zone générique)

