## Objectif

Faire en sorte que les **Prix Vitrine TTC du book** deviennent les prix du site, avec une dégressivité automatique qui reproduit exactement la grille du book (1g / 2,5g / 5g / 10g).

## 1. Mise à jour des prix de base (1g)

Les CBD classiques passent **tous à 12€/g**, l'Élixir Noir reste cas par cas :

| Produit | Avant | Après |
|---|---|---|
| Amnesia Signature Oniria | 10€ | **12€** |
| Ice O Lator | 12€ | 12€ ✓ |
| Golden CBN | 11€ | **12€** |
| Mint Kush | 15€ | **12€** |
| Platinum OG | 11€ | **12€** |
| Nuage de Mousseux | 13€ | 13€ ✓ |
| 911 OG | 15€ | 15€ ✓ |
| Blue Mango | 13€ | 13€ ✓ |

## 2. Dégressivité Groupe A (CBD classiques) recalibrée

Tous les CBD classiques étant au même tarif (12€/g), la dégressivité est cumulée dans le panier (5g d'Amnesia + 5g de Mint Kush = 10g → 80€). Nouveaux paliers calés sur le book :

```
1g       → 12€        (0%)
2,5g     → 25€        (−17%)
5g       → 45€        (−25%)
10g      → 80€        (−33%)
25g+     → −40%
50g+     → −45%
100g+    → −50%
```

## 3. Élixir Noir — grille par produit (cas par cas)

L'Élixir Noir n'est plus calculé via un pourcentage générique : chaque produit a sa **grille de prix par format** définie en base. Si le client prend 10g de Blue Mango + 5g de Nuage, le calcul prend le tarif palier de chaque produit individuellement (pas de mutualisation entre Élixir Noirs).

**Nuage de Mousseux**
| Format | Prix |
|---|---|
| 1g | 13€ |
| 2,5g | 30€ |
| 5g | 55€ |
| 10g | 65€ |

**911 OG**
| Format | Prix |
|---|---|
| 1g | 15€ |
| 2,5g | 35€ |
| 5g | 65€ |
| 10g | 90€ |

**Blue Mango**
| Format | Prix |
|---|---|
| 1g | 13€ |
| 2,5g | 30€ |
| 5g | 55€ |
| 10g | 80€ |

Pour les poids intermédiaires (ex: 7g) ou supérieurs (25g, 50g…), on interpole sur le €/g du dernier palier 10g (palier le plus avantageux), puis on applique un dégressif additionnel léger au-delà (−10% à 25g, −15% à 50g, −20% à 100g).

## 4. Prix Pro

Le système Pro actuel (prix fixe €/g par produit, sans dégressif) reste en place mais est **vidé** — aucun `pro_price` n'est défini en base aujourd'hui. Les Pros voient donc les prix vitrine ci-dessus comme tout le monde, sauf si tu veux qu'on alimente la table `pro_prices` avec une autre grille (à préciser dans une étape ultérieure).

---

## Détails techniques

- **Migration SQL** : `UPDATE public.products SET price = ... WHERE id IN (...)` pour Amnesia, Golden CBN, Mint Kush, Platinum OG.
- **`src/data/products.ts`** : mettre à jour les prix par défaut hardcodés pour cohérence avec la DB.
- **`src/lib/pricing.ts`** :
  - `WEIGHT_TIERS_A` : remplacer les paliers actuels par −17 / −25 / −33 / −40 / −45 / −50.
  - Nouvelle fonction `calculateForceNoirePrice(productId, weight)` qui lit une grille `FORCE_NOIRE_PRICE_GRID` (objet en mémoire avec les 4 paliers de Nuage / 911 / Blue Mango) et applique l'interpolation décrite.
  - `calculateItemPrice` : si le produit appartient à Force Noire, déléguer à `calculateForceNoirePrice` au lieu d'utiliser `WEIGHT_TIERS_B`.
- **`CartDrawer.tsx`, `ProductCard.tsx`, `ProductPage.tsx`** : aucun changement d'API — ils consomment déjà `calculateItemPrice` / `calculatePrice`.
- **Vérifications** : tester en panier 1g, 2,5g, 5g, 10g de chaque produit pour valider que les totaux matchent exactement le book.
