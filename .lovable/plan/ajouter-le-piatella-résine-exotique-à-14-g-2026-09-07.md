# Ajouter le Piatella — Résine Exotique à 14 €/g

## Résumé

Ajouter un nouveau produit « Piatella » au catalogue, classé dans la gamme **Exotique** (encadré violet shiny, comme Mango X Ice), catégorie **Résine**, prix public **14 €/g TTC**. La photo fournie par l'utilisateur sert d'image produit.

## Contexte technique

Le catalogue fusionne deux sources :
1. **Fichier statique** `src/data/products.ts` — images, terpènes, flags `isExotique`/`isNectarDivin`, mood, intentions. Les produits absents du fichier statique sont **ignorés** par `useCatalogProducts` (pas de visuel).
2. **Base de données** `products` — prix, stock, badge, actif, ordre d'affichage.

Les produits Exotique utilisent la grille de ratios `FORCE_NOIRE_RATIOS` dans `src/lib/pricing.ts` pour les remises par palier de poids (1 g, 2.5 g, 5 g, 10 g). Les prix pro sont stockés dans `pro_price_tiers` (un €/g HT par palier de volume).

## Étapes

### 1. Image produit
- Copier la photo fournie (`/mnt/user-uploads/...`) vers `src/assets/resins/piatella.jpg`
- Importer l'asset dans `src/data/products.ts`

### 2. Produit statique — `src/data/products.ts`
Ajouter dans le tableau `nectarDivin` (ou un nouveau tableau dédié) une entrée :
```
{
  id: "piatella",
  name: "Piatella",
  subtitle: "Résine Exotique",
  badge: "Exotique",
  description: "...",
  price: 14,
  priceGroup: "B",
  cbdPercentage: "...",
  image: piatellaImg,
  terpenes: { boise: ..., fruite: ..., epice: ..., terreux: ... },
  mood: "...",
  category: "resine",
  intentionMatch: [...],
  tasteMatch: [...],
  isExotique: true,
}
```
L'ajouter aux exports `allProducts`, `resins`, `forceNoireProducts` (déjà géré par le flag `isExotique` via `exotiqueFirst` et les filtres existants).

### 3. Grille de prix publique — `src/lib/pricing.ts`
Ajouter une entrée `FORCE_NOIRE_RATIOS["piatella"]` avec les mêmes ratios que Mango X Ice :
```
"piatella": { 1: 1.0, 2.5: 0.9333, 5: 0.8, 10: 0.6667 }
```

### 4. Libellé pro — `src/lib/margin.ts`
Ajouter `"piatella": "Piatella — Exotique"` dans `GAMME_LABEL`.

### 5. Base de données — table `products`
Insérer une ligne via `run_sql` :
```sql
INSERT INTO products (id, name, category, price, is_active, price_group, is_force_noire,
  subtitle, badge, description, cbd_percentage, mood, intention_match, taste_match,
  terpenes, display_order, is_out_of_stock)
VALUES ('piatella', 'Piatella', 'resine', 14, true, 'B', false,
  'Résine Exotique', 'Exotique', '...', '...', '...',
  ARRAY[...], ARRAY[...],
  '{"boise":...,"fruite":...,"epice":...,"terreux":...}'::jsonb,
  0, false)
ON CONFLICT (id) DO UPDATE SET ...;
```

### 6. Base de données — table `pro_price_tiers`
Prix pro HT = 50 % du prix public HT (14 / 1,2 / 2 = 5,83 €/g), avec dégressivité :
```sql
INSERT INTO pro_price_tiers (gamme, tier_max_g, price_per_gram) VALUES
  ('piatella', 99,     5.83),
  ('piatella', 249,    5.54),
  ('piatella', 499,    5.25),
  ('piatella', 999,    4.96),
  ('piatella', 999999, 4.67)
ON CONFLICT DO NOTHING;
```

### 7. Vérification
- Build TypeScript (`tsgo --noEmit`)
- Vérifier l'affichage sur le catalogue (encadré violet, badge Exotique, prix 14 €/g)
- Vérifier le panier (prix corrects par palier)
- Vérifier l'espace Pro (prix HT affiché)

## Détails produit (à confirmer)

| Champ | Valeur suggérée |
|---|---|
| Description | Résine ultra-premium de la gamme Exotique — texture fondante, arômes gourmands et puissants, effet enveloppant d'exception. |
| % CBD | 70 % Exotique (cohérent avec Mango X Ice) |
| Mood | Évasion gourmande |
| Intentions | detente, sommeil |
| Goûts | fruite |
| Terpènes | boise 50, fruite 85, epice 45, terreux 60 |
