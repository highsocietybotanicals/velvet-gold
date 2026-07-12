
# Réorganisation de l'admin, gestion produits en base, et export comptable

## 1. Nouvelle architecture de l'admin (sidebar + sous-routes)

Passage de la page `/admin` monolithique à un layout avec sidebar et sous-pages.

### Routes
```
/admin                    → redirige vers /admin/tableau-de-bord
/admin/tableau-de-bord    → StatsManager
/admin/commandes          → liste + gestion des commandes + sync Colissimo
/admin/produits           → NOUVEAU : catalogue produits (CRUD complet)
/admin/prix               → PriceManagement (édition rapide des prix)
/admin/pro                → demandes Pro, validation TVA, facturation Pro/dépôt
/admin/marketing          → codes promo, réseaux sociaux, avis
/admin/logistique         → commande manuelle, frais kilométriques
/admin/comptabilite       → NOUVEAU : export factures + récap TVA
```

### Layout
- Nouveau `src/pages/admin/AdminLayout.tsx` : `SidebarProvider` + `AdminSidebar` + `<Outlet />`, guard admin (redirect si non-admin).
- Nouveau `src/components/admin/AdminSidebar.tsx` : sidebar collapsible avec icônes (`LayoutDashboard`, `Package`, `Euro`, `Users`, `Megaphone`, `Truck`, `Calculator`).
- Route parent `/admin/*` dans `AnimatedRoutes.tsx` monte `AdminLayout` avec des routes enfants.
- Chaque sous-page (`src/pages/admin/DashboardPage.tsx`, `OrdersPage.tsx`, …) réutilise les composants existants (`StatsManager`, `PriceManagement`, `PromoCodeManager`, `ProInvoicingManager`, `ManualOrderCreator`, `MileageManager`, `SocialMediaManager`, la table de commandes extraite de `AdminPage.tsx`).
- La table des commandes + `OrderRow` sont déplacées dans `src/components/admin/OrdersTable.tsx` (extraction 1:1, aucune modif de logique).
- L'ancien `src/pages/AdminPage.tsx` est supprimé après migration.

## 2. Gestion complète des produits en base

### Migration DB (table `products`)
Ajout de colonnes pour piloter le catalogue depuis la DB :
- `subtitle`, `badge`, `description` (text)
- `cbd_percentage` (text)
- `image_url` (text) → stockage bucket `product-images`
- `price_group` (text, 'A'|'B')
- `is_force_noire` (bool, default false)
- `mood` (text)
- `intention_match` (text[])
- `taste_match` (text[])
- `terpenes` (jsonb : `{boise, fruite, epice, terreux}`)
- `pro_price` (numeric, nullable) — remonté depuis `pro_prices` OU maintenu séparé (voir Détails techniques)
- `display_order` (int, default 0) pour tri
- policies RLS : lecture publique conservée, écriture réservée aux admins.
- Nouveau bucket Storage public `product-images` avec policies admin-only pour l'upload.

### Page `/admin/produits`
- Table listant tous les produits (fleurs + résines) avec vignette, nom, groupe, statut actif.
- Bouton "Nouveau produit" → dialog `ProductForm`.
- Bouton "Éditer" par ligne → même dialog en mode édition.
- Bouton "Supprimer" (soft delete via `is_active=false` recommandé, avec confirm alert-dialog pour la suppression dure).

### Composant `ProductForm` (dialog)
Formulaire complet avec :
- ID (slug auto depuis le nom en création, non éditable ensuite)
- Nom, sous-titre, badge, description
- Catégorie (fleur/résine)
- Groupe de prix (A/B)
- Prix TTC/g, Prix Pro HT/g
- % CBD (texte libre), Mood
- Upload image (drag & drop) → Supabase Storage
- Toggle "Force Noire" (isForceNoire)
- Multi-select intentions (`detente`, `creativite`, `sommeil`, `energie`)
- Multi-select goûts (`boise`, `fruite`, `floral`)
- 4 sliders 0-100 pour terpènes
- Toggle actif
- Ordre d'affichage

### Refonte du front pour lire la DB
- Nouveau hook `useCatalogProducts()` : fetch depuis `products` (tous champs), map vers le type `Product` existant.
- `src/data/products.ts` devient une couche compatibilité : réexporte les types + expose des helpers `getFlowers()`, `getResins()`, `getFeatured()`, `getForceNoire()`, `buildRecommendationMatrix()` qui prennent en entrée la liste renvoyée par le hook.
- Migration one-shot (via `supabase--insert`) qui insère les 8 produits existants avec leurs images actuelles (URL Storage après upload manuel des images de `src/assets/`) — les IDs conservent les slugs actuels pour ne pas casser les commandes historiques.
- Tous les composants consommateurs (`ProductSection`, `SommelierSection`, `SampleSelectionPage`, `ProductPage`, `CataloguePage`, `SommelierChatbot` context, matrices de reco) passent par le hook. Aucune logique métier (prix dynamique, samples, gifts, Force Noire) n'est modifiée — seule la source des données change.
- `PriceManagement` continue de fonctionner (mêmes colonnes `price`, `is_active`).

## 3. Comptabilité — Export factures & récap TVA

### Page `/admin/comptabilite`
- Sélecteur de plage de dates (2 shadcn DatePicker : "Du" / "Au"), presets rapides (Ce mois, Mois dernier, Trimestre en cours, Année en cours).
- 4 KPI cards sur la période : Nb factures, Total HT, Total TVA (20%), Total TTC.
- Filtre "Type" : Toutes / Site (orders) / Pro (pro_invoices).
- Tableau ligne par ligne trié par date : `N° facture | Date | Type | Client | HT | TVA | TTC | PDF`.
- Sous-totaux automatiques par mois si la plage couvre > 1 mois.
- Ligne "TOTAL" en bas figée : HT / TVA / TTC.
- Boutons : "Télécharger PDF" et "Exporter CSV".

### Sources de données
- `orders` : `payment_status = 'paid'` AND `status != 'cancelled'` AND `created_at` dans la plage. HT = `total_amount / 1.2`, TVA = TTC − HT, numéro = `display_order_number` préfixé `FA-`.
- `pro_invoices` : `status = 'paid'` (ou tous selon toggle) AND `issued_at` dans la plage. HT depuis `total_invoiced_ht`, TTC depuis `total_invoiced_ttc`, numéro = `invoice_number`.
- Fusion + tri par date, mapping vers un type `AccountingLine` unifié.

### PDF récap (`accountingPdf.ts`)
Généré côté client avec jsPDF + jspdf-autotable :
- En-tête HSB (branding gold), période, date d'édition.
- Tableau détaillé de toutes les lignes avec sous-totaux mensuels si applicable.
- Bloc final récap TVA : Total HT, TVA 20%, Total TTC, nb factures.
- Mentions légales SIRET / TVA intra en pied de page.

### Export CSV
Fichier `comptabilite_YYYY-MM-DD_YYYY-MM-DD.csv` avec colonnes : `numero;date;type;client;ht;tva;ttc;statut`, séparateur `;` pour Excel FR.

## Détails techniques

- **`pro_price`** : la table `pro_prices` reste la source de vérité (schéma existant, RLS déjà en place). Le `ProductForm` lit/écrit via les mêmes hooks que `PriceManagement` (upsert/delete dans `pro_prices`). Pas de duplication de colonne dans `products`.
- **Grants** : la migration ajoute uniquement des colonnes à une table existante, pas besoin de nouveaux GRANT. Le nouveau bucket `product-images` reçoit policies : SELECT public, INSERT/UPDATE/DELETE via `is_admin()`.
- **Sidebar** : `collapsible="icon"`, `SidebarTrigger` dans un header interne au layout admin. `NavLink` avec `isActive` pour surligner la route courante.
- **Rétrocompatibilité produits** : les IDs existants (`platinum-og`, `911-og-indoor`, …) sont conservés pour ne pas invalider les `order_items.product_id` déjà enregistrés.
- **Images** : les 8 images actuelles de `src/assets/flowers/` et `src/assets/resins/` sont uploadées dans le bucket `product-images` lors du seed. Les nouveaux produits utilisent l'uploader du form.
- **PDF comptable** : réutilise jsPDF déjà installé (utilisé pour les étiquettes produits).
- Aucun changement des Edge Functions existantes (`generate-pro-invoice`, etc.). Aucun changement de la logique de calcul TVA.

## Fichiers créés / modifiés

**Créés :**
- `src/pages/admin/AdminLayout.tsx`
- `src/pages/admin/DashboardPage.tsx`, `OrdersPage.tsx`, `ProductsPage.tsx`, `PricesPage.tsx`, `ProPage.tsx`, `MarketingPage.tsx`, `LogisticsPage.tsx`, `AccountingPage.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin/OrdersTable.tsx` (extraction)
- `src/components/admin/ProductForm.tsx`
- `src/components/admin/ProductsManager.tsx`
- `src/components/admin/AccountingManager.tsx`
- `src/hooks/useCatalogProducts.ts`
- `src/lib/accountingPdf.ts`
- Migration SQL (ajout colonnes `products` + bucket `product-images` + policies)

**Modifiés :**
- `src/components/AnimatedRoutes.tsx` (routes `/admin/*`)
- `src/data/products.ts` (bascule vers helpers dynamiques)
- Consommateurs de `products.ts` (`ProductSection`, `SommelierSection`, `CataloguePage`, `SampleSelectionPage`, `ProductPage`, chatbot context) : lecture via `useCatalogProducts`
- `src/pages/AdminPage.tsx` : supprimé

## Hors périmètre

- Pas de refonte visuelle du front public.
- Pas de modification du flow checkout, paiement, ou Colissimo.
- Pas de refonte des Edge Functions de facturation.
