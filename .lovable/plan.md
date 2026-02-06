
# Integration des Images Produits Authentiques

## Objectif
Remplacer les images placeholder par les vraies photos de vos 4 varietes, avec un fond noir uniforme pour toutes.

---

## Images Recues

| Variete | Fichier | Fond Actuel |
|---------|---------|-------------|
| Blue Mango | Screenshot_20260206_112915_Drive.jpg | Noir |
| 911 OG | Screenshot_20260206_112753_Drive.jpg | Noir |
| Mint Kush | Screenshot_20260206_112644_Drive.jpg | Blanc |
| Platinum OG | Screenshot_20260206_112627_Drive.jpg | Blanc |

---

## Actions

### Etape 1 : Copie des Images

Copier les 4 images dans le dossier `src/assets/flowers/` avec des noms propres :

- `user-uploads://Screenshot_20260206_112915_Drive.jpg` vers `src/assets/flowers/blue-mango-real.jpg`
- `user-uploads://Screenshot_20260206_112753_Drive.jpg` vers `src/assets/flowers/911-og-real.jpg`
- `user-uploads://Screenshot_20260206_112644_Drive.jpg` vers `src/assets/flowers/mint-kush-real.jpg`
- `user-uploads://Screenshot_20260206_112627_Drive.jpg` vers `src/assets/flowers/platinum-og-real.jpg`

### Etape 2 : Mise a Jour de `src/data/products.ts`

Modifier les imports et references pour les 4 produits :

```typescript
// Remplacer les anciens imports par les vrais
import blueMango from "@/assets/flowers/blue-mango-real.jpg";
import nineOneOne from "@/assets/flowers/911-og-real.jpg";
import mintKush from "@/assets/flowers/mint-kush-real.jpg";
import platinumOG from "@/assets/flowers/platinum-og-real.jpg";

// Puis utiliser ces images dans les objets produits correspondants
```

### Etape 3 : Harmonisation du Fond

Les 2 images sur fond blanc (Mint Kush et Platinum OG) apparaitront sur les cartes produit qui ont deja un fond sombre grace au CSS du site. Le contraste sera visible mais acceptable.

Pour une uniformite parfaite, je peux :
- Option A : Utiliser les images telles quelles (le fond blanc deviendra un cercle clair autour du produit)
- Option B : Appliquer un style CSS `mix-blend-mode: multiply` pour fusionner le fond blanc avec le noir
- Option C : Vous pourriez fournir des versions sur fond noir/transparent de ces 2 images

---

## Fichiers Modifies

| Fichier | Action |
|---------|--------|
| `src/assets/flowers/blue-mango-real.jpg` | Nouvelle image |
| `src/assets/flowers/911-og-real.jpg` | Nouvelle image |
| `src/assets/flowers/mint-kush-real.jpg` | Nouvelle image |
| `src/assets/flowers/platinum-og-real.jpg` | Nouvelle image |
| `src/data/products.ts` | Mise a jour des imports et references |

---

## Note sur les 3 Produits Manquants

Vous avez fourni 4 images sur 7 produits. Il manque :
- **Amnesia "Signature Oniria"** (conservera l'image actuelle)
- **Ice O Lator** (conservera l'image actuelle)
- **Golden CBN** (conservera l'image actuelle)

Si vous avez ces images, vous pourrez les ajouter ensuite.
