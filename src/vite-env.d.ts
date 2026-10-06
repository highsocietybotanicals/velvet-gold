/// <reference types="vite/client" />

// vite-imagetools (déjà actif dans vite.config.ts) ne fournit pas de types d'import.
// Convention : la directive de format est toujours placée en dernier.
//   import photo from "@/assets/x.jpg?w=900&quality=82&format=webp";            → URL de l'image générée
//   import set from "@/assets/x.jpg?w=400;900&quality=82&format=webp&as=srcset"; → « url 400w, url 900w »
declare module "*&format=jpg" {
  const src: string;
  export default src;
}
declare module "*&format=webp" {
  const src: string;
  export default src;
}
declare module "*&as=srcset" {
  const srcset: string;
  export default srcset;
}
