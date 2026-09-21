# Bons de commande papier + fiche « Nouveau client pro »

Deux documents A4 imprimables, à remplir au stylo pendant la visite, téléchargeables depuis l'espace commercial (onglet Documents) et depuis l'administration.

## 1. Bon de commande papier (A4)

- En-tête : logo/nom High Society Botanicals, SIRET, TVA intracom, site, e-mail de commande.
- Cadre « Client » à remplir : raison sociale, enseigne, SIRET, TVA intracom, adresse, code postal, ville, nom du contact, téléphone, e-mail.
- Cadre « Commande » : n° de bon (vide), date, nom du commercial, mode de livraison (cases à cocher : Colissimo domicile / Point relais / Remise en main propre), mode de paiement (cases : en ligne / virement à 30 jours).
- Tableau des lignes avec **les variétés en vente déjà imprimées** (une ligne par variété), colonnes vides à remplir : unités 1 g, 2,5 g, 5 g, 10 g, total grammes, prix €/g, total HT. Plus 4 lignes vierges pour accessoires ou nouveautés.
- Rappel de la dégressivité volume (paliers ≤200 g / >200 g / >600 g / >1 kg) imprimé en pied de tableau, pour que le commercial applique le bon €/g.
- Totaux à remplir : total grammes, total HT, TVA 20 %, total TTC, franco de port éventuel.
- Mentions : cadeaux inclus dès 10 g (briquet + feuilles), produits < 0,3 % THC, analyses laboratoire disponibles.
- Deux cadres signature : « Le client (cachet et signature) » et « Le commercial ».

## 2. Fiche « Nouveau client pro » (A4)

Reprend exactement les informations nécessaires pour créer ensuite le compte pro en back-office, dans le même ordre que le formulaire en ligne :

- Raison sociale, enseigne commerciale, type d'établissement (buraliste / CBD shop / autre).
- SIRET, numéro de TVA intracommunautaire.
- Adresse, complément, code postal, ville, pays.
- Nom et prénom du contact, fonction, téléphone, e-mail (e-mail = identifiant de connexion, à écrire très lisiblement en cases).
- Commission / conditions négociées, commercial référent, date de signature.
- Horaires d'ouverture et jour de réassort préféré.
- Case « Accepte de recevoir ses accès à l'espace Pro par e-mail » + signature du client.
- Encadré « Réservé HSB » : compte créé le ___, validé par ___, TVA vérifiée ☐.

## Détails techniques

- Nouveau fichier `src/lib/proFormsPdf.ts` : `generateProOrderForm(products)` et `generateProClientForm()` en jsPDF A4 (même approche que `src/lib/labelPdf.ts` / `accountingPdf.ts`), tracé en niveaux de gris pour une impression noir et blanc nette.
- Le bon de commande lit les variétés actives via `useCatalogProducts` (donc il suit le catalogue automatiquement) ; aucune donnée figée en dur.
- `src/pages/commercial/CommercialDocumentsPage.tsx` : deux boutons « Bon de commande (PDF à imprimer) » et « Fiche nouveau client pro (PDF à imprimer) » ajoutés à la liste des documents.
- Même paire de boutons ajoutée dans `src/pages/admin/ProPage.tsx` pour que l'administration puisse réimprimer les liasses.
- Aucun changement de prix, de stock, de base de données ni de logique de commande.
