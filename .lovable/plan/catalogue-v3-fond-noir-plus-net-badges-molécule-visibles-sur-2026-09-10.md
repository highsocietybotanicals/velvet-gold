# Catalogue v3 (fond noir, plus net) + badges molécule visibles sur le site

## 1. Le site : les badges molécule ne s'affichent nulle part

Cause confirmée : le champ `molecule` existe bien dans la définition des variétés, mais **aucune variété ne l'a réellement renseigné** (`src/data/products.ts` ne contient que la déclaration du champ, pas les valeurs). Les blocs d'affichage sont donc toujours vides.

Correction :
- Renseigner la molécule sur les quatre variétés : Mango X Ice `HE+`, Piatella `CBDX`, Blue Mango `10-OH+`, Nuage de Mousseux `MS`.
- Vérifier ensuite à l'écran que le cartouche noir et or apparaît bien sur la photo dans le catalogue, sur la fiche produit et dans le catalogue commercial.

## 2. Le catalogue PDF (nouvelle version v3)

- `HE+3` devient `HE+` partout.
- Page 2 : suppression de la grande image étirée en bandeau ; la page est remontée en bloc de texte + filets or, sans photo déformée.
- Fond noir sur **toutes** les pages (plus de pages ivoire) : textes ivoire/or, cartouches anthracite, filets or. Les photos produits ressortent alors sur noir avec un liseré or.
- Retirer le numéro de téléphone du pied de page de chaque page : pied de page réduit au nom de la marque, au site et au numéro de page. Le seul numéro affiché reste celui du contact commercial en dernière page.
- Netteté : photos préparées en haute résolution (largeur cible doublée), recadrage sans étirement, compression quasi sans perte, léger gain de contraste seulement.
- Mise au propre générale : marges homogènes, hiérarchie de titres plus calme, plus d'air entre les blocs, cartouches alignés, grille de prix lisible sur fond noir.
- Contrôle visuel page par page avant livraison, puis remplacement du document téléchargeable depuis l'espace commercial.

## Détails techniques

- `src/data/products.ts` : ajout des valeurs `molecule` sur les 4 références (aucun changement de prix ni de logique).
- `/tmp/catalogue-hsb/generate.py` : `bg()` forcé en mode sombre, `footer()` sans téléphone, `safe_img()` en résolution doublée et qualité 95, page 2 sans `image_cover`, palettes de texte inversées pour le fond noir, molécule `HE+`. Sortie `HSB-Catalogue-Professionnel-2026-v3.pdf` puis copie vers `public/documents/HSB-Catalogue-Pro-Tabac-VenteDirecte.pdf`.
- Aucune modification de base de données, de panier ou de tarif.
