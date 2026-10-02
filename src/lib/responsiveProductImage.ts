type ImageModule = { default: string } | string;

const originals = import.meta.glob("/src/assets/**/*.{jpg,jpeg,png}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, ImageModule>;

const responsive = import.meta.glob("/src/assets/**/*.{jpg,jpeg,png}", {
  eager: true,
  query: "?w=400;800;1200&format=webp&as=srcset",
  import: "default",
}) as Record<string, ImageModule>;

const sourceSets = new Map<string, string>();

Object.entries(originals).forEach(([path, module]) => {
  const source = typeof module === "string" ? module : module.default;
  const responsiveModule = responsive[path];
  const srcSet = typeof responsiveModule === "string" ? responsiveModule : responsiveModule?.default;
  if (source && srcSet) sourceSets.set(source, srcSet);
});

export const responsiveProductSrcSet = (source: string) => sourceSets.get(source);
