# Mango X Ice à 17 €/g, prix pro 100 % HT et rentabilité dans l'espace pro

## 1. Mango X Ice : 17 €/g

- Le prix public du 1 g passe de 15 € à **17 € TTC** (Haribo et Heisenberg restent à 15 €).
- Les paliers se recalculent automatiquement depuis ce prix de base (grille Nectar Divin) :
  - 1 g : 17,00 €
  - 2,5 g : ~39,67 €
  - 5 g : 68,00 €
  - 10 g : ~113,33 €
- Le prix est mis à jour dans la base **et** dans le catalogue statique pour que le site, le panier, la facturation et le paiement affichent tous 17 €.
- Le tarif pro de Mango X Ice est réaligné sur 50 % du nouveau prix public HT : 17 / 1,2 / 2 = **7,08 €/g HT**, puis dégressif -5 / -10 / -15 / -20 % (6,73 / 6,38 / 6,02 / 5,67).

## 2. Suppression du supplément conditionnement

Aujourd'hui le catalogue pro ajoute +1,00 €/g sur le 1 g et +0,60 €/g sur le 2,5 g (d'où le 7,25 €/g affiché sur le 1 g de Haribo). Ce supplément est **supprimé** : le pochon, le Boveda et l'étiquette restent à ta charge.

Résultat : le prix pro est identique quel que soit le format, et c'est exactement 50 % du prix public HT (Haribo : 6,25 €/g HT sur tous les formats).

Les libellés du catalogue pro et du panier pro indiquent clairement **HT** partout, avec la TVA affichée à part sur le total.

## 3. Bandeau rentabilité dans l'espace pro

À côté de la barre de progression des paliers, ajout d'un bloc « Ta rentabilité » qui se met à jour en direct avec le panier :

```text
┌──────────────────────────────┬───────────────────────────────────────────┐
│ 250 g — palier dès 250 g     │  Prix public TTC     1 234,00 €           │
│ ████████████░░░░░░  -10 %    │  Ton achat HT          567,00 €           │
│                              │  Marge revendeur       667,00 € (coef 2,18)│
└──────────────────────────────┴───────────────────────────────────────────┘
```

- **Prix public TTC** : total conseillé à la revente pour les quantités saisies.
- **Ton achat HT** : total pro HT du panier.
- **Marge revendeur** : écart en euros, plus le coefficient multiplicateur et le % de marge.
- Panier vide : le bloc reste visible avec des tirets, sans casser la mise en page.

## Détails techniques

- Base de données : `UPDATE products` (prix Mango X Ice) et `UPDATE pro_price_tiers` (5 paliers de la gamme `mango-x-ice`).
- `src/data/products.ts` : prix statique de Mango X Ice à 17.
- `src/lib/proPricing.ts` : `FORMAT_SURCHARGE` ramené à 0 pour tous les formats (le prix pro devient purement le €/g du palier).
- `src/components/pro/ProTierBar.tsx` : passage en grille 2 colonnes (barre de palier + bloc rentabilité), nouvelles props `retailTotalTTC`, `totalHT`, `resellerMarginTotal` déjà calculées par `computeProCart`.
- `src/pages/pro/ProCataloguePage.tsx` : transmission des nouvelles props, libellés « HT » et retrait de la mention du supplément format.
- `supabase/functions/create-viva-payment/index.ts` : vérification que le prix Mango X Ice reste synchronisé (grille lue depuis le prix de base).
