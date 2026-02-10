

# Ajout du produit "Nuage de Mousseux" (Resine CBD - Magic Sauce)

## Resume
Ajout d'une nouvelle resine nommee **"Nuage de Mousseux"** au catalogue, a **10EUR/g**, dans le **Groupe A**. La molecule presente dans ce produit est la "Magic Sauce".

## Etapes

### 1. Generation de la photo produit
- Generer via IA une photo de resine/hash style luxe High Society Botanicals
- Inspiree de la capture d'ecran fournie : texture de hash mousseux / mousse
- Fond noir, eclairage studio dore, esthetique haute joaillerie
- Sauvegarde dans `src/assets/resins/nuage-de-mousseux-real.jpg`

### 2. Ajout du produit dans `src/data/products.ts`
- **Nom** : Nuage de Mousseux
- **Sous-titre** : Magic Sauce Premium
- **Badge** : Magic Sauce
- **Categorie** : resine
- **Prix de base** : 10EUR/g (au lieu de 12EUR standard du Groupe A)
- **Groupe tarifaire** : A (remises : -15% a 10g, -25% a 25g, -35% a 50g, -50% a 100g)
- **CBD** : a definir (suggestion ~40% en se basant sur le type de produit)
- **Profil terpenes** : adapte a une resine de type mousseux (boise/terreux dominant)
- **Intention / Gout** : detente, sommeil / boise

### 3. Mise a jour des matrices de recommandation du Sommelier
- Inclure "Nuage de Mousseux" dans la `resinRecommendationMatrix` pour diversifier les suggestions de resines (actuellement seulement Ice O Lator et Golden CBN)

### 4. Fichiers modifies
- `src/data/products.ts` : import de l'image + ajout du produit dans le groupe A + mise a jour des matrices

### Note technique
Le prix de base de 10EUR/g est different du standard du Groupe A (12EUR/g). Le systeme supporte deja cela car le champ `price` est independant du `priceGroup` — le groupe ne determine que les pourcentages de remise par palier.

