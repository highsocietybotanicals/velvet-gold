## Objectif

Remplacer **complètement** l'affichage du prix de base (12€, 13€, 15€…) par la mention **« À partir de X€/g »** sur les cartes produits et la fiche produit. Le prix dynamique calculé selon le poids sélectionné reste affiché tel quel plus bas (sélecteur + total).

## Changements

### 1. `ProductCard.tsx`
- **Supprimer** le bloc « Prix/g » à droite du radar terpénique (lignes ~270-280) qui affiche `{basePrice}€`.
- **Déplacer / conserver** uniquement la mention « À partir de X€/g » (déjà ajoutée sous le sous-titre) — la mettre plus en valeur (taille un peu plus grande, gold).
- Le bloc « total selon poids sélectionné » en bas de carte est inchangé.

### 2. `ProductPage.tsx`
- Remplacer le gros prix `{basePrice}€ /gramme` (lignes ~222-234) par : **« À partir de X€/g »** en `text-3xl font-display`.
- Conserver le badge HT pour les Pros (ils continuent à voir leur prix Pro fixe).
- Conserver le badge CBD/molecule à droite.
- Le total dynamique selon poids sélectionné reste affiché plus bas.

### 3. Cas Pro (TVA validée)
- Les Pros voient leur prix HT fixe inchangé (pas de « À partir de »), car leur tarif est unique sans dégressif.

## Aucun changement
- `pricing.ts` (la fonction `getLowestPricePerGram` existe déjà)
- Logique panier, calculs, DB
