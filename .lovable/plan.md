# Stock visible dans l'espace commercial

Les commerciaux voient les quantités restantes par variété dans leur espace, pour savoir quoi vendre en priorité.

## Changements

**1. Accès en lecture au stock**
- Nouvelle règle d'accès : les commerciaux (et admins) peuvent **lire** le stock de chaque variété. Ils ne peuvent rien modifier — la saisie reste réservée à l'admin.

**2. Page Catalogue de l'espace commercial**
- Sur chaque carte produit, un badge de stock :
  - **"X g en stock"** (vert) si stock confortable
  - **"Stock faible — X g"** (orange) sous le seuil d'alerte
  - **"Rupture"** (rouge) à 0 g
- Les variétés en rupture sont visuellement estompées (mais restent visibles avec le badge Rupture).
- Un bandeau en haut de page "À vendre en priorité" liste les variétés dont le stock est le plus élevé (top 5 en grammes), pour orienter la prospection vers ce qui doit écouler.

**3. Pas de coûts internes**
- Seules les quantités (grammes) sont affichées : aucun coût d'achat ni donnée de rentabilité HSB, conformément aux règles de l'espace commercial.

## Détails techniques
- Migration : `CREATE POLICY "Commercials read inventory" ON public.product_inventory FOR SELECT TO authenticated USING (public.is_admin() OR public.is_commercial())` (+ GRANT SELECT déjà couvert par la politique admin existante — vérifier le GRANT authenticated en lecture).
- `CommercialCataloguePage.tsx` : nouveau hook léger `useCommercialStock` (lecture `product_inventory`), badges de stock, tri/section priorité, opacité réduite sur ruptures.
- Réutilise `stock_grams` et `low_stock_threshold_g` déjà en base, synchronisés automatiquement avec les commandes payées.
