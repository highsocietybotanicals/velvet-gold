# Importer les étiquettes imprimables depuis l'administration

## Objectif
Pouvoir déposer soi-même l'étiquette imprimable de chaque variété dans l'administration, sans passer par un développement à chaque nouveau produit.

## Ce que vous pourrez faire
- Dans **Catalogue produits**, une nouvelle colonne **Étiquette** pour chaque variété :
  - « Importer une étiquette » (image PNG/JPEG, ou PDF déjà prêt)
  - aperçu miniature de l'étiquette importée
  - remplacement par un nouveau fichier
  - suppression
- L'étiquette importée est utilisée immédiatement par le bouton **Étiquette 10×15** des commandes (poids et code-barres ajoutés automatiquement comme aujourd'hui).
- Les variétés sans étiquette importée continuent d'utiliser l'étiquette d'origine déjà intégrée ; celles qui n'en ont aucune n'affichent simplement pas le bouton d'impression.
- Une petite indication dans la liste : « étiquette importée », « étiquette d'origine » ou « aucune étiquette ».

## Contrôles
- Formats acceptés : PNG, JPEG, PDF. Taille max 10 Mo.
- Recommandation affichée sous le bouton : visuel vertical au format 10 × 15 cm, noir et blanc fortement contrasté pour l'imprimante thermique.
- Import réservé aux administrateurs.

## Détails techniques
- Nouveau bucket public `product-labels` + colonne `products.label_image_path` (chemin du fichier) via migration, avec règles d'accès : lecture publique, écriture/suppression réservées à `is_admin()`.
- Hook `useProductLabels` (upsert du chemin, suppression du fichier, invalidation des requêtes produits).
- `src/lib/labelPdf.ts` : `resolveLabelSource(productId)` → étiquette importée (URL publique) si présente, sinon `LABEL_MAP` intégré. `generateProductLabel` accepte une source d'image ou un PDF direct :
  - image → même composition actuelle (visuel + poids + EAN-13) ;
  - PDF → téléchargement direct du fichier fourni, sans recomposition.
- `MolecularLabel` interroge la liste des étiquettes disponibles (importées + intégrées) au lieu de la constante figée `SUPPORTED_LABEL_IDS`.
- `ProductsManager` : colonne Étiquette (input fichier caché, aperçu, suppression, état de chargement), même style que la colonne Analyse labo existante.

## Vérifications
- Import d'une image sur un produit, impression de l'étiquette 10×15 depuis une commande, contrôle du PDF obtenu.
- Import d'un PDF : le fichier s'ouvre tel quel.
- Suppression : retour à l'étiquette d'origine quand elle existe.
- Contrôle sur ordinateur et téléphone, compilation propre.
