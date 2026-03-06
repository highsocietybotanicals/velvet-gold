

## Plan : Corriger le paiement et le formulaire d'adresse (sans Shopify)

On garde **tout votre site tel quel** — pas de migration Shopify, pas de changement de système. On corrige juste les deux problèmes.

---

### Problème 1 : Le formulaire d'adresse

**Actuellement** : Un simple `<textarea>` avec "Votre adresse complète..." — aucune structure, aucune validation.

**Correction** : Remplacer par un formulaire structuré avec des champs séparés :
- **Numéro + Rue** (obligatoire)
- **Complément d'adresse** (optionnel — bâtiment, étage, code)
- **Code postal** (obligatoire, 5 chiffres validés)
- **Ville** (obligatoire)
- **Pays** (pré-rempli "France")

L'adresse sera assemblée en une seule chaîne avant envoi au backend (aucun changement côté edge function).

**Fichier modifié** : `src/components/DeliverySection.tsx`

---

### Problème 2 : Le paiement Viva Wallet

**Actuellement** : L'edge function `create-viva-payment` utilise `getClaims()` qui n'existe pas dans le SDK Supabase pour Deno — ça plante silencieusement pour les utilisateurs connectés.

**Corrections** :
1. Remplacer `getClaims()` par `getUser()` pour l'authentification
2. Le `PaymentButton` envoie `amount` et `totalFlowerWeight` mais l'edge function attend `items` avec les détails — il y a un décalage entre ce que le frontend envoie et ce que le backend attend. Le frontend envoie `items` avec `productType: "flower"` mais le backend filtre sur `"fleur"/"resine"` → les produits ne sont jamais trouvés en base.
3. Corriger le mapping des `productType` pour que le frontend envoie les bons types (`fleur`/`resine`/`accessoire`) au lieu de `flower`/`resin`/`accessory`.

**Fichiers modifiés** :
- `supabase/functions/create-viva-payment/index.ts` — fix auth `getClaims` → `getUser`
- `src/components/CartDrawer.tsx` — fix le mapping `productType` envoyé au backend

---

### Ce qui ne change PAS
- Le design du site
- Le système de prix au gramme libre
- Les remises progressives
- Les échantillons, cadeaux, accessoires
- Le sommelier, les pages admin, profil
- Aucune dépendance ajoutée

