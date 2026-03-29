

# Plan : Envoyer la facture PDF au client par email

## Problème

Actuellement, la facture n'existe que côté admin (impression navigateur). Le client ne reçoit jamais sa facture, ni en pièce jointe, ni via un lien de téléchargement.

## Approche proposée

Générer un PDF de facture côté serveur (edge function) et l'envoyer par email au client lors de la confirmation de commande ou du passage en statut "payé".

## Modifications

### 1. Nouvelle edge function `generate-invoice-pdf`

- Reprend le template HTML de facture existant (`OrderSummaryPrint`)
- Utilise une librairie comme jsPDF (ou rendu HTML vers PDF) pour générer le PDF côté serveur
- Accepte un `order_id`, récupère les données de commande + items + profil client
- Retourne le PDF en base64

### 2. Modifier `send-order-confirmation` pour attacher la facture

- Après génération de la commande, appelle `generate-invoice-pdf`
- Encode le PDF en base64 et l'inclut dans l'email via Gmail SMTP (pièce jointe)
- Alternative : stocker le PDF dans un bucket Supabase Storage et inclure un lien de téléchargement dans l'email

### 3. Accès client dans l'espace profil (optionnel)

- Ajouter un bouton "Télécharger la facture" dans `OrderHistory` / `OrderTracking` côté client
- Le bouton appelle l'edge function et déclenche le téléchargement

## Détails techniques

- Le PDF sera généré avec `jsPDF` dans l'edge function (compatible Deno)
- L'email Gmail SMTP supporte les pièces jointes en base64 via le format MIME multipart
- Le template de facture réutilisera les mêmes données et calculs TVA que `OrderSummaryPrint`

## Question à clarifier

Il y a deux approches pour la livraison de la facture :
- **Pièce jointe email** : le PDF est directement attaché à l'email de confirmation
- **Lien de téléchargement** : le PDF est stocké en storage, un lien est inclus dans l'email + disponible dans l'espace client
- **Les deux** : pièce jointe + accès depuis le profil

