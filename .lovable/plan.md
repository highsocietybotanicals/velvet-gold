

# Fix Colissimo — Pas besoin de clé API séparée

## Diagnostic

Les options Prestashop/Shopify/WooCommerce sont des **plugins e-commerce**, pas des clés API. L'API REST Colissimo `generateLabel` fonctionne avec **uniquement** le numéro de contrat + mot de passe (que tu as déjà configurés).

Le vrai problème est que Deno corrompt le format `multipart/form-data`. La solution : envoyer le JSON directement en `application/json` au endpoint alternatif Colissimo qui l'accepte nativement.

## Solution

### Modifier `supabase/functions/generate-colissimo-label/index.ts`

1. **Changer l'URL** vers le endpoint JSON natif :
   `https://ws.colissimo.fr/sls-ws/SlsServiceWSRest/2.0/generateLabel`
   → Tester d'abord avec `Content-Type: application/json` directement (sans multipart)

2. **Si JSON direct échoue** (415), utiliser un **vrai FormData natif Deno avec Blob** :
   ```typescript
   const form = new FormData();
   form.append("generateLabelRequest", new Blob([jsonPayload], { type: "application/json" }), "request.json");
   // Pas de Content-Type header manuel — laisser fetch le générer
   const response = await fetch(COLISSIMO_API_URL, { method: "POST", body: form });
   ```
   La clé : laisser `fetch()` générer automatiquement le header `Content-Type` avec le boundary correct, au lieu de le construire manuellement.

3. **Supprimer** tout le code de construction manuelle du multipart (boundary, TextEncoder, etc.)

4. **Améliorer la gestion d'erreur** : logger le corps complet de la réponse en cas d'échec pour diagnostiquer rapidement

### Aucun secret supplémentaire nécessaire

`COLISSIMO_CONTRACT_NUMBER` et `COLISSIMO_PASSWORD` suffisent.

