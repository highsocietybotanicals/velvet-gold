

# Plan : Étiquettes produit 10x15 cm avec jsPDF

## Résumé

Ajouter un bouton "Étiquette 10×15" dans l'admin, par ligne produit d'une commande. Au clic, un PDF 100mm×150mm est généré client-side avec jsPDF, combinant :
- **Haut** : les images d'étiquette uploadées (devant marque avec cadre vintage, nom variété, description)
- **Bas** : le bloc légal pot-pourri trilingue + pictogrammes
- **Milieu** : grammage en gros

## Approche clé : utiliser les images uploadées directement

Les 8 images de référence (911 OG, Blue Mango, Nuage de Mousseux, Golden, Ice-O-Lator, Amnesia, Mint Kush, Platinum OG) et l'image légale seront copiées dans `src/assets/labels/` et utilisées comme images dans le PDF via `doc.addImage()`. Pas besoin de recréer le cadre vintage programmatiquement -- on utilise les vrais designs.

## Fichiers

### 1. Copier les assets (9 images)
- `src/assets/labels/911-og-label.png` (from user-uploads://1773092414184.png)
- `src/assets/labels/nuage-label.png` (from user-uploads://1773092636365.png)
- `src/assets/labels/blue-mango-label.png` (from user-uploads://1773092731734.png)
- `src/assets/labels/golden-label.png` (from user-uploads://1773092947110.png)
- `src/assets/labels/ice-o-lator-label.png` (from user-uploads://1773093024196.png)
- `src/assets/labels/amnesia-label.png` (from user-uploads://1773093253659.png)
- `src/assets/labels/mint-kush-label.png` (from user-uploads://1773093501496.png)
- `src/assets/labels/platinum-og-label.png` (from user-uploads://1773093638540.png)
- `src/assets/labels/legal-label.png` (from user-uploads://1774021876107.png)

### 2. `src/lib/labelPdf.ts` (NEW)
- Install `jspdf` dependency
- Map product IDs to their label images
- Function `generateProductLabel(productName, productDescription, weight, productId)`:
  - Create jsPDF doc `{ unit: 'mm', format: [100, 150], orientation: 'portrait' }`
  - **Top ~60%** : draw the product label image (cadre vintage + nom + description)
  - **Middle** : grammage bold (ex: "5g") in large font, centered
  - **Bottom ~35%** : draw the legal label image (mentions trilingues + pictogrammes)
  - Return blob URL or trigger download

### 3. `src/components/admin/MolecularLabel.tsx` (NEW)
- Button component receiving order item data (product_name, weight, product_id)
- Matches product_id against `allProducts` to find the correct label image
- On click: calls `generateProductLabel()` and opens PDF
- Icon: Tag or Printer, text "Étiquette 10×15"
- **Applies to ALL 8 products**, not just Force Noire

### 4. `src/pages/AdminPage.tsx` (EDIT)
- Import `MolecularLabel`
- In the order items column (lines 361-365), add the label button next to each product line
- The button appears for any product that has a matching label image

## Mapping produit → image étiquette

| Product ID | Label Image |
|---|---|
| `911-og-indoor` | 911-og-label.png |
| `blue-mango-indoor` | blue-mango-label.png |
| `nuage-de-mousseux` | nuage-label.png |
| `golden-cbn` | golden-label.png |
| `ice-o-lator` | ice-o-lator-label.png |
| `amnesia-signature-oniria` | amnesia-label.png |
| `mint-kush` | mint-kush-label.png |
| `platinum-og` | platinum-og-label.png |

## Détails techniques

- Les images uploadées sont utilisées telles quelles dans le PDF (haute qualité, design déjà finalisé)
- Le grammage est ajouté programmatiquement entre les deux images
- Format fixe 100×150mm, le contenu est redimensionné pour s'adapter sans déformation
- jsPDF supporte l'ajout d'images PNG en base64 via import Vite

