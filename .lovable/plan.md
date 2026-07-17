
# Refonte du "Visuel IA" — Social Media Manager

## Objectif
Les visuels générés doivent ressembler **exactement** au vrai produit du site (couleur, texture, forme), avec 4 types de mise en scène et un personnage silhouette qui incarne la DA HSB.

## Ce qu'on change

### 1. Fidélité produit — l'IA "voit" la vraie photo
Aujourd'hui l'IA génère à partir d'un prompt texte uniquement → jamais fidèle.
On passe en **édition d'image** : l'URL de la photo produit du site est envoyée en référence visuelle à Gemini `nano-banana` en mode multimodal (image + texte). L'IA doit reproduire strictement la texture/couleur du produit fourni, et le placer dans la scène demandée.

Fallback : si le post n'est lié à aucun produit (post éducation, teasing, CTA), on garde le prompt texte seul.

### 2. Quatre types de scènes sélectionnables
Nouveau petit menu déroulant sur chaque post à côté du bouton "Visuel IA" :

- **Packshot studio** — produit seul, fond noir profond, rim light doré, poussière d'or (style actuel amélioré)
- **Dans les mains** — silhouette en costume noir présente le produit dans ses mains gantées/soignées, visage hors cadre ou dans l'ombre
- **En train de rouler / effriter** — geste artisanal, fleur effritée sur plateau de marbre noir, ou joint en cours de roulage, selon la catégorie
- **Lifestyle** — produit dans un décor luxe (velours noir, marbre veiné or, verre de cognac ambré, fauteuil chesterfield en clair-obscur)

Chaque scène a son propre bloc de prompt côté edge function, avec les mêmes garde-fous DA (palette noir/or/vert botanique, interdictions logos concurrents, etc.).

### 3. Personnage cohérent
Description figée réutilisée dans les scènes "mains" et "roulage" :
> Silhouette masculine élégante en costume trois-pièces noir sur mesure, chemise blanche, cravate soie noire, poignet avec chevalière or discrète et bracelet fin. Peau claire, mains soignées, ongles nets. **Visage jamais visible** — hors cadre, dans l'ombre ou coupé au niveau du menton. Ambiance clair-obscur, éclairage cinématographique chaud.

### 4. Trois variantes au choix
Au clic sur "Visuel IA", l'edge function appelle Gemini 3 fois en parallèle avec le même prompt (petites variations de composition/angle) et retourne les 3 images.
Un modal s'ouvre côté admin avec les 3 propositions côte-à-côte → tu cliques celle que tu veux garder → elle est uploadée dans le bucket `social-media` et remplace `image_url` du post. Les 2 autres sont jetées.

Bouton "Photo originale" (déjà en place) permet toujours de restaurer la photo du site si besoin.

## Détails techniques
- `supabase/functions/social-content/index.ts` — refonte de l'action `generate-image` :
  - Nouveau paramètre `sceneType: "packshot" | "hands" | "rolling" | "lifestyle"`
  - Si `product_id` présent → mode édition d'image (Gemini `google/gemini-3.1-flash-image` avec `image_url` de la photo produit dans les `messages`)
  - Prompts spécialisés par scène + description figée du personnage
  - Génération de 3 images en parallèle (`Promise.all`), upload de chacune dans `social-media/generated/{postId}-{variant}.png`, réponse `{ variants: [url1, url2, url3] }`
  - Nouveau paramètre `pickVariant` optionnel pour confirmer le choix final
- `src/components/admin/SocialMediaManager.tsx` :
  - Sélecteur de scène (4 options) à côté du bouton "Visuel IA"
  - Nouveau composant modal `<VariantPicker>` qui affiche les 3 images, clic = sélection
  - État local `variants: Record<postId, string[]>` et `pickerOpenFor: string | null`

## Ce qu'on ne touche pas
- La génération de séries (planification stratégique par l'IA) reste identique
- La publication Telegram reste identique
- La table `social_posts` : aucune migration nécessaire, on réutilise `image_url`
- Le bouton "Photo originale" continue de fonctionner
