

## Probleme

Le panier stocke le **produit entier** (avec son prix) dans `localStorage` au moment de l'ajout. Quand tu modifies le prix dans la base de données, le panier garde l'ancien objet produit avec l'ancien prix (10€). Il ne se met jamais a jour.

## Solution

Synchroniser les prix du panier avec les prix actuels de la base de donnees a chaque chargement.

### Modification : `src/contexts/CartContext.tsx`

Ajouter un `useEffect` qui, au montage du composant (et quand les produits DB changent), met a jour le prix de chaque produit dans le panier avec le prix actuel de la base de donnees.

1. Importer le hook `useProducts` (qui recupere les produits depuis la DB)
2. Ajouter un `useEffect` qui parcourt les items du panier et remplace `item.product.price` par le prix actuel de la DB si il a change
3. Meme logique pour les echantillons (`sampleItems`)

```typescript
// Dans CartProvider, apres les useState existants :
const { products: dbProducts } = useProducts();

useEffect(() => {
  if (!dbProducts || dbProducts.length === 0) return;
  
  setItems(prev => prev.map(item => {
    const dbProduct = dbProducts.find(p => p.id === item.product.id);
    if (dbProduct && dbProduct.price !== item.product.price) {
      return { ...item, product: { ...item.product, price: dbProduct.price } };
    }
    return item;
  }));
}, [dbProducts]);
```

### Fichiers impactes
- **1 fichier** : `src/contexts/CartContext.tsx` (ajout d'un useEffect de synchronisation des prix)

### Resultat attendu
- Quand un prix est modifie dans l'admin, le panier reflette automatiquement le nouveau prix au prochain chargement de page
- Pas besoin de vider le panier manuellement

