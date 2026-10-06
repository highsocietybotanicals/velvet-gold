// Espace commercial : en-tête de « carnet » numéroté (tulipe de road-book, règle graduée, grand numéro gravé).
// Le titre h1 et le chapeau de chaque page sont passés en enfants : la page garde son propre texte.
import type { ReactNode } from "react";

export type Turn = "droit" | "droite" | "gauche" | "rond-point" | "arrivee";

/** Tulipes de road-book (repère 48 × 48, carrefour au centre 24/27, on arrive par le bas). */
const TULIPS: Record<Turn, { ghost: string[]; main: string }> = {
  droit: { ghost: ["M9 27H39"], main: "M24 37V8M19 13L24 8L29 13" },
  droite: { ghost: ["M24 27V8", "M24 27H9"], main: "M24 37V27H40M35 22L40 27L35 32" },
  gauche: { ghost: ["M24 27V8", "M24 27L39 16"], main: "M24 37V27H8M13 22L8 27L13 32" },
  "rond-point": {
    ghost: ["M18 27H8", "M30 27H40"],
    main: "M24 37V33A6 6 0 0 0 30 27A6 6 0 0 0 24 21V8M19 13L24 8L29 13",
  },
  arrivee: { ghost: ["M24 27L10 14", "M24 27L39 33"], main: "M24 37V15" },
};

const Tulip = ({ turn }: { turn: Turn }) => {
  const t = TULIPS[turn];
  return (
    <svg className="cm-tulip" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <g className="cm-tu-ghost">
        {t.ghost.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {turn === "rond-point" && <circle className="cm-tu-ring" cx="24" cy="27" r="6" />}
      <g className="cm-tu-main">
        <path d={t.main} />
        {turn === "arrivee" && <rect className="cm-tu-sq" x="18" y="6" width="12" height="9" />}
      </g>
      <circle className="cm-tu-start" cx="24" cy="40" r="3" />
    </svg>
  );
};

interface LogHeadProps {
  /** Numéro du carnet, sur deux chiffres (« 01 »). */
  no: string;
  /** Nom de l'étape, en petites capitales. */
  etape: string;
  turn: Turn;
  className?: string;
  children: ReactNode;
}

const LogHead = ({ no, etape, turn, className, children }: LogHeadProps) => (
  <div className={className ? `cm-loghead ${className}` : "cm-loghead"}>
    <span className="cm-loghead-ghost" aria-hidden="true">
      {no}
    </span>
    <div className="cm-loghead-meta">
      <Tulip turn={turn} />
      <p className="cm-loghead-k">
        <b>Carnet N° {no}</b>
        <span>{etape}</span>
      </p>
      <span className="cm-loghead-rule" aria-hidden="true" />
    </div>
    {children}
  </div>
);

export default LogHead;
