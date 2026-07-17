## Problèmes identifiés

### 1. Prix qui ne changent pas partout (confirmé par lecture du code)

**Le catalogue et les cartes produit lisent le prix en dur depuis `src/data/products.ts`, pas depuis la base.**

- `src/pages/CataloguePage.tsx` ligne 5 : `import { flowers, resins, forceNoireProducts } from "@/data/products"`. Ligne 307 : affiche `{product.price}€/g` directement depuis le fichier statique. Le tri "prix croissant/décroissant" (lignes 58, 61, 93, 96) trie aussi sur ce prix statique. → Quand tu changes 12 → 14 € dans l'admin, le catalogue continue d'afficher 12 €.
- `ProductCard` récupère bien le prix DB via `useProducts().getPrice(product.id)` (ligne 131) — mais la Page Catalogue affiche le prix hors de `ProductCard`, donc l'override DB n'y passe pas.
- Les 6 produits **Force Noire / Nectar Divin** (`nuage-de-mousseux`, `911-og-indoor`, `blue-mango-indoor`, `haribo`, `heisenberg`, `poussiere-dor`) utilisent la grille en dur `FORCE_NOIRE_PRICE_GRID` dans `src/lib/pricing.ts` (lignes 67-104). `calculatePrice` retourne toujours la grille et ignore `basePrice` (ligne 187-198). → Changer leur prix dans l'admin n'a **aucun effet** sur les paniers, la page produit, ni le PDF Viva.
- `is_active = false` dans la base n'a aucun effet sur le catalogue (produits toujours listés depuis `data/products.ts`).
- `catalog-db-extras` est invalidé mais aucun hook ne fetch cette clé → dead code.

### 2. Admin Produits : Modifier / Désactiver / Supprimer

Lecture du code : les policies RLS sont correctes (`is_admin()` sur update/delete/insert), le trigger `validate_product_fields` demande juste `price > 0` et `name ≤ 200`, `ProductForm` fait bien un upsert. Le fait que ça "ne marche pas" en pratique n'est pas prouvé par la lecture seule — il faut reproduire.

**Étape de vérification en début de build** : lancer Playwright sur `/admin/produits` avec la session admin, cliquer "Modifier" sur un produit, "Désactiver" sur un autre, "Supprimer" sur un troisième, et capturer console + réseau. On corrige ensuite la cause exacte (toast d'erreur, échec RLS, dialog qui ne monte pas, invalidation manquante, etc.).

Cause probable pré-identifiée : `useAdminProducts.toggleProduct` invalide `["admin","products"]` et `["products-prices"]` mais **pas** `["admin","db-products"]` que lit `ProductsManager`. Idem pour `deleteProduct` (dans `useDbProducts`) qui n'invalide pas `["products-prices"]` ni `["admin","products"]`. Résultat : l'UI reste figée après action → sensation que "ça ne marche pas".

---

## Plan de correction

### A. Rendre le catalogue et toutes les surfaces prix pilotables depuis l'admin

1. **Créer un hook `useCatalogProducts()`** dans `src/hooks/useCatalogProducts.ts` qui :
   - part du tableau statique `products` de `src/data/products.ts` (source de vérité pour images/description/terpènes/mood),
   - fusionne ligne par ligne avec la table `products` de la base (`price`, `is_active`, `cbd_percentage`, `badge`, `subtitle`, `description`, `price_group`, `is_force_noire`, `display_order`),
   - filtre les `is_active = false`,
   - trie par `display_order`,
   - expose `flowers`, `resins`, `forceNoire`, `nectarDivin`, `all`.

2. **Utiliser ce hook partout** où le catalogue est affiché :
   - `src/pages/CataloguePage.tsx` (remplace les imports statiques, tri prix basé sur `dbPrice ?? product.price`).
   - `src/components/ProductSection.tsx`, `src/components/SommelierSection.tsx`, `src/pages/SommelierPage.tsx`, `src/pages/SampleSelectionPage.tsx`, `src/pages/ProductPage.tsx`, `src/components/admin/ManualOrderCreator.tsx`, `src/components/admin/SocialMediaManager.tsx`, `src/components/SommelierChatbot.tsx`.
   - `ProductCard` reste inchangé (déjà OK via `useProducts`), mais lira son prix effectif depuis le produit fusionné passé en prop.

3. **Rendre la grille Force Noire dynamique** (`src/lib/pricing.ts`) :
   - Garder la structure de grille mais recalculer les paliers 1 g / 2.5 g / 5 g / 10 g à partir du `basePrice` DB et d'un ratio propre à chaque produit (le ratio est déduit une seule fois de la grille actuelle : `ratio_10g = prix_10g / (basePrice × 10)`, etc.).
   - `calculatePrice(basePrice, weight, group, productId)` : si `productId` a une grille, appliquer `basePrice × weight × ratio_du_palier` au lieu du prix figé.
   - `create-viva-payment` (edge function) : porter la même logique côté serveur pour que le PDF/Viva ne recalcule pas des montants différents.

4. **Enlever l'invalidation morte** `catalog-db-extras` de `useDbProducts` et `ProductForm`.

### B. Réparer l'admin Produits

1. **Étape 1 (Playwright)** : reproduire les trois actions sur `/admin/produits`, capturer les erreurs console/réseau et une capture par action. C'est le premier commit du build.

2. **Étape 2 (correctifs basés sur le diagnostic)** — a minima, quel que soit le résultat du test :
   - Dans `useProducts.ts` `toggleProductMutation.onSuccess` et `updatePriceMutation.onSuccess` : invalider aussi `["admin","db-products"]`.
   - Dans `useDbProducts.ts` `deleteProduct.onSuccess` : invalider aussi `["products-prices"]` et `["admin","products"]`.
   - Dans `ProductForm.tsx` `handleSave` : idem, invalider `["admin","db-products"]`.
   - Ajouter un `toast` d'erreur explicite sur `toggleProductMutation` (déjà présent) et sur `deleteProduct` (déjà présent côté appelant).
   - Si le test révèle une autre cause (Dialog qui ne monte pas, RLS échec, session admin perdue), on corrige en plus.

3. **Étape 3 (validation)** : re-lancer Playwright sur les mêmes actions après correctifs, vérifier que :
   - Le prix modifié dans `/admin/prix` apparaît immédiatement dans `/admin/produits`, dans `/catalogue`, dans la page produit, dans le panier et dans le total Viva.
   - "Désactiver" un produit le retire du catalogue public.
   - "Supprimer" retire la ligne de la table admin et du catalogue public.
   - Un changement de prix Force Noire (ex. 911 OG passe de 15 à 20 €) se propage bien aux paliers 1/2.5/5/10 g avec le même ratio.

## Détails techniques

- Aucune migration nécessaire : la table `products` a déjà toutes les colonnes utiles (`price`, `is_active`, `display_order`, `price_group`, `is_force_noire`, `image_url`, `subtitle`, `badge`, `description`, `cbd_percentage`, `terpenes`, `intention_match`, `taste_match`, `mood`).
- Fallback : si la requête DB échoue (offline, erreur), on retombe sur `data/products.ts` pour ne pas casser le site public.
- Cache React Query : `staleTime: 60_000` sur `useCatalogProducts` pour éviter les re-fetch en boucle, `queryKey: ["catalog", "merged"]` invalidée par les mutations produit.
- Port de `calculateForceNoirePrice` dans `supabase/functions/create-viva-payment/index.ts` : fetch de `products.price` par `id` puis même formule de ratio.
