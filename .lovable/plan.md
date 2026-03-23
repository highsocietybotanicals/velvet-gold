

# Fix Colissimo — Envoyer du JSON directement (pas multipart)

## Diagnostic

Les logs montrent : `status: 415` (Unsupported Media Type) + réponse vide. L'API Colissimo rejette le format `multipart/form-data` envoyé par Deno.

En analysant des implémentations fonctionnelles (gem Ruby `colissimo_label`), l'API REST Colissimo accepte un simple **POST JSON** avec `Content-Type: application/json` — pas besoin de multipart du tout.

## Solution

### Modifier `supabase/functions/generate-colissimo-label/index.ts`

1. **Remplacer le FormData/Blob par un simple `fetch` avec JSON** :
   ```typescript
   const colissimoResponse = await fetch(COLISSIMO_API_URL, {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
     },
     body: jsonPayload,
   });
   ```

2. **Supprimer** le code FormData/Blob (lignes 276-288)

3. **Retirer le header `apiKey`** — l'authentification se fait via `contractNumber` + `password` dans le body JSON (déjà présent)

4. **Garder** tout le reste : parsing multipart de la réponse (Colissimo renvoie bien du multipart), gestion tracking, etc.

## Fichier modifié
- `supabase/functions/generate-colissimo-label/index.ts`

