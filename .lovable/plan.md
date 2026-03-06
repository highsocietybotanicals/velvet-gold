

## Problème

Viva Wallet envoie une requête `GET` à ton URL webhook et attend en réponse une **clé de vérification** en texte brut. Actuellement (ligne 15-18 de `viva-webhook/index.ts`), la fonction retourne `{"success": true}` en JSON — Viva rejette ça.

**Mais** : la clé de vérification est générée par Viva **après** que l'URL est vérifiée. C'est un mécanisme challenge-response. Viva n'a pas besoin d'une clé pré-existante — selon la doc Viva, le endpoint doit simplement répondre au GET avec un **HTTP 200** et le corps doit contenir la **Verification Key** que Viva affiche dans le dashboard.

Or, en regardant ta capture, la clé n'est pas encore visible car le webhook n'a pas encore été sauvegardé avec succès.

## Solution

Le problème est probablement que Viva attend une réponse **texte brut** (pas JSON). On va :

### 1. Modifier `supabase/functions/viva-webhook/index.ts` (lignes 15-18)

Changer le handler GET pour retourner une réponse texte brut simple au lieu de JSON :

```typescript
if (req.method === "GET") {
  // Viva verification: return verification key if set, otherwise empty 200
  const verificationKey = Deno.env.get("VIVA_WEBHOOK_VERIFICATION_KEY");
  return new Response(verificationKey || "", {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
  });
}
```

### 2. Processus en 2 étapes

**Étape A** — D'abord déployer la fonction modifiée SANS clé. Viva pourrait accepter la vérification avec une réponse vide 200.

**Étape B** — Si Viva affiche une Verification Key dans le dashboard après la première tentative, on l'ajoutera comme secret `VIVA_WEBHOOK_VERIFICATION_KEY` puis on re-vérifiera.

### Résumé des changements
- **1 fichier modifié** : `supabase/functions/viva-webhook/index.ts` (lignes 15-18 uniquement)
- **1 secret potentiel** : `VIVA_WEBHOOK_VERIFICATION_KEY` (si nécessaire après le premier essai)

