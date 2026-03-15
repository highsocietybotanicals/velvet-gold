
Objectif: corriger l’email de confirmation pour qu’il affiche correctement les échantillons/cadeaux/ristournes, faire apparaître le code promo quand le client est éligible, et supprimer les `=20` visibles dans le mail.

Plan d’implémentation

1) Aligner les règles promo + échantillons + cadeaux
- Uniformiser la règle d’échantillons à **1g offert par tranche de 10g** partout (actuellement il y a un mix 10g/12g selon les fichiers).
- Réactiver la logique cadeaux (actuellement désactivée dans `src/lib/pricing.ts`), pour qu’elle soit réellement calculée et affichable.
- Vérifier la règle promo côté email: aujourd’hui le bloc promo dépend uniquement de `order.user_id` + count de commandes payées; je vais la rendre plus robuste (et explicite) pour éviter les cas “code absent” inattendus.

2) Sauvegarder les échantillons/cadeaux dans la commande (pour pouvoir les afficher dans l’email)
- `src/components/CartDrawer.tsx`:
  - faire passer les `sampleItems` au paiement.
- `supabase/functions/create-viva-payment/index.ts`:
  - valider côté serveur les échantillons (max autorisé, 1g chacun, seulement des fleurs valides),
  - ajouter les échantillons et cadeaux comme lignes `order_items` à 0€ (types dédiés `sample` / `gift`),
  - conserver un total facturé inchangé (les offerts n’augmentent pas le montant).
- Avantage: pas de migration DB nécessaire, on réutilise `order_items` pour le détail complet de la commande.

3) Enrichir l’email de confirmation
- `supabase/functions/send-order-confirmation/index.ts`:
  - séparer les lignes de commande en sections:
    - Articles facturés
    - Échantillons gratuits
    - Cadeaux offerts
  - ajouter un bloc “Ristournes appliquées” (remise palier poids + promo si présent),
  - afficher BIENVENUE15 selon l’éligibilité réelle (et ajouter un message clair si non éligible pour éviter l’impression de bug).

4) Corriger définitivement le problème `=20`
- Dans l’envoi SMTP (`send-order-confirmation`):
  - activer `encodeLB: true` sur le client denomailer (corrige les soucis d’encodage/retours ligne),
  - envoyer aussi une version texte (`content`) propre en plus du HTML,
  - nettoyer le HTML généré (supprimer espaces de fin de ligne / normaliser les retours),
  - garder l’objet du mail simple (ASCII) pour éviter les artefacts d’encodage.

5) Vérification end-to-end
- Tester 3 cas:
  1. 1ère commande payée d’un compte: code visible dans l’email, pas de `=20`.
  2. 2ème commande: promo appliquée (auto/manual), ristournes + offerts visibles.
  3. Compte ayant déjà utilisé BIENVENUE15: plus de code actif.
- Contrôler à la fois le rendu inbox et le contenu brut du message (pour confirmer la disparition des `=20`).

Détails techniques (résumé)
- Fichiers ciblés:
  - `src/lib/pricing.ts`
  - `src/components/CartDrawer.tsx`
  - `src/pages/SampleSelectionPage.tsx`
  - `src/contexts/CartContext.tsx`
  - `supabase/functions/create-viva-payment/index.ts`
  - `supabase/functions/send-order-confirmation/index.ts`
- Pas de changement RLS ni migration SQL obligatoire pour cette version (on capitalise sur `order_items` existant).
