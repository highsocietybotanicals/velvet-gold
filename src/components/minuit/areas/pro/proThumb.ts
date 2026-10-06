type ImageModule = { default: string } | string;

/*
 * Vignettes du tableau de cote (56 px). La photo produit (product.image) fait 900 px de large au moins :
 * pour une case de 56 px on sert une déclinaison webp de 112 px et 168 px (écrans 1x/2x et 3x), générée par
 * vite-imagetools à partir de la même photo source : même image à l'œil, 25 à 65 fois moins de pixels à décoder.
 *
 * Correspondance : product.image est l'URL d'un module image de data/products.ts. On importe ici les mêmes
 * fichiers avec les mêmes paramètres (même module, donc exactement la même URL, en dev comme au build).
 * Si data/products.ts change de paramètres ou de photo, la correspondance échoue sans dommage :
 * la balise garde son src d'origine (aucun srcset).
 * Motif limité aux photos produit (« -real », « -premium », piatella) pour ne pas générer de vignettes inutiles
 * (import.meta.glob n'accepte que des motifs littéraux : il est répété dans les deux appels).
 */

// Mêmes paramètres que data/products.ts (photos livrées en webp 900 px).
const asProduct = import.meta.glob("/src/assets/{flowers,resins}/{*-real,*-premium,piatella}.jpg", {
  eager: true,
  query: "?w=900&quality=82&format=webp",
  import: "default",
}) as Record<string, ImageModule>;

const thumbs = import.meta.glob("/src/assets/{flowers,resins}/{*-real,*-premium,piatella}.jpg", {
  eager: true,
  query: "?w=112;168&format=webp&as=srcset",
  import: "default",
}) as Record<string, ImageModule>;

const read = (m?: ImageModule) => (typeof m === "string" ? m : m?.default);

const byUrl = new Map<string, string>();
Object.entries(thumbs).forEach(([path, mod]) => {
  const set = read(mod);
  if (!set) return;
  byUrl.set(path, set); // dev sans paramètre : product.image vaut le chemin source
  const src = read(asProduct[path]);
  if (src) byUrl.set(src, set);
});

/** srcset webp 112 w / 168 w de la photo produit, ou undefined (la balise garde alors son src d'origine). */
export const proThumbSrcSet = (src: string) => byUrl.get(src);
