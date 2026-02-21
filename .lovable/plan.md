

# Création des pages légales et informations

## Ce qui sera fait

Création de 4 nouvelles pages avec le contenu juridique/informatif adapté à High Society Botanicals, et mise à jour du footer pour que les liens fonctionnent.

### 1. Mentions Légales (`/mentions-legales`)
- Raison sociale : SASU High Society Botanicals, capital 1EUR, Paris
- Hébergeur, directeur de publication, coordonnées
- Propriété intellectuelle

### 2. Politique de Confidentialité (`/confidentialite`)
- Collecte de données (compte, commandes)
- Utilisation des données, cookies
- Droits RGPD (accès, rectification, suppression)

### 3. Conditions Générales de Vente (`/cgv`)
- Objet, prix, commande, paiement
- Droit de rétractation (14 jours)
- Responsabilité, litiges

### 4. Livraison et Retours (`/livraison-retours`)
- Modes : envoi postal standard, remise en main propre (rayon 100km autour de Puceul 44170, réservé aux Pros ou commandes >= 100g)
- Délais, frais, suivi
- Politique de retour

## Modifications techniques

### Fichiers créés (4 nouvelles pages)
- `src/pages/MentionsLegalesPage.tsx`
- `src/pages/ConfidentialitePage.tsx`
- `src/pages/CGVPage.tsx`
- `src/pages/LivraisonRetoursPage.tsx`

Chaque page reprendra le design existant (Header, Footer, fond sombre, typographie luxe, animations framer-motion).

### Fichiers modifiés
- **`src/components/Footer.tsx`** : Remplacer les `<a href="#">` par des `<Link to="/mentions-legales">`, `/confidentialite`, `/cgv`, `/livraison-retours`
- **`src/components/AnimatedRoutes.tsx`** : Ajouter les 4 nouvelles routes

### Style
Les pages auront un format texte structuré avec titres dorés, sections séparées, et le même aspect premium que le reste du site.
