

## Correction : flash de l'ErrorBoundary avant la redirection Viva

### Probleme

Le code de paiement est correct (pas de state update apres redirect), mais React crash quand meme pendant le processus de navigation (`window.location.href`). Le navigateur commence a quitter la page, certains composants React tentent de se re-rendre ou de se demonter, et une erreur est attrapee par l'ErrorBoundary qui s'affiche brievement (~2s) avant que la redirection ne se termine.

### Solution : deux corrections complementaires

**1. `src/components/ErrorBoundary.tsx`** - Ne pas afficher l'erreur si le navigateur est en train de naviguer ailleurs. Ajouter un listener `beforeunload` qui met un flag `isNavigatingAway`. Si ce flag est actif quand une erreur est attrapee, ne pas afficher la page d'erreur (laisser passer les children ou rien).

**2. `src/components/CartDrawer.tsx`** - Ajouter un `window.addEventListener('beforeunload')` juste avant le `window.location.href` pour signaler la navigation, et envelopper le redirect dans un petit `setTimeout` pour laisser React finir son cycle de rendu avant de declencher la navigation.

### Details techniques

```typescript
// ErrorBoundary.tsx - ignorer les erreurs pendant la navigation
static getDerivedStateFromError(error: Error): State {
  // Si le navigateur est en train de quitter la page, ignorer l'erreur
  if ((window as any).__isNavigatingAway) {
    return { hasError: false, error: null };
  }
  return { hasError: true, error };
}
```

```typescript
// CartDrawer.tsx - signaler la navigation avant le redirect
if (data?.checkoutUrl && ...) {
  (window as any).__isNavigatingAway = true;
  window.location.href = data.checkoutUrl;
  return;
}
```

### Resultat attendu
Le bouton payer redirige directement vers Viva sans aucun flash de la page d'erreur.

