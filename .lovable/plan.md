# Refonte cinématique de l’accueil et performance du catalogue

## Résultat attendu
- Remplacer l’ouverture actuelle par une expérience en quatre actes, pilotée par le défilement, fidèle au noir mat, à l’or métallique et aux médias réels de la marque.
- Conserver une ouverture statique, lisible et élégante lorsque les animations sont réduites.
- Alléger les cartes du catalogue sans modifier les fiches produit, le panier, les prix ni les espaces réservés.
- Accélérer l’apparition des cartes et optimiser les photos en WebP adaptatif.

## Mise en œuvre
1. Créer `CinematicHero` et son canvas unique de trichomes :
   - séquence sticky desktop d’environ 400vh et mobile d’environ 250vh ;
   - quatre actes synchronisés au défilement ;
   - Mango X Ice prioritaire, autres médias différés ;
   - carte terpènes avec le radar existant, analyse labo, origine/culture ;
   - collection finale avec les quatre médias demandés et la vidéo Lemon Punch Hash ;
   - progression latérale, boutons Catalogue et Sommelier ;
   - expérience simplifiée sur mobile et version statique en mouvement réduit.
2. Remplacer uniquement `HeroSection` par `CinematicHero` sur l’accueil. L’AgeGate reste le premier écran.
3. Réécrire `GoldParticles` sur un canvas 2D unique, suspendu hors écran et lorsque l’onglet est masqué.
4. Épurer `ProductCard` : conserver média, badges, nom, sous-titre, radar et prix de départ ; remplacer les contrôles de poids et d’ajout par « Choisir mon grammage » vers la fiche produit ; conserver l’aperçu vidéo au survol et raccourcir l’animation d’entrée.
5. Ajouter `vite-imagetools`, produire les variantes WebP 400/800/1200 et fournir `srcset`, `sizes`, largeur et hauteur explicites aux cartes produit.
6. Vérifier le rendu desktop/mobile, le mouvement réduit, l’AgeGate, les liens, la console et l’état de compilation.

## Détails techniques
- Aucun changement de base de données, d’espace admin/pro/commercial, de panier, de Sommelier ou de logique tarifaire.
- Les effets utilisent Framer Motion, CSS 3D et Canvas 2D uniquement ; aucune nouvelle bibliothèque 3D.
- Les couleurs et effets restent basés sur les tokens visuels existants.
- Une règle d’architecture sera ajoutée dans `AGENTS.md` uniquement si nécessaire pour documenter le pipeline d’images adaptatives.
