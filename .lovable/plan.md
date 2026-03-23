

# Fix Colissimo — Ajouter la clé API

## Résumé

Tu as maintenant ta clé API Colissimo. Il faut la stocker en secret et l'ajouter dans le header `apiKey` de la requête vers l'API Colissimo, comme l'exige l'API REST v2.0.

## Changements

### 1. Stocker le secret `COLISSIMO_API_KEY`

Utiliser l'outil `add_secret` pour te demander de saisir ta clé API Colissimo.

### 2. Modifier `supabase/functions/generate-colissimo-label/index.ts`

- Récupérer `COLISSIMO_API_KEY` depuis `Deno.env.get()`
- Ajouter le header `apiKey` à la requête `fetch` vers Colissimo :
  ```typescript
  const colissimoResponse = await fetch(COLISSIMO_API_URL, {
    method: "POST",
    headers: { "apiKey": apiKey },
    body: form,
  });
  ```

### 3. Fix du parsing d'adresse (bonus)

La regex actuelle ne gère pas le format avec virgules (`44240, La Chapelle Sur Erdre`). Corriger pour supporter ce format : `(\d{5})[,\s]+([^,\n]+)`.

## Fichiers modifiés
- `supabase/functions/generate-colissimo-label/index.ts`

