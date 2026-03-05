

## Probleme identifie

Le chatbot sommelier donne des **prix totalement faux** car la grille de prix dans son prompt systeme ne correspond pas a la vraie logique de tarification du site.

**Exemple : Nuage de Mousseux (10€/g, Groupe A)**
- Le prompt dit : 2g = 9€/g, 10g = 6€/g, 100g = 2€/g
- La realite : 2g = 10€/g (pas de remise sous 10g), 10g = 8.50€/g (-15%), 100g = 5€/g (-50%)

## Correction

Mettre a jour le `PRODUCTS_CONTEXT` dans `supabase/functions/sommelier-chat/index.ts` avec la vraie grille de prix basee sur les paliers de poids :

**Groupe A (base 12€/g)** — Amnesia, Platinum OG, Mint Kush, Ice O Lator, Golden CBN :
- Moins de 10g : 12€/g
- 10-24g : 10.20€/g (-15%)
- 25-49g : 9€/g (-25%)
- 50-99g : 7.80€/g (-35%)
- 100g+ : 6€/g (-50%)

**Nuage de Mousseux (base 10€/g, paliers Groupe A)** :
- Moins de 10g : 10€/g
- 10-24g : 8.50€/g (-15%)
- 25-49g : 7.50€/g (-25%)
- 50-99g : 6.50€/g (-35%)
- 100g+ : 5€/g (-50%)

**Groupe B (base 14€/g)** — 911 OG, Blue Mango :
- Moins de 10g : 14€/g
- 10-24g : 12.60€/g (-10%)
- 25-49g : 11.20€/g (-20%)
- 50-99g : 10.50€/g (-25%)
- 100g+ : 9.10€/g (-35%)

Un seul fichier a modifier : `supabase/functions/sommelier-chat/index.ts` (section `GRILLES DE PRIX`).

