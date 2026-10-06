type ImageModule = { default: string } | string;

const originals = import.meta.glob("/src/assets/**/*.{jpg,jpeg,png}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, ImageModule>;

// Même requête que products.ts : product.image est désormais cette URL WebP de 900 px.
const webp900 = import.meta.glob("/src/assets/**/*.{jpg,jpeg,png}", {
  eager: true,
  query: "?w=900&quality=82&format=webp",
  import: "default",
}) as Record<string, ImageModule>;

const responsive = import.meta.glob("/src/assets/**/*.{jpg,jpeg,png}", {
  eager: true,
  query: "?w=400;800;1200&format=webp&as=srcset",
  import: "default",
}) as Record<string, ImageModule>;

// Variante JPEG pour les services externes (Telegram, génération IA) qui n'acceptent pas forcément le WebP.
const jpeg1024 = import.meta.glob("/src/assets/**/*.{jpg,jpeg,png}", {
  eager: true,
  query: "?w=1024&quality=85&format=jpg",
  import: "default",
}) as Record<string, ImageModule>;

const url = (m: ImageModule | undefined) => (typeof m === "string" ? m : m?.default);

const sourceSets = new Map<string, string>();
const jpegs = new Map<string, string>();

Object.entries(originals).forEach(([path, module]) => {
  const source = url(module), webp = url(webp900[path]), srcSet = url(responsive[path]), jpg = url(jpeg1024[path]);
  if (srcSet) {
    [source, webp, path].forEach((k) => k && sourceSets.set(k, srcSet));
  }
  if (jpg) {
    [source, webp, path].forEach((k) => k && jpegs.set(k, jpg));
  }
});

export const responsiveProductSrcSet = (source: string) => sourceSets.get(source);

/** URL JPEG (1024 px) d'une photo du site, pour les services externes ; l'URL d'origine si inconnue. */
export const shareableProductImage = (source: string) => jpegs.get(source) ?? source;
