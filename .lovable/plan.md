# Plusieurs analyses labo par variété

Aujourd'hui chaque variété ne peut recevoir qu'un seul PDF d'analyse : déposer un nouveau fichier remplace l'ancien. Objectif : pouvoir en stocker plusieurs (par lot, par date, par molécule) et les ouvrir en un clic.

## Ce que ça change côté administration (page Produits)

- La colonne "Analyse labo" affiche la liste des documents déjà déposés pour la variété, du plus récent au plus ancien.
- Un bouton "Ajouter un PDF" permet de déposer autant de fichiers que voulu (sélection multiple possible).
- Chaque document a son propre bouton d'ouverture et sa propre croix de suppression.
- Un nom lisible est proposé automatiquement (date du dépôt) et reste modifiable.

## Ce que ça change côté commerciaux (catalogue)

- Si la variété a un seul document : le bouton "Analyse labo" s'ouvre directement comme aujourd'hui.
- Si elle en a plusieurs : le bouton ouvre une courte liste (nom + date) où l'on choisit le document à consulter.
- Aucun document : le texte "Analyse à venir" reste affiché.

Les partenaires pro validés gardent le même accès en lecture que les commerciaux.

## Détails techniques

- Nouvelle table `public.product_lab_reports` : `id`, `product_id` (référence `products.id`, suppression en cascade), `label`, `storage_path`, `created_at`. GRANT `select` à `authenticated`, `all` à `service_role`, RLS : lecture pour admin / commercial / pro validé, écriture et suppression réservées aux admins — mêmes règles que les politiques actuelles du bucket `lab-reports`.
- Le bucket privé `lab-reports` est conservé, chemins `"{product_id}/{timestamp}-{nom}.pdf"`, liens signés 5 minutes inchangés.
- Migration de reprise : chaque `products.lab_report_path` non nul devient une ligne de la nouvelle table. La colonne est conservée (elle pointera sur le document le plus récent) pour ne rien casser, mais n'est plus la source de vérité.
- `src/hooks/useLabReports.ts` : `useLabReportPaths` devient `useLabReports` renvoyant `Record<productId, LabReport[]>`; `useLabReportAdmin` gère `upload(productId, files[])` et `remove(reportId, path)`.
- `ProductsManager.tsx` : liste + input `multiple`. `CommercialCataloguePage.tsx` : bouton direct ou petit menu déroulant selon le nombre de documents.
