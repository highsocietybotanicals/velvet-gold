// Accessory data for "LES ESSENTIELS DE L'INITIÉ" section

// Corrected image assignments:
// - pochon-petit.jpg actually contains briquet image
// - briquet-hsb.jpg actually contains petit pochon image
// - pochon-moyen.jpg actually contains feuilles slim image
// - feuilles-slim.jpg actually contains moyen pochon image
import pochonPetit from "@/assets/accessories/briquet-hsb.jpg"; // swapped
import pochonMoyen from "@/assets/accessories/feuilles-slim.jpg"; // swapped
import pochonGrand from "@/assets/accessories/pochon-grand.jpg"; // new correct image
import feuillesSlim from "@/assets/accessories/pochon-moyen.jpg"; // swapped
import briquetHSB from "@/assets/accessories/pochon-petit.jpg"; // swapped
import type { Accessory } from "@/contexts/CartContext";

// Re-export the Accessory type for convenience
export type { Accessory };

export const accessories: Accessory[] = [
  {
    id: "pochon-petit",
    name: "Petit Pochon",
    price: 0.50,
    image: pochonPetit,
    description: "The Originals - 1g/3.5g",
    category: "pochon",
  },
  {
    id: "pochon-moyen",
    name: "Moyen Pochon",
    price: 2.50,
    image: pochonMoyen,
    description: "Collection Privée - 7g/14g",
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
    price: 3.00,
    image: briquetHSB,
    description: "BIC personnalisé noir & or",
    category: "accessoire",
  },
];

// Images for pochon visual logic based on weight
export const pochonImages = {
  petit: pochonPetit,
  moyen: pochonMoyen,
  grand: pochonGrand,
};

// Export individual corrected images for use in CartDrawer
export { pochonMoyen, feuillesSlim, briquetHSB };

// Get pochon image based on weight
export const getPochonImage = (weight: number): string => {
  if (weight < 10) return pochonPetit;
  if (weight < 30) return pochonMoyen;
  return pochonGrand;
};

// Get pochon size label
export const getPochonLabel = (weight: number): string => {
  if (weight < 10) return "Petit Pochon";
  if (weight < 30) return "Moyen Pochon";
  return "Grand Pochon";
};
