# Espace Pro : paiement sans Viva + fin des commandes fantômes

## 1. Paiement Pro : retirer la carte Viva Wallet

Dans le panier professionnel, trois modes seulement :

- **Virement** — facture à 30 jours (inchangé)
- **Paiement physique** (nouveau) — espèces / TPE / chèque à la livraison ou en main propre. La commande est enregistrée, et c'est toi qui valides l'encaissement depuis l'admin.
- **Devis** (proforma) — inchangé

Le bouton « Payer en ligne (carte bancaire) » disparaît, et tout le code Viva est retiré du parcours pro (le paiement Viva reste bien sûr actif pour les clients particuliers).

## 2. Validation du paiement côté admin

Rien de nouveau à construire : les commandes pro apparaissent dans Commandes avec le mode de paiement affiché (« Virement » / « Paiement physique ») et tu passes le paiement en « Payé » avec le bouton existant. On ajoute juste l'affichage clair du mode de règlement sur la fiche commande pour ne pas se tromper.

Côté partenaire, l'Espace Pro affichera « En attente de validation du paiement par HSB » au lieu d'un simple « en attente », pour lever l'ambiguïté.

## 3. Plus de commandes fantômes

Aujourd'hui la commande est créée en base *avant* la redirection Viva. Si le client abandonne (retour arrière, fermeture), la ligne reste en `pending` / `unpaid` et pollue la liste.

Correctifs :

- **Retour d'un paiement échoué ou abandonné** : la page d'échec de paiement supprime immédiatement la commande non payée concernée (aucun montant débité, donc rien à conserver).
- **Séparation dans l'admin** : la liste principale des Commandes n'affiche plus que les commandes réellement payées ou validées (virement / paiement physique). Les tentatives non payées vont dans un onglet distinct « Paniers abandonnés », consultable et purgeable en un clic.
- **Purge automatique** : le nettoyage automatique des commandes non payées passe de 7 jours à 48 h (au-delà des relances panier abandonné 2 h / 24 h, qui continuent de fonctionner).
- Les commandes pro en virement / paiement physique ne sont **jamais** considérées comme abandonnées, même si `payment_status` est encore `unpaid`.

## Détails techniques

- `src/pages/pro/ProCartPage.tsx` : suppression du mode `online`, ajout de `physical`, libellés et bouton adaptés.
- `supabase/functions/create-pro-order/index.ts` : `paymentMethod` accepté = `transfer` | `physical` ; suppression de l'appel Viva et du retour `checkoutUrl` ; statut initial `pending` / `unpaid`.
- `src/components/admin/OrdersSection.tsx` : onglets « Commandes » / « Paniers abandonnés », filtre `payment_status`, badge du mode de règlement, exclusion des commandes pro non payées de la catégorie abandonnée.
- `src/pages/PaymentFailurePage.tsx` : suppression de la commande non payée au retour (via fonction backend sécurisée, vérification `viva_order_code` + `payment_status = 'unpaid'`).
- Migration : `cleanup_abandoned_orders()` — fenêtre 48 h et exclusion de `order_channel = 'pro'`.
- `src/pages/pro/ProOrdersPage.tsx` : libellés de statut de paiement explicites.
