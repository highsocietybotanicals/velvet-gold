# Nouvelles photos BHM / Lemon Punch Hash + vidéos produit

## Photos
- Remplacer les deux visuels actuels (jugés non représentatifs) par les deux images envoyées :
  - image 1 (bloc compact doré) → **BHM**
  - image 2 (bloc clair à la cassure poudreuse) → **Lemon Punch Hash**
- Les intégrer telles quelles, sans retouche, sans texte ajouté, recadrées en carré propre pour rester cohérentes avec les autres vignettes du catalogue.
- Remplacer aussi les visuels stockés côté back-office (images produit) pour que l'admin, l'espace pro et l'espace commercial affichent les mêmes.

## Vidéos
Vous m'envoyez les deux vraies vidéos dans le chat (une pour le BHM, une pour le Lemon). Je ne peux pas les récupérer des messages précédents, donc rien ne sera fait côté vidéo avant réception.

Une fois reçues :
- Ajouter un lecteur vidéo sur les fiches BHM et Lemon Punch Hash, à côté de la photo, lancé au clic, avec la photo en image d'attente.
- Ajouter un aperçu animé discret au survol de la vignette dans le catalogue (retour à la photo dès que la souris quitte la carte ; sur téléphone la photo reste fixe, pas de lecture automatique ni de son).
- Les vidéos seront muettes par défaut, en boucle pour l'aperçu, et servies depuis l'hébergement rapide du site pour ne pas alourdir les pages.
- Le système sera générique : une vidéo pourra ensuite être ajoutée à n'importe quelle variété, sans nouveau développement.

## Détails techniques
- Images et vidéos publiées via Lovable Assets (CDN), pas de binaire lourd dans le code ; mise à jour de `src/data/products.ts` et du bucket d'images produit.
- Champ vidéo optionnel ajouté au type `Product` ; `ProductPage.tsx` (lecteur) et `ProductCard.tsx` (aperçu au survol, chargement différé) adaptés.
- Aucun changement de prix, de stock ni de logique de commande.

## Vérifications
- Fiches et catalogue contrôlés sur ordinateur et téléphone : bonnes photos, lecture vidéo OK, aucune vignette cassée, pas de ralentissement.
