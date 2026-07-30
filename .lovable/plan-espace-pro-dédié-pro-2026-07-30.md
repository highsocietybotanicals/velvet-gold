# Espace Pro dédié (/pro)

Un mini-site réservé aux revendeurs validés, avec son propre catalogue, ses tarifs €/g par palier de volume, son panier en préconditionnés et deux modes de commande (achat direct ou demande de devis).

## 1. Page publique /pro (vitrine + candidature)

Accessible à tous : présentation de l'offre partenaire (préconditionnés 1g / 2.5g / 5g / 10g, pochons alu alimentaires hermétiques, Boveda 62%, cadeaux client inclus dans les 10g, 100% légal, analyses labo). Bouton "Devenir partenaire" → formulaire (raison sociale, SIRET, TVA intracom, adresse, contact). La demande crée/complète le profil et arrive dans `/admin/pro` pour validation.

## 2. Espace Pro connecté (/pro/catalogue, /pro/panier, /pro/commandes)

Visible uniquement si le compte a le rôle `pro` + validation admin + TVA validée. Sinon : message "compte en cours de validation".

- Design distinct du site grand public : sombre/sobre, orienté tableau, pas de storytelling, pas de quiz sommelier, pas de chatbot.
- **Catalogue pro** : tableau par produit avec, pour chaque format (1g / 2.5g / 5g / 10g), le nombre d'unités à saisir. Colonnes : PV public TTC conseillé, prix pro €/g au palier courant, total HT ligne, marge revendeur estimée.
- **Barre de palier en direct** : "Vous êtes à 340 g — encore 260 g pour passer au palier supérieur (-X €/g)". Le €/g s'applique à **tout le panier** dès que le seuil est franchi (recalcul global, comme prévu dans `pro_price_tiers`).
- **Récap panier pro** : total grammes, total HT, TVA 20%, total TTC, économie vs tarif public.

## 3. Deux modes de commande

- **Achat direct** : le pro valide son panier et paie en ligne (Viva Wallet, même tunnel que les clients) → commande créée avec `payment_status = paid`.
- **Demande de devis** : le pro envoie sa demande, tu la vois dans l'admin, tu ajustes si besoin, tu valides → facture proforma PDF générée et envoyée par e-mail. Le pro peut ensuite payer en ligne depuis son espace ou par virement.

Au checkout pro, choix explicite : **Payer en ligne** ou **Virement / facture à 30 jours**. Le virement crée la commande en `awaiting_transfer`, marquée payée manuellement par toi dans l'admin.

## 4. Différences de règles côté pro

- Pas de programme fidélité, pas de gramme offert, pas de codes promo grand public.
- Les cadeaux (briquet + feuilles) restent inclus physiquement dans les 10g mais ne coûtent rien au partenaire : indiqué comme argument commercial.
- Livraison : Colissimo ou remise en main propre, franco de port au-delà d'un seuil que tu fixeras dans l'admin.
- Prix affichés **HT** partout côté pro (TVA rappelée en bas de panier).

## 5. Tarifs

La grille reste celle déjà en base (`pro_price_tiers` : ≤200g / >200g / >600g / >1kg), éditable dans l'admin. Une fois l'espace en place, on ouvre l'onglet Rentabilité côte à côte pour ajuster chaque €/g avec la marge réelle sous les yeux — l'écran "Catalogue pro" affichera d'ailleurs ta marge en mode admin pour arbitrer directement.

---

## Détails techniques

**Routes** (dans `AnimatedRoutes.tsx`) :
- `/pro` → `ProLandingPage` (public)
- `/pro/*` sous `ProLayout` (garde d'accès : `isPro && isProValidated && is_vat_validated`)
  - `catalogue`, `panier`, `commandes`, `compte`

**Nouveaux fichiers :**
- `src/pages/pro/ProLayout.tsx`, `ProLandingPage.tsx`, `ProCataloguePage.tsx`, `ProCartPage.tsx`, `ProOrdersPage.tsx`
- `src/components/pro/ProHeader.tsx`, `ProProductRow.tsx`, `ProTierBar.tsx`, `ProCartSummary.tsx`, `ProPartnerApplyForm.tsx`
- `src/contexts/ProCartContext.tsx` — panier pro séparé du panier grand public (unités par format, recalcul du €/g sur le poids total)
- `src/lib/proPricing.ts` — `computeProCart(items, tiers)` : poids total → palier → €/g par gamme → totaux HT/TVA/TTC + marge revendeur

**Réutilisé :** `useProPriceTiers`, `getGammeForProduct` / `getProPricePerGram` (`src/lib/margin.ts`), `useCatalogProducts`, `useCosts` pour l'affichage marge admin.

**DB (une migration) :**
- `pro_quotes` (id, partner_user_id, status: draft/sent/accepted/refused, total_ht, total_ttc, items jsonb, notes, expires_at) + GRANT + RLS (pro voit les siennes, admin tout)
- `pro_settings` (id=1, franco_port_seuil_ht, delai_paiement_jours)
- `orders` : ajout `order_channel` ('b2c' | 'pro') et `payment_method` ('online' | 'transfer') pour distinguer les commandes pro en compta et en rentabilité

**Paiement :** réutilisation de `create-viva-payment` avec un flag `pro: true` qui court-circuite la grille B2C et applique les prix pro du panier (recalcul serveur obligatoire, jamais le prix envoyé par le client).

**Admin :** onglet "Devis pro" ajouté dans `/admin/pro`, et filtre "Canal : B2C / Pro" dans `/admin/commandes` et la compta.
