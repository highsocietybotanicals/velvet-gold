

# Remplacer l'image hero par une composition avec les vraies varietes

## Concept

Au lieu d'une seule image generee par IA, creer une composition CSS/Framer Motion interactive avec les **vraies photos** des 7 varietes du catalogue qui flottent et tournent autour d'un livre ouvert illumine. Les paillettes d'or tombent en arriere-plan grace au composant GoldParticles existant.

## Ce qui change

### Modifier `src/components/HeroSection.tsx`

- Supprimer l'import de `hero-flowers-resin.jpg`
- Importer les 7 vraies images produits depuis `src/data/products.ts` ou directement :
  - `amnesia-oniria-real.jpg`
  - `platinum-og-real.jpg`
  - `mint-kush-real.jpg`
  - `blue-mango-real.jpg`
  - `911-og-real.jpg`
  - `ice-o-lator-real.jpg`
  - `golden-cbn-real.jpg`
- Remplacer le bloc `<img>` unique par une composition animee :
  - Un element central representant un **livre ouvert** (image generee ou icone stylee avec glow dore)
  - Les 7 images produits disposees en cercle autour du livre
  - Chaque image tourne lentement en orbite avec Framer Motion (`rotate`, positions circulaires avec `sin`/`cos`)
  - Chaque image a un leger flottement vertical independant (decalage different)
  - Des trainées dorees derriere chaque image (effet CSS `box-shadow` gold + blur)
  - Le livre au centre a un effet lumineux (glow dore, ombre portee)

### Generer une image de livre ouvert

- Generer une image d'un livre ancien ouvert, fond transparent/noir, eclaire par une lumiere doree, style haute joaillerie
- La sauvegarder dans `src/assets/hero-book.jpg`

### Details techniques de l'animation

- Les 7 produits sont positionnes en cercle (rayon ~200px sur desktop, ~120px sur mobile)
- Animation CSS `@keyframes orbit` ou Framer Motion `animate` avec rotation continue lente (30-40 secondes par tour)
- Chaque produit a un delai different pour creer un mouvement organique
- Les images produits sont affichees en cercle (border-radius 50%) avec bordure doree fine
- Taille des vignettes : ~80px sur desktop, ~50px sur mobile
- Effet de trainee : `box-shadow: 0 0 20px rgba(212, 175, 55, 0.4)`

### Responsive

- Desktop : composition large avec orbite visible
- Mobile : orbite plus petite, vignettes reduites, le tout reste lisible

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/HeroSection.tsx` | Modifier - remplacer image par composition animee |
| `src/assets/hero-book.jpg` | Creer - image du livre illumine |

## Resultat attendu

- Les vraies photos des varietes tournent autour d'un livre dore
- Effet premium avec trainées d'or et flottement
- Aucune image "fake" - uniquement les vrais produits du catalogue
