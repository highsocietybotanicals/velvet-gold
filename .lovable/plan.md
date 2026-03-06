
Objectif: corriger définitivement le prix affiché dans le panier pour “Nuage de Mousseux” (et tous les produits) quand le prix a été modifié dans la base.

Diagnostic confirmé
- La base renvoie bien le nouveau prix (`nuage-de-mousseux` = `1`), donc le backend est correct.
- Le problème est côté front: `addToCart(product, ...)` reçoit souvent un produit “statique” venant de `src/data/products.ts` (où Nuage est encore à 10€).
- Le `useEffect` actuel dans `CartContext` ne se déclenche que quand `dbProducts` change. Donc:
  - il peut corriger d’anciens items au chargement,
  - mais un nouvel item ajouté après coup peut garder 10€ si `dbProducts` n’a pas re-changé.

Plan de correction
1) Corriger la source du prix au moment de l’ajout au panier
- Fichier: `src/contexts/CartContext.tsx`
- Ajouter un helper local (ex: `withLatestDbPrice(product)`) qui:
  - cherche le produit correspondant dans `dbProducts` par `id`,
  - remplace `product.price` par le prix DB si trouvé,
  - garde le produit original sinon (fallback).
- Utiliser ce helper dans:
  - `addToCart(...)`
  - `addSample(...)`
- Résultat: chaque nouvel ajout prend immédiatement le prix réel DB, même si la query ne refetch pas.

2) Renforcer la synchro existante pour les paniers déjà stockés
- Conserver l’effet de sync actuel (utile pour corriger le `localStorage` historique).
- Petite amélioration de robustesse:
  - vérifier aussi les items ajoutés récemment (sans boucle infinie),
  - continuer à ne mettre à jour l’état que si au moins un prix diffère.
- Résultat: anciens paniers + nouveaux ajouts restent cohérents.

3) Aligner les points d’entrée produit (option recommandé)
- Les composants (`ProductCard`, `ProductPage`, `CataloguePage`, `SommelierSection/Chatbot`) peuvent continuer à passer des produits statiques.
- La correction centrale dans `CartContext` suffit.
- Option qualité: harmoniser plus tard l’affichage catalogue (certains écrans lisent encore `product.price` statique visuellement).

Vérification fonctionnelle (à exécuter après implémentation)
1. Mettre “Nuage de Mousseux” à 1€ en admin.
2. Sans vider le panier:
   - ajouter Nuage depuis la page d’accueil,
   - ajouter Nuage depuis la fiche produit,
   - ajouter Nuage depuis catalogue/sommelier si possible.
3. Vérifier dans le panier:
   - ligne produit en €/g = 1€,
   - total recalculé correctement.
4. Recharger la page et vérifier que le panier persiste avec 1€ (localStorage corrigé).

Fichiers impactés
- `src/contexts/CartContext.tsx` (principal, correction définitive)
- Aucun changement DB/RLS requis.
