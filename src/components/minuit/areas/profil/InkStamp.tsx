// Tampon d'encre dorée d'une commande passée (date, montant, statut : textes fournis par l'historique).
// Purement visuel : l'inclinaison est tirée de l'identifiant de la commande pour rester stable d'un affichage à l'autre.
import { useId, type CSSProperties } from "react";

const tiltOf = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return (Math.abs(h) % 15) - 7; // de -7° à +7°
};

interface InkStampProps {
  seed: string;
  day: string;
  year: string;
  amount: string;
  status: string;
  statusKey: string;
}

export const InkStamp = ({ seed, day, year, amount, status, statusKey }: InkStampProps) => {
  const arc = `pf-arc-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <span
      className="pf-stamp"
      data-pf-stamp=""
      data-status={statusKey}
      aria-hidden="true"
      style={{ "--tilt": `${tiltOf(seed)}deg` } as CSSProperties}
    >
      <svg className="pf-stamp-ring" viewBox="0 0 120 120" focusable="false">
        <defs>
          <path id={arc} d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
        </defs>
        <circle className="o" cx="60" cy="60" r="57" />
        <circle className="m" cx="60" cy="60" r="52.2" />
        <circle className="i" cx="60" cy="60" r="35.5" />
        <text className="arc">
          <textPath href={`#${arc}`} textLength="270" lengthAdjust="spacing">
            HIGH SOCIETY ✦ BOTANICALS ✦ MAISON DE NUIT ✦
          </textPath>
        </text>
      </svg>
      <span className="pf-stamp-c">
        <span className="d">{day}</span>
        <span className="y">{year}</span>
        {/* affichage seul : un montant long (4 chiffres et plus avant la virgule) est composé plus petit pour rester dans le cercle */}
        <span className="a" data-len={amount.length > 7 ? "long" : undefined}>{amount}</span>
      </span>
      <span className="pf-stamp-st">{status}</span>
    </span>
  );
};
