# Molécules au catalogue, palette sans vert, contact commercial

## 1. Catalogue PDF pour les tabacs (nouvelle version)

- Afficher le nom de la molécule à côté de chaque variété, sur la fiche produit et dans la grille de prix :
  - Mango X Ice : HE+3 (12 %)
  - Piatella : CBDX
  - Blue Mango : 10-OH+
  - Nuage de Mousseux : MS
  - Les autres variétés gardent leur mention CBD classique.
- Supprimer entièrement le vert : passer sur un fond noir profond / anthracite avec l'or comme seule couleur d'accent, et papier ivoire pour les pages claires. Les liserés Exotique (violet) et Force Noire (bordeaux) restent, en touches discrètes.
- Ajouter en fin de catalogue un bloc contact commercial premium : nom du commercial, 06 35 45 04 90, adresse e-mail, site et QR code.
- Nouvelle version livrée en `HSB-Catalogue-Professionnel-2026-v2.pdf`, puis mise à jour du document téléchargeable depuis l'espace commercial.
- Contrôle visuel page par page avant livraison.

## 2. Site

- Afficher le nom de la molécule à côté de chaque variété dans le catalogue du site (liste et grille), en plus du badge sur la photo.
- Revoir l'habillage des badges molécule : cartouche noir avec filet et texte or, sans aucun vert, aligné sur les badges Exotique et Force Noire existants.
- Même traitement sur la fiche produit et dans le catalogue de l'espace commercial.

## Détails techniques

- Le générateur du catalogue (`/tmp/catalogue-hsb/generate.py`) est adapté : constantes `DEEP`/`EMERALD` remplacées par des tons noirs/anthracite, ajout d'un champ `molecule` par référence et d'une page/bloc contact final.
- Côté site, le champ `molecule` déjà présent dans `src/data/products.ts` est réutilisé ; retouche purement visuelle dans `ProductCard.tsx`, `CataloguePage.tsx`, `ProductPage.tsx` et `CommercialCataloguePage.tsx` avec les tokens existants (pas de couleur codée en dur hors accents de gamme).
- Aucune modification de prix, de logique panier ou de base de données.
