

# Generation d'Images Produits Professionnelles

## Objectif
Utiliser l'IA de generation d'images (Lovable AI) pour editer les 4 photos de fleurs que vous avez fournies et les transformer en images professionnelles avec un fond noir uniforme style "High Society Botanicals".

---

## Images a Transformer

| Produit | Etat Actuel | Transformation |
|---------|-------------|----------------|
| Blue Mango | Fond noir (OK) | Amelioration eclairage + style luxe |
| 911 OG | Fond noir (OK) | Amelioration eclairage + style luxe |
| Mint Kush | Fond BLANC | Remplacement fond noir + style luxe |
| Platinum OG | Fond BLANC | Remplacement fond noir + style luxe |

---

## Approche Technique

### Edge Function pour Edition d'Images

Creation d'une edge function `edit-product-image` qui :
1. Recoit l'image originale en base64
2. Envoie a l'API Lovable AI (modele `google/gemini-3-pro-image-preview` pour qualite maximale)
3. Prompt d'edition : "Transform this cannabis flower photo into a luxury product shot with a pure black background, professional studio lighting, golden highlights reflecting premium quality, sharp focus on the flower details. Keep the exact same flower, only change the background and lighting."
4. Retourne l'image editee

### Workflow

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Image Originale │ --> │  Lovable AI API  │ --> │  Image Editee   │
│  (votre photo)   │     │  gemini-3-pro    │     │  (fond noir)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## Implementation

### Etape 1 : Creer l'Edge Function

Fichier : `supabase/functions/edit-product-image/index.ts`

```typescript
// Recoit l'image, envoie a Lovable AI pour edition
// Prompt specifique pour fond noir + eclairage studio luxe
// Retourne l'image transformee en base64
```

### Etape 2 : Creer un Composant d'Edition Admin

Fichier : `src/components/admin/ImageEditor.tsx`

- Interface pour charger une image
- Bouton "Transformer en style HSB"
- Preview avant/apres
- Telechargement de l'image finale

### Etape 3 : Executer les Transformations

Pour chaque image :
1. Charger l'image originale
2. Appeler l'edge function avec le prompt d'edition
3. Sauvegarder l'image generee dans `src/assets/flowers/`
4. Mettre a jour les references dans `products.ts`

---

## Prompt d'Edition IA

```text
Transform this cannabis/CBD flower product photo into a premium luxury 
product shot. Requirements:
- Pure black background (#000000)
- Professional studio lighting with soft shadows
- Subtle golden/amber highlights reflecting premium quality
- Sharp focus on flower details and texture
- Keep the EXACT same flower - do not modify the product itself
- Style: High-end luxury cannabis boutique aesthetic
```

---

## Fichiers a Creer/Modifier

| Fichier | Action |
|---------|--------|
| `supabase/functions/edit-product-image/index.ts` | Nouvelle edge function |
| `src/components/admin/ImageEditor.tsx` | Nouveau composant admin |
| `src/assets/flowers/*-real.jpg` | 4 images a remplacer |
| `src/data/products.ts` | Supprimer `hasWhiteBg` apres transformation |

---

## Resultat Attendu

4 images produits avec :
- Fond noir uniforme
- Eclairage studio professionnel
- Reflets dores subtils
- Meme fleur exacte que vos photos originales
- Style coherent "High Society Botanicals"

