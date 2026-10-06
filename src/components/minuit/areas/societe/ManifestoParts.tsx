import { useState, type ImgHTMLAttributes } from "react";

// Pièces visuelles du manifeste (/societe). Aucune logique métier : décor et présentation.

/** Image avec repli : visuel du bucket d'abord, photo du code ensuite. Hors écran : chargement différé. */
export const SoImg = ({ srcs, ...rest }: { srcs: string[] } & ImgHTMLAttributes<HTMLImageElement>) => {
  const [i, setI] = useState(0);
  return (
    <img
      loading="lazy"
      decoding="async"
      {...rest}
      src={srcs[i]}
      onError={() => setI((v) => (v + 1 < srcs.length ? v + 1 : v))}
    />
  );
};

/** Rideau de fer d'un chapitre : se lève (translateY) quand le chapitre entre dans l'écran. */
export const Shutter = ({ n }: { n: string }) => (
  <div className="so-shutter" aria-hidden="true">
    <span className="so-shutter-n">{n}</span>
    <span className="so-shutter-l">Chapitre {n}</span>
    <span className="so-shutter-lock" />
  </div>
);

/** Grand chiffre romain gravé au trait, qui s'allume à l'ouverture du chapitre. */
export const Numeral = ({ n }: { n: string }) => (
  <div className="so-numeral" aria-hidden="true">
    <span className="so-numeral-glyph">
      <span className="so-numeral-dim">{n}</span>
      <span className="so-numeral-lit">{n}</span>
    </span>
    <small>Chapitre</small>
  </div>
);
