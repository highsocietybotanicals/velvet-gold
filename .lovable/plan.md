
# Plan de Configuration Finale "High Society Botanicals"

## Objectif
Finaliser la boutique avec un catalogue épuré de 7 variétés "Haute Couture", une grille de prix rentable (minimum x2), et une gestion "ghost" des accessoires.

---

## Etape 1 : Refonte du Catalogue (7 Variétés Exclusives)

### Remplacement des produits dans `src/data/products.ts`

Suppression des 20 fleurs et 10 résines actuelles, remplacées par exactement 7 produits :

**GROUPE A - Standard Luxury (Base 30€ / 2.5g = 12€/g)**

| ID | Nom | Badge | Description | Image |
|----|-----|-------|-------------|-------|
| amnesia-signature-oniria | Amnesia "Signature Oniria" | Artiste Edition | Fleur d'artiste par Oniria | amnesia-haze.jpg |
| platinum-og | Platinum OG | Cali Genetics | Génétique Californienne Premium | og-kush.jpg |
| mint-kush | Mint Kush | Cali Genetics | Génétique Californienne Premium | northern-lights.jpg |
| ice-o-lator | Ice O Lator | 60% Extraction | Résine pure 60% CBD | bubble-hash.jpg |
| golden-cbn | Golden CBN | Royal Sleep | 25% CBD / 10% CBN / 10% CBG | charas.jpg |

**GROUPE B - Ultra Premium (Base 35€ / 2.5g = 14€/g)**

| ID | Nom | Badge | Description | Image |
|----|-----|-------|-------------|-------|
| 911-og-indoor | 911 OG "Indoor Master" | Magic Sauce 50% | Edition Limitée Indoor | gorilla-glue.jpg |
| blue-mango-indoor | Blue Mango "Indoor Master" | Rare 10-OH+ | Collection Rare Indoor 30% | blue-dream.jpg |

### Nouveau type Product

Ajout d'un champ `priceGroup: "A" | "B"` pour différencier la logique de pricing.

---

## Etape 2 : Nouvelle Logique de Prix

### Modification de `src/lib/pricing.ts`

**GROUPE A (Base 12€/g) - Objectif 6€/g à 100g**

| Poids | Remise | Prix final |
|-------|--------|------------|
| 2.5g | 0% | 30.00€ |
| 10g | -15% | 102.00€ |
| 25g | -25% | 225.00€ |
| 50g | -35% | 390.00€ |
| 100g | -50% | 600.00€ |

**GROUPE B (Base 14€/g) - Objectif ~9€/g à 100g**

| Poids | Remise | Prix final |
|-------|--------|------------|
| 2.5g | 0% | 35.00€ |
| 10g | -10% | 126.00€ |
| 25g | -20% | 280.00€ |
| 50g | -25% | 525.00€ |
| 100g | -35% | 910.00€ |

### Fonctions modifiées

- `calculatePrice()` : Prendra en compte le groupe (A/B)
- `getDiscountTier()` : Deux sets de tiers selon le groupe
- Export de `WEIGHT_TIERS_A` et `WEIGHT_TIERS_B`

---

## Etape 3 : Gestion "Ghost" des Accessoires

### Fichiers concernés

1. **`src/pages/Index.tsx`**
   - Commenter `<AccessoriesSection />` (pas de suppression)
   - L'import reste présent pour réactivation future

2. **`src/components/ProductCard.tsx`**
   - Masquer le lien "Besoin d'un pochon en plus ?" (lignes 357-364)
   - Conserver le code des cadeaux car il fonctionne en fond

3. **`src/components/CartDrawer.tsx`**
   - Masquer l'affichage des cadeaux/packs (section Gift) avec condition
   - La logique de calcul reste intacte pour éviter les erreurs

4. **`src/pages/CataloguePage.tsx`**
   - Masquer l'onglet "Accessoires" dans les filtres

**Conservation intégrale de** :
- `src/components/AccessoriesSection.tsx`
- `src/data/accessories.ts`
- Logique des cadeaux dans `CartContext.tsx`

---

## Etape 4 : Qualité et Finitions

### Badges dorés

Vérification dans `ProductCard.tsx` que les badges utilisent les classes :
```text
bg-primary/20 text-primary border-primary/30
```

Pour les badges spéciaux "Cali Genetics" : ajout d'un style distinctif doré.

### Mention légale Footer

Modification de `src/components/Footer.tsx` :

Texte à ajouter dans la section bottom bar :
```
"Fleurs de collection issues de variétés Cannabis Sativa L. autorisées, <0.3% THC."
```

### Vérification Admin

L'accès à `/admin` fonctionne correctement via le hook `useAdmin` et la vérification `isAdmin`. Aucune modification nécessaire.

---

## Fichiers Modifiés

| Fichier | Action |
|---------|--------|
| `src/data/products.ts` | Refonte complète - 7 produits avec groupes A/B |
| `src/lib/pricing.ts` | Nouvelles grilles tarifaires par groupe |
| `src/pages/Index.tsx` | Commentaire AccessoriesSection |
| `src/components/ProductCard.tsx` | Masquage lien pochon, adaptation pricing groupe |
| `src/components/CartDrawer.tsx` | Masquage visuel cadeaux |
| `src/pages/CataloguePage.tsx` | Masquage onglet Accessoires |
| `src/components/Footer.tsx` | Ajout mention légale CBD |
| `src/components/SommelierSection.tsx` | Adaptation recommandations aux 7 produits |

---

## Details Techniques

### Structure du nouveau Product

```typescript
interface Product {
  id: string;
  name: string;
  subtitle: string;
  badge: string;           // Nouveau : "Cali Genetics", "Royal Sleep", etc.
  description: string;
  price: number;           // Prix base par gramme (12 ou 14)
  priceGroup: "A" | "B";   // Nouveau : groupe tarifaire
  cbdPercentage: string;
  image: string;
  terpenes: TerpeneProfile;
  mood: string;
  category: ProductCategory;
  intentionMatch: string[];
  tasteMatch: string[];
}
```

### Logique de calcul adaptée

```typescript
export const calculatePrice = (
  basePrice: number, 
  weight: number, 
  priceGroup: "A" | "B" = "A"
): PriceInfo => {
  const tiers = priceGroup === "A" ? WEIGHT_TIERS_A : WEIGHT_TIERS_B;
  // ... calcul avec les bons tiers
}
```

---

## Points de Vigilance

- La base de données `products` en Supabase n'a que 2 colonnes de prix (`price`, `pro_price`). La logique de groupe sera gérée côté frontend via le fichier `products.ts`
- Le Sommelier (`recommendationMatrix`) devra pointer vers les nouveaux IDs de produits
- Les échantillons gratuits continueront de fonctionner avec les 7 produits restants
