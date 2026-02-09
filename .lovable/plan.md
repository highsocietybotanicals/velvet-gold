
# Correction de la navigation sur la page d'accueil

## Probleme

Quand on est deja sur la page d'accueil (`/`) et qu'on clique sur :
- **Accueil** : rien ne se passe car React Router voit qu'on est deja sur `/` et ignore le clic
- **Contact**, **Le Sommelier**, **La Societe** : le scroll fonctionne deja grace au `handleNavClick`, mais uniquement si l'element existe dans le DOM au moment du clic

## Solution

### Modifier `src/components/Header.tsx`

1. **Lien "Accueil"** : Ajouter un `onClick` sur le `<Link to="/">` pour forcer un `window.scrollTo({ top: 0, behavior: "smooth" })` quand on est deja sur la page d'accueil

2. **Generaliser** : Dans la fonction `renderLink`, pour les liens non-hash (comme "Accueil" vers `/`), ajouter une logique qui detecte si on est deja sur la meme page et force le scroll vers le haut

Concretement, modifier le bloc du `<Link>` (lignes 93-104) pour ajouter un `onClick` qui :
- Ferme le menu mobile
- Si `location.pathname === link.href`, appelle `window.scrollTo({ top: 0, behavior: "smooth" })`

## Fichier concerne

| Fichier | Action |
|---------|--------|
| `src/components/Header.tsx` | Modifier le comportement du clic sur les liens non-hash |

## Resultat

- Cliquer sur "Accueil" depuis n'importe ou remonte toujours en haut de la page
- Les liens hash continuent de fonctionner normalement
