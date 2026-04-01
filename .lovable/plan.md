

# Flyer A5 Recto-Verso — v5 mise à jour

## Modifications demandées

### Page Recto (présentation de marque)

**Livraison locale** — texte mis à jour :
- "Livraison GRATUITE à partir de 5g — Abbaretz et 20 km alentour"
- "En dessous de 5g : +5€ de frais de livraison"

**Arguments de marque** (section "Pourquoi nous choisir") :
1. **100% Indoor** — "Toutes nos fleurs sont cultivées en intérieur pour une qualité proche de la Cali"
2. **Génétiques Californiennes** — "Mint Kush et Platinum OG : variétés issues de génétiques de Californie"
3. **Gamme Élixir Noir** — "Grande puissance terpénique pour les collectionneurs et connaisseurs"
4. **Conservation Premium** — "Chaque pochon est livré avec un Boveda 62% pour une conservation optimale de vos fleurs"
5. **Qualité Certifiée** — "Analysé en laboratoire, THC < 0.3%"

### Page Verso (catalogue & prix)
Aucun changement — on garde les produits, grilles de remises, et promos.

## Réalisation technique

1. Script Python ReportLab — PDF A5 2 pages, fond noir, texte doré/blanc
2. Recto : logo HSB, slogan, 5 arguments ci-dessus, bandeau livraison, téléphone (bien voyant), site web
3. Verso : catalogue complet avec images, grilles de remises, cadeaux
4. Export PNG haute résolution (recto + verso) via `pdftoppm`
5. QA visuelle obligatoire sur chaque page

## Fichiers livrés
- `flyer_hsb_v5.pdf` — PDF 2 pages
- `flyer_hsb_v5_recto.png` — Image recto
- `flyer_hsb_v5_verso.png` — Image verso

