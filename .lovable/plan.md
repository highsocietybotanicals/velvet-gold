

## Plan : Email de remerciement via Gmail SMTP

Tu as généré le mot de passe d'application Google avec succès. Voici le plan pour envoyer les emails de confirmation depuis `contacts@highsocietybotanicals.com` via Gmail SMTP.

### Étapes

1. **Stocker 2 secrets** : `GMAIL_USER` (contacts@highsocietybotanicals.com) et `GMAIL_APP_PASSWORD` (le mot de passe que tu viens de fournir)

2. **Créer `send-order-confirmation` edge function** qui :
   - Reçoit un `orderId`
   - Récupère la commande + items + profil client via service role
   - Génère un email HTML de remerciement avec facture détaillée (numéro HSB-XXXXXX, tableau des articles avec produit/poids/prix, total, infos livraison)
   - Envoie via Gmail SMTP avec `denomailer` (bibliothèque Deno pour SMTP)
   - Expéditeur : `contacts@highsocietybotanicals.com`

3. **Modifier `verify-payment/index.ts`** : après le passage en `paid` (ligne 104-110), appel vers `send-order-confirmation`

4. **Modifier `viva-webhook/index.ts`** : après le passage en `paid` (ligne 268-274), appel vers `send-order-confirmation`

5. **Mettre à jour `supabase/config.toml`** : ajouter `[functions.send-order-confirmation]` avec `verify_jwt = false`

6. **Déployer** les 3 edge functions modifiées

### Contenu de l'email
- Objet : "Merci pour votre commande HSB-XXXXXX — High Society Botanicals"
- Message personnalisé (prénom si disponible, sinon nom)
- Tableau : produit, type, quantité/poids, prix unitaire, total ligne
- Total général
- Infos livraison (type, adresse, date/créneau)
- Pied de page avec coordonnées

### Détail technique
- L'email est envoyé directement depuis ton compte Google, pas via l'infrastructure Lovable
- Idempotency : vérification dans `email_send_log` avant envoi pour éviter les doublons
- L'envoi est asynchrone (fire-and-forget) pour ne pas bloquer la réponse de paiement

