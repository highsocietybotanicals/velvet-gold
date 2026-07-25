# Grille tarifaire pro révisée + Module Rentabilité

## 1. Nouvelle logique de prix pro (€/g fixe par palier volume)

Le prix pro ne dépend plus du format (1g/2.5g/5g/10g), seulement du **volume total commandé**. Un partenaire qui prend 300 g en pochons de 2.5g paie le même €/g que s'il les prenait en 10g.

**Grille appliquée (HT, remise sur PV TTC public) :**

| Gamme | ≤200g | >200g | >600g | >1kg |
|---|---|---|---|---|
| Classiques (Amnesia, Platinum OG, Mint Kush, Blue Mango, Ice O Lator, Golden CBN) | 4.00 €/g | 3.60 €/g | 3.20 €/g | 2.80 €/g |
| 911 OG | 4.50 €/g | 4.05 €/g | 3.60 €/g | 3.15 €/g |
| Poussière d'Or | 3.75 €/g | 3.40 €/g | 3.00 €/g | 2.65 €/g |
| Haribo & Heisenberg | 5.00 €/g | 4.50 €/g | 4.00 €/g | 3.50 €/g |

Ces valeurs correspondent au principe "partenaire paie 50 / 45 / 40 / 35 % du PV HT". Elles seront **éditables** dans l'admin donc ajustables ensuite.

## 2. Nouveau module "Rentabilité" (page admin dédiée)

Nouvelle entrée sidebar `/admin/rentabilite` avec 3 onglets :

**Onglet A — Coûts d'achat**
Tableau éditable de tes coûts unitaires :
- Coût matière €/g par produit (911 OG, Haribo, etc.)
- Consommables : pochon alu, Boveda 62%, étiquette, sachet expédition
- Cadeaux client : briquet BIC, feuilles slim + carton (par kit 10g)
- Frais fixes : Colissimo Domicile, Colissimo Relais, essence livraison locale (€/km), commission Viva (%)

**Onglet B — Simulateur libre**
Formulaire "Si je vends X g de [produit] au prix pro [palier]" → affiche schéma clair :
- Revenu HT / TTC
- Coût matière + consommables + cadeaux
- Marge brute €, marge %
- Graphique donut CA / coûts / bénéfice

**Onglet C — Marge par commande (auto)**
Chaque commande payée affiche sa marge réelle calculée automatiquement :
CA - (coût matière fleurs commandées + coût consommables + coût cadeaux offerts + frais port + commission Viva + km si livraison perso)

## 3. Intégration Comptabilité et Commandes

- Résumé marge mensuelle ajouté dans `/admin/accounting` (à côté du CA)
- Colonne "Marge €" et "Marge %" ajoutées dans la liste `/admin/orders`
- Export PDF/CSV comptable enrichi avec bloc rentabilité

## 4. Grille pro publiée (PDF partenaire régénéré)

Le PDF `HSB-Grille-Tarifaire-Pro-Preconditionne.pdf` est régénéré avec la nouvelle grille (€/g par palier, 4 formats pré-conditionnés 1g/2.5g/5g/10g) et livré dans `/mnt/documents/`.

---

## Détails techniques

**DB — nouvelles tables :**
- `product_costs` (product_id, cost_per_gram) — 1 ligne par produit
- `consumable_costs` (key, label, unit_cost) — pochon, Boveda, étiquette, briquet, feuille…
- `fixed_costs_settings` (id=1, colissimo_dom, colissimo_relais, essence_per_km, viva_commission_pct)
- `pro_price_tiers` (gamme, tier_max_g, price_per_gram) — remplace/complète `pro_prices`

Toutes en RLS admin-only + GRANT authenticated/service_role.

**Frontend :**
- `src/pages/admin/RentabilitePage.tsx` (nouvelle route)
- `src/components/admin/CostsManager.tsx` (onglet A)
- `src/components/admin/MarginSimulator.tsx` (onglet B, avec Recharts)
- `src/components/admin/OrderMarginTable.tsx` (onglet C)
- `src/lib/margin.ts` — helpers `computeOrderMargin(order, costs)`, `computeSimulation(...)`
- `src/hooks/useCosts.ts`, `useProPriceTiers.ts`
- Ajout item sidebar dans `AdminSidebar.tsx`

**Pricing engine :**
- Mise à jour `useProPrices` → sélection du tier selon poids total commandé
- `calculateProItemPrice` prend en compte le palier volume global du panier

**PDF partenaire :**
- Régénération via script Playwright/jsPDF avec la nouvelle grille et les 4 formats × 4 paliers par produit
