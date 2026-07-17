
## Objectif

Créer un nouveau produit **Haribo** — résine, gamme **Nectar Divin** (plus puissante que l'Élixir Noir) — à **10 €/g TTC** (100 € les 10g), avec une carte produit au fond noir et particules dorées, à partir du fichier `HARIBO.mp4`.

## 1. Visuel produit

- Extraire une image fixe nette de `HARIBO.mp4` (frame ~2s, format portrait 464×832) via `ffmpeg`.
- Uploader l'image via `lovable-assets` → pointeur `src/assets/resins/haribo.jpg.asset.json`.
- Ne pas laisser le binaire dans le repo.

## 2. Nouvelle gamme "Nectar Divin"

Introduction d'un flag produit distinct de `is_force_noire` pour identifier la gamme ultra-premium.

- **Migration DB** : ajouter la colonne `is_nectar_divin BOOLEAN DEFAULT FALSE` sur `public.products`.
- Types Supabase régénérés après migration.
- Mise à jour de `src/data/products.ts` (interface `Product` + champ optionnel `isNectarDivin`).

## 3. Création du produit

Insertion via `supabase--insert` dans `public.products` :

| Champ | Valeur |
|---|---|
| id | `haribo` |
| name | `Haribo` |
| category | `resine` |
| subtitle | `Résine Nectar Divin` |
| badge | `Nectar Divin` |
| description | Résine ultra-premium, sommeil royal, arômes gourmands de bonbon fruité, puissance supérieure à l'Élixir Noir. |
| price | `10` (€/g TTC → 100€ les 10g) |
| price_group | `B` |
| cbd_percentage | `70% Nectar Divin` |
| image_url | URL CDN de la frame extraite |
| intention_match | `["sommeil","detente"]` |
| taste_match | `["fruite"]` |
| terpenes | `{ boise: 55, fruite: 90, epice: 40, terreux: 70 }` |
| mood | `Sommeil royal` |
| is_force_noire | `false` |
| is_nectar_divin | `true` |
| display_order | `0` (mis en tête) |
| is_active | `true` |

Aucune entrée dans `pro_prices` (pas de tarif Pro pour l'instant).

## 4. UI — Style Nectar Divin

Sur les composants qui affichent déjà un traitement "Force Noire" (`ProductCard`, `ProductPage`, `ProductSection`, chip/badge sur catalogue) :

- Détection : `product.isNectarDivin`.
- Traitement visuel : **fond noir profond** + overlay de **particules dorées** (réutilisation du composant existant `GoldParticles`) derrière l'image et sous les infos.
- Badge doré "Nectar Divin" avec icône (ex. `Sparkles` ou `Crown` de lucide-react) et texte or.
- Priorité d'affichage : si `isNectarDivin` → thème Nectar Divin ; sinon si `isForceNoire` → thème Force Noire ; sinon standard.
- Ajout dans les matrices `recommendationMatrix` / `resinRecommendationMatrix` : Haribo remplace la reco résine `sommeil / fruite` (actuellement Ice O Lator).

## 5. Sync catalogue

- `useDbProducts` retourne déjà `is_nectar_divin` après régénération des types.
- Le hook `useProducts` (fusion DB + statique) transmet le flag `isNectarDivin` aux composants.
- Rien à faire côté panier / pricing (le prix 10€/g est traité par la logique existante Groupe B).

## Fichiers modifiés / créés

- `supabase/migrations/…_add_nectar_divin.sql` — colonne `is_nectar_divin`.
- `supabase--insert` — INSERT du produit Haribo.
- `src/assets/resins/haribo.jpg.asset.json` — pointeur CDN.
- `src/data/products.ts` — interface + éventuel objet statique de secours.
- `src/hooks/useProducts.ts` — propagation du flag.
- `src/components/ProductCard.tsx` — thème Nectar Divin (fond noir + GoldParticles + badge).
- `src/pages/ProductPage.tsx` — même traitement sur la fiche détaillée.
- `src/components/ProductSection.tsx` — badge/coloration éventuelle.

## Détails techniques

- Extraction frame :  
  `ffmpeg -ss 2 -i /mnt/user-uploads/HARIBO.mp4 -frames:v 1 -q:v 2 /tmp/haribo.jpg`
- Format portrait 464×832 — sera affiché dans les cards en `object-cover` comme les autres visuels.
- `GoldParticles` (déjà existant, 30 particules dorées animées) sera positionné en `absolute inset-0 pointer-events-none` derrière l'image dans la carte Nectar Divin.
