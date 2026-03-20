

# Génération d'Images IA — Fidèle à HSB avec Logo Officiel

## Résumé

Ajouter un mode `generate-image` à l'edge function `social-content` qui génère des visuels IA avec le logo HSB intégré et des contraintes strictes de marque. Les deux logos uploadés (photo 3D et vectoriel) seront copiés dans le projet et rendus disponibles pour l'IA.

## Changements

### 1. Copier les logos dans le projet

- `user-uploads://1766974737754_upscayl_10x_remacri-4x.png` → `public/images/logo-3d.png` (version photo relief doré)
- `user-uploads://unnamed_upscayl_15x_remacri-4x.png` → `public/images/logo-vector.png` (version vectorielle dorée)

Ces fichiers seront accessibles via URL publique pour l'IA et pour Telegram.

### 2. Edge Function `social-content/index.ts` — Nouveau mode `generate-image`

Ajouter une action `generate-image` qui :
- Reçoit les données produit (nom, catégorie, description, terpènes) + l'URL publique du logo vectoriel
- Appelle `google/gemini-3.1-flash-image-preview` avec un prompt ultra-contraint :

```text
CHARTE VISUELLE HSB — OBLIGATOIRE :
- Fond noir profond #000000, éclairage studio rim light doré
- Poussière d'or flottante subtile, texture velours/mat
- Style "Haute Joaillerie" (Rolex/Cartier)
- Palette EXCLUSIVE : noir, or (#C8A94E), vert botanique
- Le logo HSB (couronne + maison + ornements dorés) peut apparaître en filigrane doré discret
- Le produit doit ressembler fidèlement à une [fleur CBD / résine CBD]
- Nom exact du produit : [nom] — JAMAIS modifié ni inventé

INTERDICTIONS ABSOLUES :
- AUCUN logo autre que celui de High Society Botanicals
- AUCUNE marque concurrente, AUCUN texte inventé
- AUCUNE couleur hors palette (pas de rouge, bleu vif, rose, etc.)
- Ne jamais inventer une forme de produit irréaliste
```

- Upload l'image générée dans le bucket `social-media` (path `generated/{postId}.png`)
- Met à jour le `image_url` du post en base

### 3. Admin UI `SocialMediaManager.tsx` — Bouton par post

Sur chaque post de la série, ajouter :
- Bouton **"🎨 Générer visuel IA"** → appelle le mode `generate-image` avec les données produit
- Spinner pendant la génération
- Après génération : la nouvelle image remplace la preview
- Bouton **"↩️ Photo originale"** pour revenir à la vraie photo produit
- Le logo vectoriel (`/images/logo-vector.png`) est envoyé automatiquement comme URL à l'edge function

### 4. Bucket storage

Vérifier que le bucket `social-media` existe et est public (migration si nécessaire).

## Fichiers modifiés

- `public/images/logo-3d.png` — copie du logo 3D
- `public/images/logo-vector.png` — copie du logo vectoriel
- `supabase/functions/social-content/index.ts` — ajout mode `generate-image` avec charte HSB + logo autorisé
- `src/components/admin/SocialMediaManager.tsx` — boutons génération/restauration d'image par post

