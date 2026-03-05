

## Plan : Rendre l'adresse obligatoire pour les commandes postales (guest & connecté)

### Problème
Actuellement, un guest (ou même un utilisateur connecté) peut choisir "livraison postale" sans renseigner d'adresse. Vous n'avez alors aucun moyen de savoir où envoyer le colis.

### Modifications

#### 1. Frontend — `CartDrawer.tsx` (PaymentButton)
- Ajouter une validation : si `deliveryType === "postal"` et que `address` est vide, afficher une erreur toast et bloquer le paiement
- Pour les guests : vérifier aussi que `guestName` est rempli (pour le nom sur le colis)

#### 2. Edge function — `create-viva-payment`
- Ajouter une validation serveur : si `deliveryType === "postal"` et `deliveryAddress` est vide/null, retourner une erreur 400

#### 3. Formulaire guest — `CartDrawer.tsx`
- Rendre le champ `Nom` obligatoire (pas seulement l'email) avec un astérisque visuel
- Optionnel : ajouter un champ adresse directement dans le formulaire guest si la `DeliverySection` ne le couvre pas déjà pour les guests

### Résultat
Vous aurez toujours : nom + email + téléphone du guest, et l'adresse postale complète si livraison postale. Ces infos sont stockées dans la table `orders` (colonnes `delivery_address`, `guest_email`, `guest_name`, `guest_phone`).

