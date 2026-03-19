

# Social Media Automation — Génération IA + Publication Instagram & Telegram

## Vue d'ensemble

Créer un système semi-automatique dans ton admin pour :
1. **Générer** des visuels "Dark Luxury" fidèles à ta marque via IA (Gemini image generation)
2. **Générer** des légendes/captions engageantes via IA texte
3. **Prévisualiser** le tout dans l'admin avant validation
4. **Publier automatiquement** sur Telegram via le connecteur disponible
5. **Préparer** Instagram (téléchargement direct car l'API Instagram nécessite un compte Meta Business)

## Architecture

```text
┌─────────────────────────────────┐
│        Admin Page (nouvelle tab)│
│  "Social Media"                 │
│                                 │
│  [Générer un post]              │
│    → Choix produit ou thème     │
│    → IA génère image + caption  │
│    → Prévisualisation           │
│  [Publier Telegram] [Download]  │
└──────────┬──────────────────────┘
           │
    ┌──────▼──────┐
    │ Edge Function│
    │ social-content│
    │              │
    │ 1. Génère image (Gemini)    │
    │ 2. Génère caption (Gemini)  │
    │ 3. Stocke dans storage      │
    │ 4. Publie Telegram si demandé│
    └─────────────┘
```

## Étapes d'implémentation

### 1. Connecter Telegram
Lier le connecteur Telegram au projet pour obtenir les clés API nécessaires à la publication automatique.

### 2. Créer un bucket de stockage `social-media`
Pour stocker les images générées par l'IA avant publication.

### 3. Créer une table `social_posts`
Colonnes : `id`, `product_id`, `image_url`, `caption`, `status` (draft/published), `published_to` (telegram/instagram), `created_at`, `published_at`. Accès admin uniquement via RLS.

### 4. Edge Function `social-content`
- **Mode "generate"** : Appelle Gemini image (`google/gemini-3.1-flash-image-preview`) avec un prompt détaillé intégrant l'identité visuelle HSB (fond noir profond, poussière d'or, éclairage studio doré, pas de texte sur l'image). Appelle Gemini texte pour générer une caption Instagram/Telegram avec hashtags. Stocke l'image dans le bucket et sauvegarde le post en draft.
- **Mode "publish-telegram"** : Envoie l'image + caption sur le canal Telegram via le connecteur gateway (`sendPhoto`).

### 5. Nouvelle section admin "Social Media"
- Bouton "Générer un post" → choix du produit ou thème libre
- Aperçu de l'image générée + caption éditable
- Bouton "Publier sur Telegram" → publication instantanée
- Bouton "Télécharger pour Instagram" → télécharge l'image au format carré (1080x1080)
- Historique des posts avec statut

### 6. Instagram — Approche réaliste
L'API Instagram Content Publishing nécessite un compte Meta Business + app Facebook approuvée. Pour l'instant, l'approche sera :
- Télécharger l'image optimisée pour Instagram (1080x1080)
- Caption copiée dans le presse-papier en un clic
- Possibilité future d'ajouter Zapier pour automatiser complètement

## Prompt IA pour les visuels (intégré dans l'edge function)

Le prompt sera calibré sur ton identité visuelle :
- Fond noir profond (#000000)
- Ambiance "haute joaillerie" avec poussière d'or flottante
- Éclairage studio avec contour doré (rim light)
- Texture velours/mat
- Pas de texte, pas de logo
- Produit CBD mis en valeur comme un bijou

## Fichiers créés/modifiés
- `supabase/functions/social-content/index.ts` — nouvelle edge function
- `src/components/admin/SocialMediaManager.tsx` — nouveau composant admin
- `src/pages/AdminPage.tsx` — ajout de l'onglet Social Media
- Migration : table `social_posts` + bucket storage

## Prérequis
- Connexion du connecteur Telegram (bot + chat_id du canal)
- LOVABLE_API_KEY déjà disponible pour Gemini

