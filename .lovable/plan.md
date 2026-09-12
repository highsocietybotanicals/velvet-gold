# Faire disparaître réellement Heisenberg, Haribo, 911 OG et Poussière d'Or

## Ce qui se passe

En base, ces quatre variétés sont bien désactivées. Les pages principales (accueil, catalogue) les masquent correctement — c'est pour ça que vous ne les voyez plus.

Mais il reste quatre endroits du site qui affichent encore la liste figée écrite dans le code, sans tenir compte de la désactivation :

- **Les "variétés similaires"** en bas d'une fiche produit : elles peuvent proposer les variétés retirées, avec un lien cliquable.
- **La page de choix des échantillons offerts** : la liste des fleurs y est figée, donc la 911 OG reste sélectionnable.
- **Le Sommelier** (questionnaire d'intention/goût) : ses recommandations pointent vers la 911 OG.
- **Le chatbot Sommelier** : il peut encore proposer et ajouter au panier une variété retirée.

Et si un client a gardé le lien direct d'une fiche produit, la page l'affiche toujours grâce à une reprise sur la liste figée.

C'est très probablement par l'un de ces chemins que votre client l'a vue.

## Ce qui va être fait

1. Les variétés similaires ne proposeront plus que des variétés réellement disponibles.
2. La page des échantillons offerts n'affichera que les fleurs actives.
3. Le Sommelier remplacera automatiquement une recommandation indisponible par une variété active de la même famille (même intention et même goût).
4. Le chatbot ne pourra plus proposer ni ajouter au panier une variété retirée.
5. Le lien direct d'une fiche retirée affichera une page "variété indisponible" avec un renvoi vers le catalogue, au lieu de la fiche complète.

Aucun prix, aucun produit actif et aucune commande ne change. Les quatre variétés restent en base et réapparaîtront partout dès que vous les réactiverez dans Admin > Produits.

## Détails techniques

- `ProductPage.tsx` : `getSimilarProducts` prend la liste issue de `useCatalogProducts` au lieu de `allProducts`; suppression du repli `?? allProducts.find(...)` au profit d'un état "indisponible" (le hook filtre déjà `is_active === false`).
- `SampleSelectionPage.tsx` : passage de `flowers` (statique) à `useCatalogProducts().flowers`, avec exclusion des `isOutOfStock`.
- `SommelierSection.tsx` : après résolution via `recommendationMatrix`, vérification de la présence dans le catalogue actif; sinon repli sur le premier produit actif correspondant à `intentionMatch` + `tasteMatch`.
- `SommelierChatbot.tsx` : résolution des `command.productId` contre le catalogue actif; message d'indisponibilité si absent, et filtrage de la liste envoyée dans le contexte.
- Rien à modifier en base ni dans `src/data/products.ts`.
