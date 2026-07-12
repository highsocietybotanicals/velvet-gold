## Objectif
Corriger la page /admin/comptabilité pour qu'elle affiche et exporte **toutes** les factures (site + pro), pas seulement les payées non annulées.

## Constat
Actuellement le tableau exclut trop de lignes :
- Commandes site : uniquement `payment_status='paid'` et `status!='cancelled'`
- Factures Pro : uniquement `status!='cancelled'`

Résultat : impayées, annulées, et pro en attente sont invisibles → tableau souvent vide.

## Changements

### 1. Élargir la requête (`AccountingManager.tsx`)
- **Commandes site** : retirer les filtres `payment_status` et `status`. Récupérer toutes les commandes de la période. Ajouter les champs `payment_status` et `status` au SELECT.
- **Factures Pro** : retirer le filtre `status!='cancelled'`. Récupérer toutes les pro_invoices.

### 2. Nouveau filtre "Statut" dans l'UI
Ajouter un `Select` à côté du filtre Type :
- **Facturable** (défaut) : commandes payées non-annulées + pro_invoices non-annulées → comportement comptable réel (CA net)
- **Payées uniquement** : orders `paid` non-annulées + pro_invoices `paid`
- **Toutes** : tout, y compris impayées/annulées (pour audit)

Le filtrage se fait côté client sur les données déjà chargées.

### 3. Colonne "Statut" visible
- Ajouter une colonne Statut dans le tableau (badge coloré : payée=vert, impayée=orange, annulée=rouge, en attente=gris).
- Les lignes annulées sont affichées barrées et **exclues des totaux/KPI** sauf en mode "Toutes".

### 4. KPI et sous-totaux
- Les 4 KPI (Nb, HT, TVA, TTC) et sous-totaux mensuels utilisent les lignes filtrées visibles.
- Les exports PDF et CSV utilisent aussi les lignes filtrées visibles (identique à l'affichage).

### 5. PDF/CSV (`accountingPdf.ts`)
- Ajouter la colonne Statut au tableau PDF et à l'export CSV.
- Ajuster largeurs de colonnes pour rester en A4.
- Aucun changement du bloc TVA final.

## Hors périmètre
- Pas de changement de schéma DB.
- Pas de changement aux Edge Functions ou à la génération de factures.
- Pas de changement au calcul TVA (toujours HT = TTC/1.2).
