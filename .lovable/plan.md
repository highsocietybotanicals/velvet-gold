## Objectif
Le rendu actuel de Haribo est une résine ambrée sombre imaginée — trop loin du vrai produit. On repart d'une frame réelle de `HARIBO.mp4` pour garder la couleur (jaune pâle doré, texture friable/cristalline type rosin) et le format (bloc rectangulaire), puis on la restyle en studio noir avec particules dorées pour rester dans la DA du site.

## Étapes

1. **Choix de la frame source**
   - Utiliser `f_25.jpg` (macro nette du bloc, couleur jaune-doré authentique, texture cristalline visible). Frame alternative: `f_15.jpg` si on préfère montrer une découpe en deux blocs.

2. **Édition via `imagegen--edit_image` (Nano Banana 2, pro-level)**
   - Input: la frame réelle extraite.
   - Prompt: garder la couleur/matière/texture exactes du bloc (jaune pâle doré, surface cristalline granuleuse, éclats blancs), retirer les mains/outils/watermark, recadrer le bloc au centre, remplacer le fond par un fond noir profond studio type haute joaillerie, ajouter un éclairage chiaroscuro doux avec reflets dorés subtils sur les arêtes, particules/poussière d'or fines en suspension autour, style photo produit cohérent avec Ice O Lator / Golden CBN / Elixir Noir.
   - Output: `src/assets/resins/haribo-premium.jpg` (écrase l'actuel, 1024×1024).

3. **Aucun autre changement**
   - Le prix (15/35/60/100) et l'import restent tels quels.
   - Pas de modif DB, ni du code produit.

## Détails techniques
- Fichier réécrit: `src/assets/resins/haribo-premium.jpg` via `imagegen--edit_image` avec `image_paths: ["/tmp/haribo/f_25.jpg"]`.
- Modèle: tier `premium` (meilleure fidélité photo + gestion des textures fines).
- Après génération je vérifie visuellement le rendu avant de conclure.
