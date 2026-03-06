
Objectif: supprimer définitivement le flash “Une erreur est survenue” juste avant la redirection Viva.

Constat (après inspection runtime + code)
- Le paiement backend fonctionne (URL Viva valide, 200).
- Le crash est frontend et arrive pendant le clic paiement (avant/pendant la redirection).
- En runtime, on voit des warnings Framer Motion/React de type “Function components cannot be given refs…”, notamment dans CartDrawer/AnimatedRoutes.
- Structure actuelle à risque: `AnimatePresence` avec enfants non idéaux (fragment / composants non forwardRef), ce qui peut provoquer un rendu instable au moment où l’état change (`isLoading`) puis navigation externe.

Do I know what the issue is?
- Oui: la cause la plus probable est un crash de rendu lié à la combinaison `AnimatePresence` + structure d’enfants/refs pendant l’update du bouton paiement, puis redirection externe.

Plan d’implémentation
1) Stabiliser la structure du Drawer (priorité 1)
- Fichier: `src/components/CartDrawer.tsx`
- Remplacer l’enfant fragment de `AnimatePresence` par un conteneur `motion.div` unique (child direct ref-compatible).
- Conserver backdrop + panel dans ce conteneur.
- But: supprimer les chemins de rendu qui déclenchent les erreurs de ref au moment des updates.

2) Durcir le flux de redirection paiement
- Fichier: `src/components/CartDrawer.tsx`
- Activer le flag global de navigation dès le début du clic paiement (avant le premier `setIsLoading(true)`), pas seulement juste avant `window.location`.
- En cas d’échec paiement (catch), remettre ce flag à `false`.
- Utiliser `window.location.replace(checkoutUrl)` (handoff plus “hard”) + `return` immédiat.
- But: éviter tout rendu intermédiaire fragile pendant la transition vers Viva.

3) Corriger les points AnimatePresence à ref-risk hors drawer
- Fichier: `src/components/AnimatedRoutes.tsx`
- Encapsuler la partie animée de route dans un enfant direct ref-compatible (ex: wrapper `motion.div`), ou ajuster la structure pour que `AnimatePresence` n’applique pas de ref sur un composant fonctionnel non forwardRef.
- But: éliminer les warnings/risques structurels globaux qui peuvent se manifester pendant navigation.

4) Garde-fou ErrorBoundary (sans masquer les vraies erreurs)
- Fichier: `src/components/ErrorBoundary.tsx`
- Garder l’ignore pendant navigation, mais conditionner précisément au flag de checkout/navigation.
- Ajouter logs plus explicites (`error.message`, stack, état du flag) pour le prochain incident.
- But: pas d’écran d’erreur parasite pendant handoff externe, tout en gardant la visibilité sur de vrais bugs hors redirection.

5) Vérification ciblée
- Tester sur Preview + Published, mobile + desktop:
  - clic payer → spinner → redirection Viva directe, sans flash ErrorBoundary.
  - cas d’erreur volontaire (URL invalide / erreur fonction) → pas de crash, toast d’erreur normal.
- Vérifier absence de warnings refs liés à CartDrawer/AnimatedRoutes pendant le flow paiement.

Détails techniques (résumé)
- Fichiers concernés:
  - `src/components/CartDrawer.tsx` (structure AnimatePresence + logique redirect)
  - `src/components/AnimatedRoutes.tsx` (structure AnimatePresence routes)
  - `src/components/ErrorBoundary.tsx` (filtre navigation + logs)
- Aucun changement backend/base de données nécessaire.
