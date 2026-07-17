# 🎯 Intégration TikTok — Pack Complet

Objectif : connecter le compte TikTok de High Society Botanicals pour publier automatiquement depuis l'admin, suivre les stats et pousser chaque nouveau produit sur TikTok.

## Étape 0 — Connexion TikTok (à faire ensemble avant le code)

- Utilisation du **connecteur App TikTok** de Lovable (workspace-level, ton compte HSB — pas per-user).
- Passe par le **gateway Lovable** : pas de gestion manuelle de tokens, refresh OAuth automatique.
- Prérequis : compte **TikTok Business** (gratuit, conversion en 1 clic depuis TikTok mobile).
- ⚠️ Modération : garder le langage "botanique / art de vivre" comme sur Google. Aucune mention CBD/cannabis dans les captions auto.

## Étape 1 — Publication depuis SocialMediaManager

Extension de `src/components/admin/SocialMediaManager.tsx` :
- Nouveau bouton **"Publier sur TikTok"** à côté de Telegram, actif après génération du visuel IA.
- Sélecteur : mode **Photo** (carrousel avec les 3 variantes Packshot/Mains/Lifestyle) ou **Vidéo** (upload d'une vidéo depuis le disque).
- Champ caption pré-rempli avec le texte IA + hashtags (`#botanique #artdevivre #premium #madeinfrance ...`).
- Statut de publication (pending → published) affiché en temps réel.
- Historique persisté dans la table existante `social_posts` (ajout `tiktok_post_id`, `tiktok_status`).

Nouvelle edge function `supabase/functions/tiktok-publish/index.ts` :
- Appelle `POST /post/publish/video/init/` ou `/post/publish/content/init/` (photos) via gateway.
- Upload en chunks pour vidéos > 5 Mo.
- Retourne `publish_id` pour polling du statut.

## Étape 2 — Dashboard Stats TikTok

Nouvelle section dans `src/pages/admin/MarketingPage.tsx` : **"Performance TikTok"**.

Composant `src/components/admin/TikTokStatsManager.tsx` :
- **Header** : avatar, nom, followers, following, likes totaux (via `GET /user/info/`).
- **Grille de vidéos** : miniatures + vues / likes / commentaires / partages (via `POST /video/list/`).
- **Graphique** : évolution des vues sur 30 jours (Recharts, cohérent avec `StatsManager`).
- **Filtre** : période 7 / 30 / 90 jours, tri par vues/likes/date.
- Cache React Query 5 min (l'API TikTok a un rate limit strict).

Edge function `supabase/functions/tiktok-stats/index.ts` : agrège profil + vidéos + métriques en un seul appel côté client.

## Étape 3 — Auto-post à la création d'un produit

Dans `src/components/admin/ProductForm.tsx` :
- Checkbox **"📱 Publier automatiquement sur TikTok à la création"** (activée par défaut pour les nouveaux produits).
- Optionnel : caption personnalisée (sinon générée par IA via `social-content`).

Flow à la création :
1. Produit créé en DB.
2. Appel `social-content` → génère les 3 visuels IA (Packshot/Mains/Lifestyle).
3. Appel `tiktok-publish` → poste automatiquement en carrousel photo.
4. Toast admin : "Produit créé + publié sur TikTok ✨".

Le résultat est enregistré dans `social_posts` avec `trigger: 'auto_new_product'` pour l'historique.

## Détails techniques

**Connecteur**
- `connector_id: tiktok`, gateway-backed → `TIKTOK_API_KEY` + `LOVABLE_API_KEY` injectés.
- Base URL : `https://connector-gateway.lovable.dev/tiktok/`
- Headers : `Authorization: Bearer $LOVABLE_API_KEY` + `X-Connection-Api-Key: $TIKTOK_API_KEY`.

**Endpoints utilisés**
- `GET user/info/?fields=open_id,display_name,avatar_url,follower_count,following_count,likes_count,video_count`
- `POST video/list/` — liste vidéos + `video/query/` pour stats détaillées
- `POST post/publish/video/init/` — publier vidéo
- `POST post/publish/content/init/` — publier photos (carrousel)
- `POST post/publish/status/fetch/` — polling statut

**DB migration**
```sql
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS tiktok_post_id text,
  ADD COLUMN IF NOT EXISTS tiktok_status text,
  ADD COLUMN IF NOT EXISTS tiktok_publish_id text,
  ADD COLUMN IF NOT EXISTS trigger text DEFAULT 'manual';
```

**Sécurité**
- Toutes les edge functions vérifient `is_admin(auth.uid())` avant tout appel TikTok.
- Aucun token TikTok stocké côté client — tout passe par le gateway serveur.

## Ordre d'implémentation

1. Connecter le connecteur TikTok (approbation utilisateur requise).
2. Migration DB `social_posts`.
3. Edge functions `tiktok-publish` + `tiktok-stats`.
4. Bouton "Publier sur TikTok" dans `SocialMediaManager`.
5. Composant `TikTokStatsManager` + montage dans `MarketingPage`.
6. Checkbox auto-post dans `ProductForm` + hook `useAdminProducts`.
7. Tests bout-en-bout : profil, 1 post photo, 1 post vidéo, 1 création produit.

## Ce dont j'aurai besoin de toi

- **Approuver la connexion TikTok** quand la popup s'ouvre (te connecter avec ton compte TikTok Business HSB).
- Confirmer que le compte est bien en mode **Business** (sinon l'API publication est bloquée).
