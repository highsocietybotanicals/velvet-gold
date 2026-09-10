# Guide commercial HSB (PDF)

Un PDF A4 complet, à remettre à Philippe (et aux futurs commerciaux), qui explique la marque, la gamme, les garanties légales et la façon de vendre. Il sera téléchargeable depuis l'espace commercial, à côté de la grille tarifaire et du catalogue.

## Structure du document (chapitres numérotés)

1. **Notre histoire** — Pourquoi HSB existe : un ancien fumeur fatigué du "foin", des variétés qui disparaissent d'une visite à l'autre, des déceptions à répétition. D'où la décision d'ouvrir un laboratoire, de sélectionner soi-même, et de se placer au niveau des meilleurs magasins premium sans jamais vendre sur du "on m'a dit".
2. **Notre exigence de sélection** — Plus de 200 variétés testées, une dizaine retenues. Goût, odeur, visuel, effet. Chaque produit est testé en interne avant commercialisation : bon ne suffit pas, il faut l'excellence.
3. **La gamme sous toutes ses formes** — Fleurs indoor, résines, gammes Classique / Force Noire / Nectar Divin / Exotique. Ce qui distingue chaque famille et à quel type de client la proposer.
4. **Culture & packaging** — 100 % indoor, packaging premium en aluminium alimentaire, humidité maîtrisée par Boveda 62 %, préconditionnés 1 g / 2,5 g / 5 g / 10 g prêts à vendre.
5. **Légalité & analyses laboratoire** — Chaque molécule proposée fait l'objet d'une analyse dédiée au dépistage des molécules illégales : chromatographie en phase gazeuse couplée à la spectrométrie de masse et à un détecteur à ionisation de flamme (GC-MS / GC-FID). Analyses disponibles en un clic dans l'espace commercial, à montrer au buraliste.
6. **Mention obligatoire** — Les molécules sont proposées à usage de pot-pourri uniquement, conformément à la loi française. Formulation à respecter à l'oral comme à l'écrit, sans promesse d'effet ni allégation de santé.
7. **L'offre revendeur** — Marge organisée à x2 HT pour le commerçant, ristournes par volume (100 g / 250 g / 500 g / 1 kg), feuilles slim et briquet offerts par 10 g pour remercier les clients fidèles.
8. **Le pitch de vente** — Déroulé d'une visite : accroche en 30 secondes, questions à poser, ordre de présentation des produits, moment où sortir les analyses et la grille tarifaire, conclusion et prise de commande.
9. **Objections & réponses** — "C'est trop cher", "j'ai déjà un fournisseur", "ça ne tourne pas", "c'est légal ?", "et les contrôles ?" — une réponse courte et une preuve pour chacune.
10. **Rémunération du commercial** — Barème progressif par tranche : 10 % jusqu'à 5 000 € HT/mois, 12 % de 5 000 à 10 000 €, 15 % au-delà. Commissions sur les réassorts aussi 10% aussi et 50 euros par nouveau client b2b trouver .
11. **Aide-mémoire** — Ce qu'il emporte en visite, les documents disponibles, le contact HSB.

Ton : sobre, haut de gamme, phrases courtes, aucune promesse d'effet.

## Détails techniques

- Script de génération avec ReportLab (Platypus), police Unicode DejaVu pour les accents, charte or/noir de la marque, en-tête et pied de page paginés.
- Sortie : `public/documents/HSB-Guide-Commercial.pdf`.
- Ajout de la fiche dans la liste `DOCS` de `src/pages/commercial/CommercialDocumentsPage.tsx` (même carte de téléchargement que les deux PDF existants).
- Contrôle qualité obligatoire : rendu en images page par page et relecture visuelle (débordements, coupures, marges) avant livraison.