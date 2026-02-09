

# Transitions Fluides entre les Pages

## Concept

Ajouter une animation de fondu elegant (fade + leger slide vers le haut) a chaque changement de page, pour un rendu ultra-premium et fluide.

---

## Approche

Utiliser **Framer Motion** (deja installe dans le projet) avec un composant `AnimatePresence` + `motion.div` qui enveloppe chaque page.

---

## Implementation

### 1. Creer un composant `PageTransition`

Fichier : `src/components/PageTransition.tsx`

Un wrapper qui anime l'entree et la sortie de chaque page :
- **Entree** : fondu + glissement subtil de 20px vers le haut (0.4s)
- **Sortie** : fondu rapide (0.2s)
- Utilise `AnimatePresence` de Framer Motion avec le `pathname` comme cle

### 2. Creer un composant `AnimatedRoutes`

Fichier : `src/components/AnimatedRoutes.tsx`

Extraire les routes dans un composant separe qui utilise `useLocation` pour fournir la cle d'animation a `AnimatePresence`, et envelopper chaque route avec `PageTransition`.

### 3. Modifier `App.tsx`

Remplacer le bloc `<Routes>` actuel par le nouveau composant `<AnimatedRoutes />`.

---

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/PageTransition.tsx` | Nouveau - wrapper d'animation |
| `src/components/AnimatedRoutes.tsx` | Nouveau - routes animees |
| `src/App.tsx` | Modifier - utiliser AnimatedRoutes |

---

## Resultat

Chaque navigation entre pages aura un effet de fondu elegant et premium, coherent avec l'identite luxe du site.

