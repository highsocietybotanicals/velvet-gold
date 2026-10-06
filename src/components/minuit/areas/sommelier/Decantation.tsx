// Décantation : une carafe se remplit d'or liquide sous la niche, puis s'efface pour révéler le lot
// (détourage via cutSources, avec repli sur la photo produit). Animation CSS jouée une seule fois au montage ;
// en mouvement réduit, l'état final (le lot) s'affiche directement.
import { useId, useMemo, useState } from "react";
import type { Product } from "@/data/products";
import { cutSources, typeLabel } from "@/components/minuit/minuitData";
import { lotNumber } from "./cave";

// silhouette de la carafe (col étroit, panse large) dans un viewBox 200 × 330 décalé vers le haut
const BODY =
  "M89 22L111 22L111 92C111 106 166 122 175 172C183 222 150 244 100 244C50 244 17 222 25 172C34 122 89 106 89 92Z";
const WAVE = (() => {
  let d = "M-200 128";
  for (let k = 0; k < 20; k++) d += "q12.5 -5 25 0t25 0";
  return d + "V262H-200Z";
})();

/** Détourage du lot, puis photo produit, puis image neutre. */
const LotImg = ({ p }: { p: Product }) => {
  const srcs = useMemo(() => cutSources(p), [p]);
  const [i, setI] = useState(0);
  return (
    <img
      src={srcs[i]}
      alt={`${p.name}, ${typeLabel(p).toLowerCase()} CBD`}
      decoding="async"
      draggable={false}
      className={srcs[i] === p.image ? "ph" : "cut"}
      onError={(e) => {
        if (i + 1 < srcs.length) setI(i + 1);
        else if (!e.currentTarget.src.endsWith("/placeholder.svg")) e.currentTarget.src = "/placeholder.svg";
      }}
    />
  );
};

const Decantation = ({ p }: { p: Product }) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  // lot hors collection : une étoile gravée plutôt qu'un numéro qu'il n'a pas
  const num = lotNumber(p);
  return (
    <div className="sm-decant">
      <div className="sm-niche">
        <span className={`sm-niche-num${num ? "" : " is-star"}`} aria-hidden="true">{num ?? "✦"}</span>
        <span className="sm-niche-beam" aria-hidden="true" />

        <svg className="sm-carafe" viewBox="0 -80 200 330" aria-hidden="true" focusable="false">
          <defs>
            <clipPath id={`${uid}b`}>
              <path d={BODY} />
            </clipPath>
            <linearGradient id={`${uid}g`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FBE7A6" />
              <stop offset=".35" stopColor="#E9C977" />
              <stop offset=".7" stopColor="#B8913E" />
              <stop offset="1" stopColor="#7D6936" />
            </linearGradient>
            <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F4DC92" stopOpacity="0" />
              <stop offset=".25" stopColor="#F4DC92" />
              <stop offset="1" stopColor="#C9A24A" />
            </linearGradient>
          </defs>

          {/* le filet d'or qui coule dans le col */}
          <rect className="sm-stream" x="98.4" y="-80" width="3.2" height="262" rx="1.6" fill={`url(#${uid}s)`} />

          <g clipPath={`url(#${uid}b)`}>
            <rect className="sm-glass-fill" x="0" y="0" width="200" height="250" />
            <rect className="sm-liquid" x="0" y="128" width="200" height="122" fill={`url(#${uid}g)`} />
            <g className="sm-surface">
              <path className="sm-wave" d={WAVE} fill={`url(#${uid}g)`} />
            </g>
            <circle className="sm-bub b1" cx="78" cy="226" r="2.4" />
            <circle className="sm-bub b2" cx="118" cy="232" r="1.8" />
            <circle className="sm-bub b3" cx="100" cy="220" r="1.4" />
          </g>

          <path className="sm-glass" d={BODY} />
          <path className="sm-glint" d="M46 168C42 196 54 218 76 230" />
          <path className="sm-glint thin" d="M106 30L106 88" />
          <ellipse className="sm-glass" cx="100" cy="22" rx="14" ry="3.4" />
        </svg>

        <span className="sm-burst" aria-hidden="true" />

        <div className="sm-lot">
          <LotImg key={p.id} p={p} />
        </div>
        <span className="sm-lot-ring" aria-hidden="true" />
      </div>
    </div>
  );
};

export default Decantation;
