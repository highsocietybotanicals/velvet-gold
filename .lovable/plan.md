# Espace Commercial (4e espace du site)

Le site aura 4 univers : Site public · Espace Pro · Admin · **Espace Commercial** (`/commercial`), réservé aux commerciaux terrain freelance.

## Accès
- Nouveau rôle `commercial` (ajouté à l'énum des rôles), attribué depuis l'admin.
- Route `/commercial` protégée : accès si rôle `commercial` ou admin. Aucun accès à l'admin, à la comptabilité, aux coûts d'achat ni à la rentabilité HSB.
- Lien d'entrée dans le header (desktop + menu mobile) visible uniquement pour les comptes concernés.

## Contenu de l'espace

**1. Catalogue & argumentaire**
- Toutes les variétés (Classique, Force Noire, Nectar Divin, Exotique) avec photo, %CBD, terpènes, goûts.
- Prix pro HT par format (1 / 2,5 / 5 / 10 g) + prix public conseillé et gain du buraliste. **Aucun coût d'achat HSB affiché.**
- Fiche "argumentaire" par gamme : points forts, packaging (Boveda 62 %, briquet + slim offerts), tests laboratoire, légalité, réponses aux objections classiques (prix, concurrence, stock, rotation).

**2. Suivi prospects (CRM)**
- Liste des tabacs/magasins démarchés : nom, ville, contact, téléphone, email, statut (à visiter / visité / échantillon remis / en négociation / signé / refusé), date de prochaine relance, notes.
- Chaque commercial ne voit que ses propres prospects ; l'admin voit tout.
- Filtres par statut + rappel des relances du jour.

**3. Commissions**
- Taux par défaut **10 % du CA HT** généré (modifiable par commercial depuis l'admin).
- Tableau : commandes pro rattachées au commercial, CA HT, commission due, statut de versement (à payer / payée), totaux par mois.
- Rattachement d'une commande à un commercial fait par l'admin (ou via le partenaire signé par ce commercial).

**4. Documents à envoyer**
- Téléchargement des PDF : grille tarifaire pro, catalogue, analyses labo, fiche de présentation de la marque.
- Bouton de copie des textes de prospection (email + message court WhatsApp).

## Côté admin
Nouvelle page "Commerciaux" : créer/désactiver un commercial, fixer sa commission, voir tous les prospects, rattacher des commandes, marquer les commissions payées.

## Ligne éditoriale
Suppression du vocabulaire "niche moléculaire" partout dans les textes commerciaux : on parle uniquement de **CBD haut de gamme, indoor, testé en laboratoire**. L'annonce Indeed sera réécrite dans ce sens (secteur Abbaretz 44170, 50 km, freelance à la commission, échantillons remis en main propre).

## Détails techniques
- Migration : valeur `commercial` dans `app_role` ; tables `sales_reps` (taux de commission, zone), `sales_prospects` (prospects par commercial), `sales_commissions` (commande ↔ commercial, montant, statut). RLS + GRANT : le commercial lit/écrit ses lignes (`auth.uid()`), l'admin tout via `is_admin()`.
- Nouveau `CommercialLayout` + pages (`Catalogue`, `Prospects`, `Commissions`, `Documents`) sur le modèle de `ProLayout`/`AdminLayout`.
- Réutilisation de `src/lib/proPricing.ts` en mode "prix pro + gain revendeur uniquement" (pas de coûts internes).
