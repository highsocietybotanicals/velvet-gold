

## Conformité Viva Wallet — Bilan et Actions

### Ce qui est déjà en place ✓

1. **Politique de confidentialité** — Page `/confidentialite` existante
2. **CGV avec livraison et retours** — Pages `/cgv` et `/livraison-retours` existantes
3. **Coordonnées service client** — Page `/contact` + footer avec email et adresse

### Ce qui manque

1. **Nom de domaine public** — Ton site est actuellement sur `highsocietybotanicals.lovable.app`. Tu dois connecter ton domaine personnalisé (ex: `highsocietybotanicals.com`) via **Settings → Domains** dans Lovable. Viva Wallet veut un vrai nom de domaine, pas un sous-domaine lovable.

2. **Logo viva.com sur les écrans de paiement** — Il faut ajouter le badge/logo Viva Wallet sur le site pour rassurer les clients et satisfaire l'exigence. On va l'ajouter dans le **Footer** (section bottom bar) et sur les pages **PaymentSuccess** / **PaymentFailure**.

3. **Mention de la confidentialité dans les CGV** — Les CGV doivent **référencer** la politique de confidentialité. On va ajouter un renvoi explicite.

### Plan d'implémentation

**1. Ajouter le logo Viva Wallet dans le Footer**
- Ajouter une image/badge "Paiement sécurisé par viva.com" dans la barre du bas du Footer
- Utiliser le logo officiel Viva (SVG ou image hébergée)

**2. Ajouter la mention Viva sur les pages de paiement**
- `PaymentSuccessPage.tsx` et `PaymentFailurePage.tsx` : ajouter un petit badge "Paiement traité par viva.com"

**3. Ajouter un renvoi à la politique de confidentialité dans les CGV**
- Dans `CGVPage.tsx`, ajouter une section qui renvoie explicitement vers `/confidentialite`

**4. Domaine personnalisé**
- Ceci se fait dans les paramètres Lovable (Settings → Domains), pas dans le code. Je te guiderai après.

### Fichiers modifiés
- `src/components/Footer.tsx` — badge Viva dans la bottom bar
- `src/pages/PaymentSuccessPage.tsx` — badge Viva
- `src/pages/PaymentFailurePage.tsx` — badge Viva
- `src/pages/CGVPage.tsx` — renvoi confidentialité

