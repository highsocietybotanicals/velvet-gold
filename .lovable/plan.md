## Objectif

Permettre, dans le formulaire de commande manuelle de l'admin, de récupérer en un clic les coordonnées d'un ancien client (nom, email, téléphone, adresse) au lieu de tout retaper.

## Modifications

**Fichier : `src/components/admin/ManualOrderCreator.tsx`**

1. Ajouter en haut du bloc "Client info" un champ de recherche/sélection « Client existant » (Combobox avec recherche par nom ou email).
2. Au chargement (et avec mise en cache via React Query), récupérer la liste des clients déjà connus en agrégeant :
   - les profils utilisateurs (`profiles` : `full_name`, `email`, `phone`, `address_line1`, `city`, `postal_code`)
   - les commandes invitées passées (`orders` distinct par `guest_email`/`guest_phone` : `guest_name`, `guest_email`, `guest_phone`, `delivery_address`)
   - dédoublonnage par email (ou téléphone si pas d'email), tri alphabétique, libellé : `Nom — email/téléphone`.
3. À la sélection d'un client, pré-remplir automatiquement les 4 champs existants (`customerName`, `customerEmail`, `customerPhone`, `customerAddress`). L'admin peut ensuite éditer librement.
4. Bouton « Effacer » à côté du sélecteur pour repartir d'un client vide.

## Détails techniques

- Utiliser le composant `Command` (shadcn) déjà présent (`src/components/ui/command.tsx`) pour la recherche filtrable, encapsulé dans un `Popover`.
- Hook `useQuery(["admin","known-customers"], …)` activé uniquement quand le panneau est ouvert (lazy), avec `staleTime: 5 min`.
- Aucun changement de schéma DB, aucune nouvelle policy : les requêtes utilisent les policies admin existantes sur `profiles` et `orders`.
- Aucun changement à la logique de création de commande, prix, cadeaux, promo, facture.

## Hors scope

- Pas de gestion de "fiches clients" dédiées (table dédiée).
- Pas de modification des autres formulaires (checkout public, etc.).
