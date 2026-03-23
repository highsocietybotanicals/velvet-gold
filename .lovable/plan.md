

# Avis Clients — Section sur chaque page produit

## Résumé

Créer une table `product_reviews` en base, pré-remplir 5-10 avis par produit avec un ton jeune/street authentique, et afficher une section "Avis Clients" sur chaque page produit avec note étoiles + commentaire.

## Changements

### 1. Migration — Table `product_reviews`

```sql
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  author_name text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les avis
CREATE POLICY "Anyone can read reviews"
  ON public.product_reviews FOR SELECT
  USING (true);
```

Puis insérer ~8 avis par produit (8 produits = ~64 avis au total) avec des pseudos et commentaires style jeune/street :
- Pseudos : "Kev75", "LaTouffe", "ZenMaster420", "JulCBD", "DjibZ", etc.
- Ton : fautes naturelles, abréviations, argot, mais toujours positif et descriptif
- Notes : entre 4 et 5 étoiles
- Exemples :
  - *"franchemen jlai gouter hier soir et wallah jdormais comme un bebe, la golden cbn c du lourd frr"* — ZenMaster420, 5★
  - *"le gout menthe c ouf, trop frais, jen reprend direct"* — KushKing44, 5★
  - *"premiere commande ici et vrmt pas decu, la 911 elle claque bien le soir"* — TiboFume, 4★

### 2. Composant `ProductReviews.tsx`

- Affiche les avis depuis la base pour le `product_id` courant
- Note moyenne + nombre d'avis en haut
- Étoiles dorées (style luxe du site)
- Liste des avis avec pseudo, date relative, étoiles, commentaire
- Design noir/or cohérent avec le thème

### 3. `ProductPage.tsx` — Intégrer la section

- Ajouter `<ProductReviews productId={product.id} />` après la section produit, avant les produits similaires

### 4. Page d'accueil (optionnel)

- Afficher la note moyenne sur les cartes produit dans `ProductCard.tsx` (petit badge étoiles)

## Fichiers créés/modifiés

- **Migration SQL** — table + seed ~64 avis
- `src/components/ProductReviews.tsx` — nouveau composant
- `src/pages/ProductPage.tsx` — intégration de la section avis
- `src/components/ProductCard.tsx` — badge note moyenne (optionnel)

