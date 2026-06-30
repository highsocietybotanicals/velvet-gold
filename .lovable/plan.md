
## Réponse à ta question fiscale (avant de coder)

Tu vends du CBD via un buraliste. Deux modèles existent en droit français — il faut **choisir** car la TVA ne s'applique pas pareil :

### Modèle A — Achat-revente (le plus simple et le plus courant pour le tabac)
- Le buraliste **t'achète** la marchandise à **70% du prix de vente public, TTC**.
- Tu lui émets une facture : **HT = 70% PV / 1,20** + **TVA 20%** = **70% PV TTC**.
- Tu reverses la TVA sur ce 70% à l'État.
- Lui revend à 100% au client final, encaisse sa marge de 30%, et collecte/reverse sa propre TVA sur les 100%.
- Avantage : simple, le buraliste est ton client, pas de mandat à gérer.

### Modèle B — Dépôt-vente (mandat / contrat de commission)
- La marchandise **reste à toi** jusqu'à la vente finale.
- Tu factures **le client final** à 100% TTC (TVA 20% sur 100%).
- Le buraliste t'émet **sa** facture de commission de 30% (avec TVA 20% s'il y est assujetti, ce qui est presque toujours le cas).
- Plus lourd administrativement, ticket de caisse au nom du commettant, etc.

**Recommandation** : pars sur le **Modèle A (achat-revente à 70% TTC)**. C'est celui qui correspond au mot "facture pour le tabac" que tu emploies, et c'est ce que pratiquent 99% des dépôts CBD en buraliste. Le module ci-dessous est conçu pour ce modèle (avec une case "commission %" paramétrable si tu changes d'avis).

**Réponse directe à ta question** : tu lui factures **70% TTC** (donc 70%/1,20 HT + 20% TVA). C'est **toi qui collectes et reverses la TVA** sur ces 70%. Lui s'occupera de la TVA sur les 30% restants côté client final.

---

## Plan technique — Module "Pro / Dépôt-vente" dans l'admin

### 1. Base de données (migration)

**Table `pro_partners`** (les tabacs / revendeurs Pro)
- `name`, `siret`, `vat_number`, `address_line1`, `postal_code`, `city`, `email`, `phone`
- `commission_percent` (défaut 30) → le partenaire prend 30%, tu factures 70%
- `notes`, `is_active`

**Table `pro_deposits`** (lignes de vente / dépôt par partenaire)
- `partner_id`, `product_name`, `product_id` (nullable), `weight_grams` ou `quantity`
- `retail_price_ttc` (PV public conseillé en boutique)
- `sold_at` (date)
- `invoice_id` (nullable — rempli quand facturé)
- `notes`

**Table `pro_invoices`** (factures émises aux tabacs)
- `partner_id`, `invoice_number` (format `FA-PRO-XXXXXX` via trigger)
- `issued_at`, `due_date`, `status` (draft, sent, paid)
- `total_retail_ttc` (somme PV public)
- `total_invoiced_ht`, `total_vat`, `total_invoiced_ttc` (= 70% TTC)
- `commission_percent` (snapshot du %)
- `pdf_url`, `paid_at`

RLS : admin only sur les trois tables. GRANT à `authenticated` + `service_role`.

### 2. UI Admin — nouveau composant `ProInvoicingManager.tsx`

Monté dans `AdminPage.tsx` à côté de `StatsManager`. 3 onglets internes :

**Onglet "Partenaires"** : CRUD tabacs (nom, SIRET, TVA, adresse, %commission, contact).

**Onglet "Ventes en dépôt"** :
- Sélection du partenaire
- Ajout de ligne : produit (autocomplete depuis `products`), poids/quantité, PV public TTC, date
- Tableau filtrable par partenaire + statut (facturée / non facturée)
- Bouton "Générer facture" sur les lignes non facturées sélectionnées → crée `pro_invoices` + PDF

**Onglet "Factures & Commissions"** :
- Liste des factures émises (n°, partenaire, date, montant TTC, statut)
- Actions : Voir PDF, Marquer payée, Renvoyer par email
- KPIs par partenaire : CA total dépôt, à facturer, facturé, encaissé
- Export CSV global

### 3. Edge function `generate-pro-invoice`

Génère un PDF jsPDF (même style que `generate-invoice-pdf` : Art-Déco, gold/noir) avec :
- En-tête High Society Botanicals (SIRET, TVA intra)
- Destinataire = partenaire (nom, SIRET, TVA, adresse)
- Tableau des lignes : produit, qté, PV public TTC, **PV cédé HT** (= PV/1,20 × 70%), **TVA 20%**, **Total TTC** (= PV × 70%)
- Récap : Total HT, TVA 20%, **Total TTC à régler**
- Mention légale "TVA acquittée sur les débits — Contrat de revente"
- Upload bucket `invoices/pro/`

Auth : service-role ou admin via `user_roles` (même pattern que les autres fonctions).

### 4. Calculs (au cœur du module)

Pour chaque ligne :
```
ttc_facture  = PV_public_TTC × commission_inversee   // ex: 100 × 0,70 = 70
ht_facture   = ttc_facture / 1,20                    // 58,33
tva          = ttc_facture - ht_facture              // 11,67
marge_tabac  = PV_public_TTC × commission_percent/100 // 30 (ce qu'il garde)
```

### 5. Hors scope (pour cette itération)
- Pas de portail Pro côté tabac (ils ne se connectent pas eux-mêmes)
- Pas d'intégration paiement automatique
- Pas de gestion de stock physique en dépôt (ajoutable plus tard)

---

## Livrables
- 1 migration (3 tables + RLS + GRANT + trigger n° facture)
- 1 edge function `generate-pro-invoice`
- 1 composant `src/components/admin/ProInvoicingManager.tsx` (3 onglets)
- Intégration dans `AdminPage.tsx`

**Confirme le Modèle A (achat-revente 70% TTC) et je construis. Si tu préfères le Modèle B (dépôt-vente strict avec facture au client final + facture de commission reçue), dis-le, j'adapte la structure des factures.**
