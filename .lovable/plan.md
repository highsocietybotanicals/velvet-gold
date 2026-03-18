

# Réactiver les cadeaux : Feuilles Slim RAW + Briquet BIC noir par tranche de 10g

## Ce qui change

Actuellement les cadeaux sont **désactivés** (`getGifts` retourne `null`). On va les réactiver avec un contenu simplifié :
- **1x Paquet de feuilles slim avec carton RAW**
- **1x Petit briquet BIC full noir**

Par tranche de 10g commandés. Affichage texte propre, sans photos.

## Modifications

### 1. `src/lib/pricing.ts` — Réactiver `getGifts`
- Supprimer le `return null` et le commentaire "DÉSACTIVÉ"
- Simplifier `GiftContents` : retirer `pochonMoyen` et `elastique`, garder `feuillesSlim` et `briquetHSB`
- Renommer les labels : "Feuilles Slim + Carton RAW" et "Briquet BIC Noir"
- Le label du pack devient ex: `1 Kit Cadeau` / `2 Kits Cadeaux`

### 2. `src/components/CartDrawer.tsx` — Affichage texte sans images
- Remplacer la grille avec images par une liste texte élégante avec icônes Lucide (Gift, Flame)
- Retirer les `<img>` pour pochon/feuilles/briquet/élastique
- Afficher proprement : `1x Feuilles Slim + Carton RAW — OFFERT` et `1x Briquet BIC Noir — OFFERT`

### 3. `src/pages/ProductPage.tsx` — Texte cadeau simplifié
- Mettre à jour la ligne de description des contenus pour ne mentionner que feuilles + briquet
- Garder le style actuel (texte sous le label du pack)

### 4. `supabase/functions/create-viva-payment/index.ts` — Ajouter les gifts aux order_items
- Vérifier si les cadeaux sont déjà envoyés comme `order_items` type `gift` lors de la création de commande, et les ajouter si ce n'est pas le cas

## Fichiers impactés
- `src/lib/pricing.ts`
- `src/components/CartDrawer.tsx`
- `src/pages/ProductPage.tsx`
- Potentiellement `supabase/functions/create-viva-payment/index.ts`

