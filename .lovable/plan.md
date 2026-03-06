

## Diagnostic : Écran noir sur le site publié

### Problème identifié

L'application n'a **aucun Error Boundary React**. Quand une erreur JavaScript survient (lors d'un changement de statut de commande ou du paiement), React crash complètement et démonte toute l'interface. Résultat : le `<div id="root">` devient vide → fond noir du thème sombre.

Causes probables des crashes :
1. **Changement de statut** : Après la mutation, `invalidateQueries` re-fetch les données. Si une erreur de rendu survient pendant la mise à jour React, tout plante sans filet.
2. **Paiement** : Si `supabase.functions.invoke` échoue d'une manière inattendue ou si `window.location.href` reçoit une URL invalide, l'erreur non attrapée crash l'app.

### Plan de correction

#### 1. Ajouter un ErrorBoundary global
Créer un composant `ErrorBoundary` qui attrape toutes les erreurs React et affiche un message de fallback au lieu d'un écran noir, avec un bouton "Recharger".

#### 2. Renforcer la gestion d'erreurs dans AdminPage
- Envelopper le `onValueChange` du Select dans un try/catch
- Ajouter un `onError` plus robuste sur la mutation qui ne crash pas le rendu

#### 3. Sécuriser le flux de paiement
- Vérifier que `data?.checkoutUrl` est une URL valide avant de rediriger
- Ajouter un fallback si la redirection échoue

#### 4. Corriger le type AdminOrder
Ajouter les champs manquants (`guest_name`, `guest_email`, `guest_phone`) dans l'interface `AdminOrder` pour éviter des accès à des propriétés non typées dans `ShippingLabel`.

### Fichiers modifiés
- **Nouveau** : `src/components/ErrorBoundary.tsx`
- `src/App.tsx` — Envelopper l'app dans l'ErrorBoundary
- `src/hooks/useAdmin.ts` — Ajouter `guest_name`, `guest_email`, `guest_phone` au type `AdminOrder`
- `src/components/CartDrawer.tsx` — Valider l'URL de checkout avant redirect

