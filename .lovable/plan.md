## Bug
La requête sélectionne `orders.user_email` qui n'existe pas → 400 → tableau vide même en filtre "Année".

## Correction
Dans `AccountingManager.tsx` :
- Retirer `user_email` du SELECT.
- Pour le client afficher : `guest_name` → `guest_email` → `"Client"`. Pour récupérer l'email des commandes avec `user_id`, faire un second fetch `profiles` (id, email) sur les user_id présents et l'utiliser en priorité.

Aucun autre changement.
