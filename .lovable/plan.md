

# Social Media IA Stratégique — Publication Millimétrée

## Problème actuel

L'IA génère des images artificielles via Gemini au lieu d'utiliser les **vraies photos produits** du site. Les posts sont générés un par un, sans stratégie ni cohérence éditoriale.

## Vision

Transformer l'IA en véritable **Directrice de Communication** de HSB qui :
- Utilise exclusivement les **vraies photos produits** du site (jamais de génération d'images)
- Planifie des **séries de publications stratégiques** (pas des posts isolés)
- Parle avec une voix de marque constante, comme si c'était **sa propre entreprise**
- Alterne intelligemment entre types de contenu (produit, éducation, lifestyle, teasing)

## Architecture de la stratégie

```text
┌─────────────────────────────────────────────┐
│  STRATÉGIE DE PUBLICATION                   │
│                                             │
│  Série = 5-7 posts cohérents               │
│  ├── Post 1: Teasing mystérieux            │
│  ├── Post 2: Mise en lumière produit       │
│  ├── Post 3: Éducation (terpènes, CBD)     │
│  ├── Post 4: Lifestyle / ambiance          │
│  ├── Post 5: Produit complémentaire        │
│  ├── Post 6: Témoignage / conseil          │
│  └── Post 7: Call-to-action                │
│                                             │
│  Chaque post a son image RÉELLE du site    │
│  + légende stratégique IA                  │
└─────────────────────────────────────────────┘
```

## Changements techniques

### 1. Edge Function `social-content` — Refonte complète

**Suppression de la génération d'images IA.** L'IA ne génère plus que les légendes/captions.

Nouveau mode `generate-series` :
- L'IA reçoit le catalogue complet (noms, descriptions, catégories, terpènes, mood)
- Elle planifie une série de 5-7 posts avec un arc narratif
- Chaque post est associé à un produit réel et son image existante
- Les images sont les URLs publiques des assets du site (via le frontend qui les transmet)

Nouveau prompt système "Directrice de Communication HSB" :
- Personnalité : passionnée, stratège, luxe discret
- Ton : « L'empire HSB doit exploser. Chaque post est une brique de notre légende. »
- Logique de séquence : teasing → reveal → éducation → lifestyle → CTA
- Ne jamais mentionner de prix, toujours créer du désir et du mystère
- Hashtags calibrés et cohérents sur toute la série

### 2. Table `social_posts` — Ajout de colonnes

- `series_id` (uuid) — regroupe les posts d'une même série
- `series_position` (integer) — ordre dans la série
- `post_type` (text) — teasing / product / education / lifestyle / cta

### 3. Admin UI — Refonte `SocialMediaManager.tsx`

- **Nouveau bouton "Planifier une série"** : choisir un thème ou laisser l'IA décider
- L'IA propose la série entière avec les images réelles associées
- Prévisualisation de toute la série sous forme de timeline
- Publication individuelle ou par lot sur Telegram
- Chaque légende reste éditable
- Les images produits sont servies depuis les assets du site (pas de génération)

### 4. Mapping produit → image publique

Le frontend envoie à l'edge function les données produit incluant l'URL publique de chaque image. L'edge function utilise ces URLs directement lors de la publication Telegram (au lieu de générer des images).

## Fichiers modifiés

- `supabase/functions/social-content/index.ts` — refonte du prompt et de la logique (génération de séries, plus de génération d'image)
- `src/components/admin/SocialMediaManager.tsx` — UI séries, timeline, images réelles
- Migration SQL : ajout `series_id`, `series_position`, `post_type` à `social_posts`

## Résultat attendu

L'admin clique "Planifier une série" → l'IA analyse le catalogue → propose 5-7 posts ordonnés avec les vraies photos et des légendes stratégiques → l'admin valide/modifie → publie sur Telegram un par un ou en lot.

