

# Publication Automatique Instagram

## Contexte

Instagram utilise l'**Instagram Graph API** avec un modèle de publication en 3 étapes (création de container → attente → publication). Cela nécessite :
- Un **compte Instagram Business** relié à une **Page Facebook**
- Un **access token** avec les scopes `instagram_content_publish` et `instagram_basic`
- L'**Instagram User ID** du compte

Il n'y a pas de connecteur Instagram disponible dans Lovable, donc il faudra configurer manuellement les credentials.

## Prérequis utilisateur

1. Avoir un compte **Instagram Business** (pas personnel)
2. Le relier à une **Page Facebook**
3. Créer une **Meta App** sur [developers.facebook.com](https://developers.facebook.com)
4. Obtenir un **access token long-durée** avec les permissions `instagram_content_publish`, `instagram_basic`
5. Récupérer son **Instagram User ID** (via l'API `/me/accounts`)

## Changements techniques

### 1. Secrets à ajouter

- `INSTAGRAM_ACCESS_TOKEN` — token d'accès longue durée
- `INSTAGRAM_USER_ID` — ID du compte Instagram Business

### 2. Edge Function `social-content/index.ts` — Nouveau mode `publish-instagram`

Processus en 3 étapes via l'API Graph Instagram :

```text
Étape 1: POST /{user_id}/media → crée un container avec image_url + caption
Étape 2: GET /{container_id}?fields=status_code → attente "FINISHED"
Étape 3: POST /{user_id}/media_publish → publie le container
```

- L'image doit être accessible via URL publique (les images du site ou du bucket `social-media` le sont déjà)
- Met à jour le post en base avec `published_to: [..., "instagram"]`

### 3. Admin UI `SocialMediaManager.tsx` — Bouton "Instagram" par post

- Ajouter un bouton **"📸 Instagram"** à côté du bouton Telegram existant
- Même logique : spinner pendant la publication, mise à jour du statut après
- Le bouton remplace l'actuel bouton "Download Instagram" (qui télécharge juste l'image)

### 4. Publication par lot

- Ajouter un bouton **"Publier toute la série sur Instagram"** (comme pour Telegram)
- Publie les posts un par un avec un délai de 30s entre chaque (limite API Instagram)

## Fichiers modifiés

- `supabase/functions/social-content/index.ts` — ajout mode `publish-instagram` (3 étapes Graph API)
- `src/components/admin/SocialMediaManager.tsx` — bouton Instagram par post + publication par lot

## Limitation importante

Les **tokens Instagram expirent** (60 jours max pour les long-lived tokens). Il faudra les renouveler périodiquement. Je peux ajouter un mécanisme de refresh automatique si nécessaire.

