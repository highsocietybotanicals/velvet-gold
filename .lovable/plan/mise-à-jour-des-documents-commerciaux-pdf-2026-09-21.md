# Mise à jour des documents commerciaux (PDF)

## Diagnostic (vérifié dans les PDF et la base)

Les 3 PDF statiques de `public/documents/` ne correspondent plus aux données actuelles :

- **Grille tarifaire pro** : liste 5 variétés retirées de la vente (Nuage de Mousseux, Haribo, Heisenberg, Poussière d'Or, 911 OG) ; aucune des 4 nouveautés (Mango X Ice, Piatella, BHM, Lemon Punch Hash) ; ancien barème « % du prix public » (-50/-55/-60/-65 % aux paliers 200 g / 600 g / 1 kg) qui ne correspond plus aux prix pro actuels (€/g HT fixe par variété + ristourne volume -5/-10/-15/-20 % dès 100/250/500 g/1 kg).
- **Catalogue pro** : contient Nuage de Mousseux (retiré) ; BHM et Lemon Punch Hash absents.
- **Guide commercial** : chapitre rémunération à l'ancien barème progressif (10/12/15 % par tranches) → conditions actuelles : 10 % sur toutes les ventes, 10 % sur les réassorts, 50 € par nouveau client pro ; dégressivité volume mentionnée (-10 % dès 250 g) décalée par rapport aux paliers réels.

## Solution : documents générés à la demande depuis les données réelles

Au lieu de PDF figés régénérés à la main, les documents seront **générés à la volée dans le navigateur** (jsPDF, comme le bon de commande existant) à partir des produits actifs et des paliers pro en base. Ils seront ainsi toujours à jour, à chaque téléchargement.

### 1. Nouveau générateur `src/lib/proDocsPdf.ts`

- `downloadProPriceGrid(products, tiers)` — **Grille tarifaire pro** A4 : page de garde sobre (noir/or, style existant), engagement (préconditionné, Boveda, kit cadeau), barème des paliers issu de `pro_price_tiers` (paliers et % réels), tableau des variétés **actives uniquement** avec €/g HT par palier, modalités (commande min 50 g, livraison, virement/CB, RIB via `bankDetails.ts`).
- `downloadProCatalogue(products, tiers)` — **Catalogue pro** A4 : page de garde, page marque, une fiche par variété active (visuel produit, gamme, description, prix pro HT par palier). Nuage de Mousseux et les autres variétés inactives n'y figurent plus.
- `downloadProGuide()` — **Guide commercial** mis à jour : chapitre rémunération réécrit (10 % ventes + 10 % réassorts + prime 50 € nouveau client, exemple de chiffres), dégressivité volume alignée sur les paliers réels, liste de produits actualisée. Le reste des 11 chapitres repris tel quel.

### 2. Page « Documents & pitch » du commercial

- `CommercialDocumentsPage.tsx` : les 3 cartes PDF statiques deviennent des boutons « Télécharger le PDF » qui génèrent le document à jour (produits + paliers déjà chargés via `useCatalogProducts` / `useProPriceTiers`). Le RIB reste un fichier statique.
- Pitch mail : mise à jour de la phrase tarifaire pour refléter les prix pro fixes + ristourne volume (au lieu de « moitié prix » / paliers 200 g).

### 3. Admin

- Mêmes boutons de génération ajoutés dans la page Pro de l'administration pour que tu puisses télécharger les mêmes documents à jour.

### 4. Nettoyage

- Suppression des 3 anciens PDF obsolètes de `public/documents/` (le RIB est conservé).

## Vérifications

- Typecheck `npx tsgo --noEmit -p tsconfig.app.json`.
- Génération des 3 PDF, conversion en images et contrôle visuel page par page (produits, prix, commissions, mise en page).
- Vérification que seules les 10 variétés actives apparaissent et que les prix correspondent aux paliers en base.

## Détails techniques

- jsPDF (déjà utilisé par `proFormsPdf.ts` / `labelPdf.ts`), images produits importées depuis `src/assets` / bucket selon disponibilité.
- Prix issus de `getProPricePerGram` (`src/lib/margin.ts`) — aucune donnée dupliquée.
- Aucune migration base de données nécessaire.
