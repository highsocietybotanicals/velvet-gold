

# Intégration Colissimo Pro -- Etiquettes automatiques + Suivi colis

## Ce qu'on va construire

Quand tu cliques sur un bouton "Colissimo" à côté d'une commande dans l'admin, le système appelle l'API Colissimo, génère la vraie étiquette PDF avec le numéro de suivi, et l'ouvre pour impression. Le client reçoit automatiquement le lien de suivi La Poste par email.

## Prérequis

Tu as besoin de :
- **Numéro de contrat Colissimo** (6 chiffres, tu l'as)
- **Mot de passe** (le même que celui de connexion à colissimo.fr/entreprise -- appelle le 3634 si tu l'as oublié ou demande une réinitialisation dans ton espace client)

D'après la documentation officielle, le mot de passe API est **le même que ton mot de passe de connexion** à ton espace client Colissimo. Il n'y a pas de "mot de passe API" séparé. Si tu te connectes sur colissimo.fr/entreprise, c'est ce mot de passe-là qu'on utilise.

## Plan technique

### 1. Stocker les credentials (secrets backend)
- `COLISSIMO_CONTRACT_NUMBER` -- ton numéro de contrat 6 chiffres
- `COLISSIMO_PASSWORD` -- ton mot de passe espace client

### 2. Migration SQL
Ajouter sur la table `orders` :
- `tracking_number TEXT` -- numéro de colis Colissimo (ex: 6A12345678901)
- `tracking_url TEXT` -- lien La Poste auto-généré

### 3. Edge Function `generate-colissimo-label`
Appelle l'API REST Colissimo :
- **URL** : `https://ws.colissimo.fr/sls-ws/SlsServiceWSRest/2.0/generateLabel`
- **Méthode** : POST multipart/form-data (le REST utilise un champ JSON dans un formulaire)
- **Authentification** : `contractNumber` + `password` dans le body JSON
- **Produit** : `DOM` (Colissimo Domicile sans signature, code 6A) pour les livraisons France
- **Format étiquette** : `PDF_10x15_300dpi` (format standard imprimante bureau)
- **Expéditeur** : High Society Botanicals, 44390 Puceul, FR
- **Destinataire** : extrait de la commande (nom, adresse, code postal, ville, téléphone, email)
- **Poids** : calculé depuis `total_flower_weight` de la commande (minimum 0.1kg)

La réponse contient :
- Le PDF de l'étiquette en pièce jointe MTOM/XOP (binaire)
- Le `parcelNumber` (numéro de suivi)

L'Edge Function :
1. Parse l'adresse de livraison (séparée en lignes)
2. Appelle l'API Colissimo
3. Extrait le PDF et le numéro de colis de la réponse multipart
4. Sauvegarde `tracking_number` et `tracking_url` dans la commande
5. Passe le statut à "shipped"
6. Retourne le PDF en base64

### 4. Admin -- Bouton Colissimo dans `ShippingLabel.tsx`
- Remplace l'étiquette maison par un bouton "Générer étiquette Colissimo"
- Au clic : appelle l'Edge Function, ouvre le PDF dans un nouvel onglet pour impression
- Si l'étiquette existe déjà : affiche le numéro de suivi + bouton réimprimer
- L'interface `AdminOrder` dans `useAdmin.ts` sera étendue avec `tracking_number` et `tracking_url`

### 5. Admin -- Ordre dans `AdminPage.tsx`
- Importer et afficher `ShippingLabel` dans la colonne livraison pour les commandes postales
- Afficher le numéro de suivi quand il existe

### 6. Client -- Suivi dans `OrderTracking.tsx`
- Quand `tracking_number` existe, afficher un lien cliquable :
  `https://www.laposte.fr/outils/suivre-vos-envois?code={tracking_number}`

### 7. Email de notification `send-status-update-email`
- Quand le statut passe à "shipped" et qu'un `tracking_number` existe :
  ajouter dans l'email le numéro de suivi + bouton/lien vers La Poste

## Fichiers impactés
- `supabase/functions/generate-colissimo-label/index.ts` (nouveau)
- `supabase/config.toml` (ajouter la config de la nouvelle fonction)
- `src/components/admin/ShippingLabel.tsx` (refonte)
- `src/hooks/useAdmin.ts` (étendre AdminOrder + mutation Colissimo)
- `src/pages/AdminPage.tsx` (intégrer ShippingLabel)
- `src/components/OrderTracking.tsx` (lien suivi)
- `supabase/functions/send-status-update-email/index.ts` (tracking dans l'email)
- Migration SQL pour `tracking_number` / `tracking_url`

## Note sur l'API Colissimo REST
L'API REST utilise un POST multipart : un champ `generateLabelRequest` contenant le JSON, et la réponse est multipart MIME avec le JSON de résultat + le PDF en pièce jointe binaire. L'Edge Function devra parser cette réponse multipart pour extraire le PDF.

