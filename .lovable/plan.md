

# Restructuration du site en pages separees

## Probleme actuel

Le site utilise une seule page d'accueil (`/`) avec toutes les sections (Sommelier, Hero, Collection, La Societe, Contact) empilees. La navigation repose sur des ancres (`/#sommelier`, `/#contact`) qui causent des bugs de scroll persistants avec React Router.

## Solution

Transformer chaque section en une vraie page avec sa propre route. Plus d'ancres, plus de problemes de scroll.

### Nouvelles pages a creer

| Page | Route | Contenu |
|------|-------|---------|
| Accueil | `/` | HeroSection uniquement (landing) |
| Le Sommelier | `/sommelier` | SommelierSection |
| La Societe | `/societe` | AboutSection |
| Contact | `/contact` | Footer/Contact (section contact extraite en page) |

Les pages existantes restent inchangees : `/catalogue`, `/produit/:id`, `/auth`, `/profil`, `/admin`.

### Fichiers a modifier

**1. Creer `src/pages/SommelierPage.tsx`**
- Page dediee qui affiche Header + SommelierSection + Footer
- Route : `/sommelier`

**2. Creer `src/pages/SocietePage.tsx`**
- Page dediee qui affiche Header + AboutSection + Footer
- Route : `/societe`

**3. Creer `src/pages/ContactPage.tsx`**
- Page dediee qui affiche Header + section Contact (extraite du Footer) + Footer
- Route : `/contact`

**4. Modifier `src/pages/Index.tsx`**
- Retirer SommelierSection et AboutSection
- Garder uniquement HeroSection + ProductSection (la collection)
- Garder le Header et Footer

**5. Modifier `src/components/Header.tsx`**
- Remplacer les liens hash par des vrais liens :
  - `/#sommelier` devient `/sommelier`
  - `/#societe` devient `/societe`
  - `/#contact` devient `/contact`
- Supprimer toute la logique `handleNavClick` complexe (plus besoin)
- Tous les liens deviennent de simples `<Link to="...">` 

**6. Modifier `src/components/AnimatedRoutes.tsx`**
- Ajouter les 3 nouvelles routes : `/sommelier`, `/societe`, `/contact`

**7. Modifier `src/components/Footer.tsx`**
- Mettre a jour les liens de navigation pour utiliser les nouvelles routes (`/sommelier`, `/societe`, `/contact`) au lieu des ancres
- Le lien "Contact" pointe vers `/contact`

**8. Modifier `src/components/HeroSection.tsx`**
- Le bouton "Explorer la Collection" : lien vers `/catalogue` au lieu de `#collection`
- Le bouton "Le Sommelier" : lien vers `/sommelier` au lieu de `#sommelier`

## Resultat

- Chaque clic de navigation change de page proprement via React Router
- Plus aucun probleme de scroll ou d'ancres
- Le bouton "retour" du navigateur fonctionne naturellement
- La transition de page animee (Framer Motion) s'applique entre chaque page

