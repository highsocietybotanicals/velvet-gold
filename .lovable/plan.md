

# Avis Clients — Soumission par les clients + modération admin

## Résumé

Permettre aux clients connectés de laisser un avis sur un produit qu'ils ont commandé (statut "delivered"). Les avis soumis sont en attente de validation par l'admin avant d'être visibles publiquement.

## Changements

### 1. Migration — Ajouter colonnes à `product_reviews`

```sql
ALTER TABLE public.product_reviews
  ADD COLUMN user_id uuid REFERENCES auth.users(id),
  ADD COLUMN status text NOT NULL DEFAULT 'approved',  -- les avis existants restent visibles
  ADD COLUMN order_id uuid;

-- Les nouveaux avis soumis par les clients auront status = 'pending'
-- Policy INSERT pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can submit reviews"
  ON public.product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Modifier la policy SELECT : seuls les avis 'approved' sont visibles publiquement
DROP POLICY "Anyone can read reviews" ON public.product_reviews;
CREATE POLICY "Anyone can read approved reviews"
  ON public.product_reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins can read all reviews"
  ON public.product_reviews FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Admin peut update (approuver/rejeter) et delete
CREATE POLICY "Admins can update reviews"
  ON public.product_reviews FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete reviews"
  ON public.product_reviews FOR DELETE TO authenticated USING (is_admin(auth.uid()));
```

### 2. `ProductReviews.tsx` — Formulaire de soumission

- Afficher le formulaire uniquement si l'utilisateur est connecté ET a une commande livrée contenant ce produit
- Champs : note (1-5 étoiles cliquables), commentaire (textarea)
- Le pseudo = `full_name` du profil ou email
- Après soumission : message "Votre avis est en attente de validation"
- Filtrer l'affichage pour ne montrer que les avis `approved`

### 3. `AdminPage.tsx` — Section modération des avis

- Nouvelle section/onglet "Avis en attente"
- Lister les avis avec `status = 'pending'` : pseudo, produit, note, commentaire
- Boutons : Approuver (→ `approved`) / Rejeter (→ supprimer ou `rejected`)

### 4. Vérification côté client

- Requête sur `orders` + `order_items` pour vérifier que le user a bien une commande livrée avec ce `product_id`
- Empêcher les avis multiples sur le même produit par le même user

## Fichiers modifiés/créés
- Migration SQL (colonnes + policies)
- `src/components/ProductReviews.tsx` — formulaire + logique
- `src/pages/AdminPage.tsx` — section modération
- `src/hooks/useAdmin.ts` — fetch des avis en attente

