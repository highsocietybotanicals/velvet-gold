

## Plan : Commande sans compte (Guest Checkout)

### Objectif
Permettre aux visiteurs non connectés de passer commande en fournissant simplement leur email, nom et téléphone, sans créer de compte.

### Modifications

#### 1. Base de données — Rendre `user_id` nullable + ajouter champs guest
- Migration SQL :
  - `ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL`
  - Ajouter colonnes `guest_email TEXT`, `guest_name TEXT`, `guest_phone TEXT`
  - Ajouter une politique RLS permettant l'INSERT sans auth (via service role dans l'edge function)
  - Mettre à jour la politique RLS pour que les admins voient aussi les commandes guest

#### 2. Edge function `create-viva-payment`
- Rendre l'authentification **optionnelle** : si un JWT valide est présent, l'utiliser ; sinon, accepter les champs `guestEmail`, `guestName`, `guestPhone`
- Pour les guests : utiliser le service role client pour insérer la commande (pas de user_id)
- Désactiver les fonctionnalités Pro/fidélité pour les guests
- Stocker les infos guest dans les nouvelles colonnes

#### 3. Frontend — `CartDrawer.tsx` (PaymentButton)
- Supprimer la redirection vers `/auth` quand non connecté
- Afficher un formulaire compact (email, nom, téléphone) pour les guests dans le footer du panier
- Passer les infos guest à l'edge function
- Appeler l'edge function avec l'anon key au lieu du token utilisateur pour les guests

#### 4. Frontend — `DeliverySection.tsx`
- Ajustement mineur : ne pas référencer `useAuth` pour les fonctionnalités Pro quand guest (déjà géré car `isPro` sera false)

### Sécurité
- Les commandes guest passent par le même calcul de prix serveur
- Pas de fidélité/Pro pour les guests
- L'edge function valide que `guestEmail` est bien fourni si pas de JWT
- Les commandes guest sont visibles uniquement par les admins (pas de page profil pour les guests)

### Ce qui ne change pas
- Les utilisateurs connectés gardent exactement le même flux
- La page profil/historique reste réservée aux utilisateurs connectés
- Le webhook Viva reste inchangé

