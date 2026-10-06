// Accessory data for "LES ESSENTIELS DE L'INITIÉ" section

// Corrected image assignments:
// - pochon-petit.jpg actually contains briquet image
// - briquet-hsb.jpg actually contains petit pochon image
// - pochon-moyen.jpg actually contains feuilles slim image
// - feuilles-slim.jpg actually contains moyen pochon image
// Photos livrées en WebP (vite-imagetools) au lieu des sources de 2,4 à 2,9 Mo (35 à 63 Ko) :
// 1200 px pour rester net sur la page accessoire (550 px à l'écran, ×2 en rétina) ;
// vignettes 276 px pour le pochon affiché en 46 px sur la fiche produit (réduction ×2 exacte sur un écran ×3).
import pochonPetit from "@/assets/accessories/briquet-hsb.jpg?w=1200&quality=82&format=webp"; // swapped
import pochonGrand from "@/assets/accessories/pochon-grand.jpg?w=1200&quality=82&format=webp";
import feuillesSlim from "@/assets/accessories/pochon-moyen.jpg?w=1200&quality=82&format=webp"; // swapped
import briquetHSB from "@/assets/accessories/pochon-petit.jpg?w=1200&quality=82&format=webp"; // swapped
import pochonPetitThumb from "@/assets/accessories/briquet-hsb.jpg?w=276&quality=82&format=webp"; // swapped
import pochonGrandThumb from "@/assets/accessories/pochon-grand.jpg?w=276&quality=82&format=webp";
// Jeux de tailles pour les cartes (161 px sur l'accueil, 550 px sur la page accessoire) : le navigateur choisit.
import pochonPetitSet from "@/assets/accessories/briquet-hsb.jpg?w=400;800;1200&quality=82&format=webp&as=srcset"; // swapped
import pochonGrandSet from "@/assets/accessories/pochon-grand.jpg?w=400;800;1200&quality=82&format=webp&as=srcset";
import feuillesSlimSet from "@/assets/accessories/pochon-moyen.jpg?w=400;800;1200&quality=82&format=webp&as=srcset"; // swapped
import briquetHSBSet from "@/assets/accessories/pochon-petit.jpg?w=400;800;1200&quality=82&format=webp&as=srcset"; // swapped
import type { Accessory } from "@/contexts/CartContext";

/** srcset d'une photo accessoire (clé : son URL `image`). */
export const accessorySrcSet: Record<string, string> = {
  [pochonPetit]: pochonPetitSet, [pochonGrand]: pochonGrandSet, [feuillesSlim]: feuillesSlimSet, [briquetHSB]: briquetHSBSet,
};

// Re-export the Accessory type for convenience
export type { Accessory };

export const accessories: Accessory[] = [
  {
    id: "pochon-petit",
    name: "Petit Pochon",
    price: 1.50,
    image: pochonPetit,
    description: "The Originals - 1g/3.5g",
    category: "pochon",
  },
  {
    id: "pochon-grand",
    name: "Grand Pochon",
    price: 3.00,
    image: pochonGrand,
    description: "Volume d'Élite - 28g+",
    category: "pochon",
  },
  {
    id: "feuilles-slim",
    name: "Feuilles Slim HSB",
    price: 3.00,
    image: feuillesSlim,
    description: "Paquet de feuilles slim",
    category: "accessoire",
  },
  {
    id: "briquet-hsb",
    name: "Briquet HSB",
    price: 2.50,
    image: briquetHSB,
    description: "BIC personnalisé noir & or",
    category: "accessoire",
  },
];

// Images for pochon visual logic based on weight
export const pochonImages = {
  petit: pochonPetit,
  grand: pochonGrand,
};

// Export individual corrected images for use in CartDrawer
export { feuillesSlim, briquetHSB };

// Get pochon image based on weight (vignette 48 px de la fiche produit → fichier 276 px)
export const getPochonImage = (weight: number): string => {
  if (weight < 10) return pochonPetitThumb;
  return pochonGrandThumb;
};

// Get pochon size label
export const getPochonLabel = (weight: number): string => {
  if (weight < 10) return "Petit Pochon";
  return "Grand Pochon";
};
