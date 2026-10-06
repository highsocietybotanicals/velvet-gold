import type { CSSProperties } from "react";
import emblemSvg from "@/assets/brand/hsb-emblem.svg?raw";

/** Emblème de la maison en masque CSS : posé sur un fond feuille d'or, il devient une gravure dorée. */
export const EMBLEM_MASK = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(emblemSvg)}")`;

/** Style à poser sur l'élément qui porte la variable --emb (lue par pro.css). */
export const embStyle = { "--emb": EMBLEM_MASK } as CSSProperties;

/** Emblème vectoriel brut (fill="currentColor"), pour l'insérer en ligne. */
export { emblemSvg };
