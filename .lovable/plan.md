
# Roadmap d'optimisation — High Society Botanicals

Trois priorités identifiées : **abandons panier**, **tâches manuelles admin**, **manque de visibilité chiffres**. Voici un plan en 3 phases pour attaquer le tout sans tout casser, du plus rentable au plus structurel.

---

## Phase 1 — Récupérer les paniers abandonnés (impact CA direct)

**Objectif** : transformer les commandes "unpaid/pending" qui n'aboutissent pas en ventes.

1. **Email de relance panier abandonné**
   - Edge function `send-abandoned-cart-email` déclenchée par cron 1×/h
   - Cible : commandes `payment_status = 'unpaid'` créées il y a 1h à 24h (email connu via `guest_email` ou `profiles.email`)
   - Contenu : récap panier + bouton "Reprendre ma commande" + code promo `RETOUR10` (−10 %, expire 48 h, usage unique par email)
   - Anti-spam : 1 seul envoi par commande (champ `abandoned_email_sent_at`)

2. **Apple Pay / Google Pay sur Viva Wallet**
   - Activer dans le dashboard Viva (déjà supporté par Smart Checkout)
   - Ajouter `paymentMethod=22` ou wallet dans l'URL checkout selon device
   - Gros levier mobile : −30 à −50 % d'abandons mobile en moyenne

3. **Checkout : indicateur de progression visuel**
   - 3 étapes claires dans CartDrawer : Livraison → Coordonnées → Paiement
   - Bouton "Payer" toujours visible, total figé en haut
   - Trust badges (CB sécurisée, Viva, livraison discrète) juste sous le bouton

4. **Sauvegarde email avant paiement**
   - Dès que l'email est saisi (avant clic "Payer"), `upsert` dans `contacts` (déjà fait pour la welcome popup, à étendre au checkout)
   - Permet la relance même si le paiement n'est jamais lancé

---

## Phase 2 — Automatiser le back-office (gain de temps quotidien)

**Objectif** : supprimer les actions répétitives.

1. **Génération en lot des étiquettes Colissimo**
   - Bouton "Imprimer toutes les étiquettes du jour" dans Admin
   - Sélection multi-commandes (checkbox) → 1 PDF combiné (jsPDF merge)
   - Marquer auto les commandes en `shipped` après génération

2. **Auto-cancel des paniers abandonnés > 7 jours**
   - Cron quotidien : `UPDATE orders SET status='cancelled'` pour `payment_status='unpaid' AND created_at < now() - 7 days`
   - Évite la pollution dans l'admin

3. **Alertes Telegram automatiques** (canal déjà connecté)
   - Nouvelle commande payée → ping instantané (montant + N° + livraison)
   - Stock faible (si tu ajoutes un champ `stock_grams` sur `products`)
   - Échec paiement Viva → ping pour relance manuelle

4. **Demande d'avis automatique J+7 après livraison**
   - Cron quotidien qui détecte les commandes `delivered` depuis 7 jours sans avis
   - Email avec lien direct vers la page produit + bouton "Laisser un avis"

5. **Sync Colissimo automatique**
   - Cron 3×/jour au lieu du bouton manuel (matin, midi, soir)
   - Update auto du statut `in_delivery` → `delivered`

---

## Phase 3 — Tableau de bord chiffres (pilotage)

**Objectif** : voir d'un coup d'œil la santé du business.

Nouvel onglet Admin "**Statistiques**" avec :

1. **KPIs du mois en cours**
   - CA TTC, CA HT, nombre de commandes, panier moyen, marge brute estimée
   - Comparaison vs mois précédent (delta en %)

2. **Graphiques (recharts, déjà installé)**
   - CA quotidien des 30 derniers jours (line chart)
   - Top 5 produits (bar chart : grammes vendus + CA)
   - Répartition par mode de livraison (donut)
   - Nouveaux clients vs récurrents

3. **Tableaux exploitables**
   - Top 10 clients (CA cumulé) → cibles VIP
   - Clients dormants (pas de commande > 60 j) → cible relance
   - Codes promo (utilisation, CA généré, taux conversion)

4. **Export CSV global** mensuel pour la compta (commandes + items + TVA)

---

## Détails techniques

- **Base** : 3 nouvelles colonnes sur `orders` (`abandoned_email_sent_at`, `review_request_sent_at`), 1 nouvelle table `dashboard_metrics_cache` optionnelle pour pré-calculer les stats lourdes.
- **Edge functions nouvelles** : `send-abandoned-cart-email`, `send-review-request`, `auto-cancel-orders`, `notify-telegram-event`, `dashboard-stats`.
- **Cron** : via `pg_cron` + `pg_net` (extensions à activer si pas déjà fait), 4 jobs planifiés.
- **Frontend** : nouvel onglet `<StatsManager />` dans `AdminPage`, refonte légère `CartDrawer` (stepper + trust badges), bouton multi-sélection dans le tableau commandes.
- **Aucune refonte design** : on garde l'identité Gilded Botanica, juste des ajouts ciblés.

---

## Ordre recommandé

Phase 1 d'abord (CA immédiat) → Phase 2 (temps gagné) → Phase 3 (vision long terme). Chaque phase est livrable indépendamment en 1 itération.

Tu veux qu'on commence par **Phase 1 complète**, ou tu préfères piocher juste 1-2 items prioritaires (ex: relance panier + Apple Pay) ?
