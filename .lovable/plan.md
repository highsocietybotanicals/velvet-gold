

## Plan : Sommelier avec actions panier + contrôle des cadeaux

### Problème
Le chatbot sommelier propose des cadeaux (3g gratuits) sans autorisation et ne peut pas ajouter de produits au panier du client.

### Solution

**1. Système de commandes structurées dans les réponses du sommelier**

L'IA retournera des blocs JSON spéciaux dans ses réponses que le frontend détectera et transformera en boutons cliquables :

```text
Réponse IA texte normal...
[ADD_TO_CART:{"productId":"amnesia-signature-oniria","weight":5}]
```

Le composant `SommelierChatbot` parsera ces tags, les retirera du texte markdown, et affichera des boutons "Ajouter au panier" à la place.

**2. Mise à jour du prompt système (Edge Function)**

- Instruire l'IA à utiliser le format `[ADD_TO_CART:{"productId":"...","weight":N}]` quand elle recommande un produit
- Fournir la liste exacte des `productId` valides
- **Supprimer** la mention "Échantillon Découverte gratuit" du prompt pour empêcher l'IA de promettre des cadeaux qu'elle n'est pas autorisée à offrir
- Ajouter une règle explicite : "Ne propose JAMAIS de grammes gratuits, de cadeaux ou de réductions non listées dans la grille de prix"

**3. Mise à jour du composant `SommelierChatbot.tsx`**

- Importer `useCart` depuis `CartContext` et `products` depuis `data/products`
- Parser les réponses pour extraire les blocs `[ADD_TO_CART:...]`
- Pour chaque bloc trouvé, afficher un bouton stylisé avec le nom du produit et le poids
- Au clic, appeler `addToCart(product, weight)` avec le produit correspondant
- Afficher un toast de confirmation

**4. IDs produits pour le prompt**

Le prompt inclura la table de mapping :
- `amnesia-signature-oniria`, `platinum-og`, `mint-kush`, `911-og-indoor-master`, `blue-mango-indoor-master`, `ice-o-lator`, `golden-cbn`, `nuage-de-mousseux`

### Fichiers modifiés
- `supabase/functions/sommelier-chat/index.ts` — Mise à jour du prompt système
- `src/components/SommelierChatbot.tsx` — Parsing des commandes + boutons panier

