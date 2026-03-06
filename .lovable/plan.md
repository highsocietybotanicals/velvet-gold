

## Diagnostic : flash de la page d'erreur avant la redirection Viva

### Cause identifiée

Quand `window.location.href` redirige vers Viva, le navigateur commence à quitter la page. Pendant ce temps, le bloc `finally` dans `handlePayment` exécute `setIsLoading(false)`, ce qui met à jour le state d'un composant React en cours de démontage. Cela provoque un crash React intercepté par l'ErrorBoundary, qui s'affiche brièvement (~2s) avant que la redirection ne se termine.

### Correction

**Fichier : `src/components/CartDrawer.tsx`**
- Ajouter un flag `redirecting` pour ne plus mettre à jour le state après le `window.location.href`
- Dans le `finally`, ne faire `setIsLoading(false)` que si on n'est pas en cours de redirection

```typescript
// Avant la redirection
if (data?.checkoutUrl && ...) {
  // Ne PAS faire setIsLoading(false) après ça
  window.location.href = data.checkoutUrl;
  return; // Sortir pour éviter le finally
}
```

Concrètement : remplacer le `finally { setIsLoading(false) }` par un `setIsLoading(false)` uniquement dans le `catch`, et ajouter un `return` après le `window.location.href` pour que le `finally` ne s'exécute pas inutilement (ou utiliser un flag).

### Résultat attendu
Le bouton payer redirige directement vers Viva sans flash de la page d'erreur.

