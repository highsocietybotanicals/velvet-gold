

## Diagnostic

L'ecran noir que tu vois est en fait la page d'erreur de l'ErrorBoundary avec le theme sombre -- le texte est la mais quasi invisible sur fond noir.

L'erreur "useCart must be used within a CartProvider" est declenchee par un rechargement de code en developpement (hot-reload) apres les modifications recentes. Quand l'ErrorBoundary attrape une erreur, il remplace TOUT l'arbre de composants (y compris CartProvider), ce qui cree une cascade d'erreurs.

## Plan de correction

### 1. Rendre la page d'erreur visible en mode sombre
**Fichier:** `src/components/ErrorBoundary.tsx`
- Forcer des couleurs explicites (fond blanc, texte noir) au lieu de `bg-background` qui est invisible en mode sombre

### 2. Ajouter un reset automatique de l'ErrorBoundary lors des navigations
**Fichier:** `src/components/ErrorBoundary.tsx`
- Wrapper l'ErrorBoundary pour qu'il reset son etat `hasError` quand la route change (via `location.pathname`)
- Cela evitera qu'une erreur transitoire bloque definitivement l'application

### 3. Securiser le PaymentSuccessPage
**Fichier:** `src/pages/PaymentSuccessPage.tsx`  
- Le bouton "Suivre ma commande" pointe vers `/profil` mais apres une redirection Viva, la session auth peut etre perdue
- Ajouter une verification: si pas connecte, rediriger vers `/auth` plutot que `/profil` pour eviter un crash

### Fichiers impactes
- `src/components/ErrorBoundary.tsx` (couleurs + reset sur navigation)
- `src/pages/PaymentSuccessPage.tsx` (securiser la redirection)

