# Les commandes manuelles ne disparaissent plus dans « Paniers abandonnés »

## Ce qui s'est passé

Tes 2 commandes de ce matin (HSB-094077 à 10h09 et HSB-854944 à 10h12, 100,00 € chacune, Thomas Vieira et Dominique Clemente) sont bien enregistrées en base. Elles n'apparaissent pas dans l'onglet « Commandes » parce qu'elles sont créées avec paiement « non payé » et mode de règlement « carte en ligne » par défaut — exactement la signature d'un panier abandonné Viva. Elles ont donc été classées automatiquement dans l'onglet « Paniers abandonnés » (et risquaient d'être purgées).

## Correctifs

1. **Les commandes créées à la main sont identifiées comme telles.** À la création manuelle, le mode de règlement est enregistré comme paiement physique (espèces / TPE / remise en main propre) au lieu de « carte en ligne ». Elles restent donc toujours dans l'onglet « Commandes », même en attente d'encaissement.
2. **Choix du règlement à la création.** Petit sélecteur dans le formulaire de commande manuelle : « Physique (espèces/TPE) », « Virement » ou « Déjà payé » — ce dernier crée directement la commande en payée.
3. **Un panier n'est abandonné que s'il vient vraiment d'un tunnel Viva.** La détection s'appuie en plus sur la présence d'un code de paiement Viva, pour qu'une commande sans passage par le paiement en ligne ne soit jamais classée comme abandonnée.
4. **Récupération des 2 commandes existantes.** Elles sont repassées en mode de règlement physique pour réapparaître immédiatement dans la liste principale (statut « En préparation », paiement à valider par toi).
5. **Badge clair** dans la liste : « Manuelle » à côté du mode de règlement, pour distinguer d'un coup d'œil les commandes saisies en boutique.

## Détails techniques

- `src/components/admin/ManualOrderCreator.tsx` : ajout de `payment_method` (`physical` / `transfer`) et `payment_status` (`unpaid` / `paid`) selon le sélecteur ; `order_channel` reste `b2c`.
- `src/components/admin/OrdersSection.tsx` : `isAbandoned` = `payment_status !== 'paid'` **et** `payment_method === 'online'` **et** `viva_order_code` non nul ; badge « Manuelle ».
- Mise à jour de données : les 2 commandes du 13/08 passent en `payment_method = 'physical'`.
