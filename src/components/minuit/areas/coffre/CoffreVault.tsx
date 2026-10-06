// Le Coffre : en-tête « La salle des coffres ».
// Porte de coffre-fort monumentale en CSS 3D (anneaux d'acier brossé, 12 pênes dorés, volant à trois branches,
// gravure « HSB · Collection N° 26 »). Au chargement : le volant fait un tour, les pênes se rétractent,
// la porte pivote sur sa charnière et la lumière d'or révèle le titre. Tout est en CSS (coffre.css) :
// aucune boucle JS, et l'état de repos est la porte ouverte (mouvement réduit : rien ne bouge).
// Visites suivantes dans la même session : data-seen abrège la séquence à environ 0,8 s (présentation seule).
import { useEffect, useRef, useState, type CSSProperties } from "react";
import emblemSvg from "@/assets/brand/hsb-emblem.svg?raw";
import { LITE, useInViewAttr } from "./useInViewAttr";

const BOLTS = Array.from({ length: 12 }, (_, i) => i);
const SPOKES = [0, 1, 2];
const ENGRAVE = "HSB · COLLECTION N° 26 · HSB · COLLECTION N° 26 · ";
const FACTS = ["Sélection à la main", "THC < 0,3 %", "Expédition discrète 48 h"];
const SEEN_KEY = "hsb-coffre-ouvert";

/** Lu une seule fois, avant le premier rendu, pour que la séquence abrégée parte dès la première image. */
const readSeen = () => {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
};

const CoffreVault = () => {
  const ref = useRef<HTMLElement>(null);
  const [seen] = useState(readSeen);
  useInViewAttr(ref);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* stockage indisponible (navigation privée) : la séquence complète se rejoue, sans conséquence */
    }
  }, []);

  return (
    <section ref={ref} className="cf-hero" aria-labelledby="cf-title" data-seen={seen ? "" : undefined}>
      <div className="cf-wall" aria-hidden="true" />
      <div className="cf-spots" aria-hidden="true">
        <i />
        <i />
      </div>

      <p className="cf-neon">Salle des coffres</p>

      <div className="cf-vault">
        <div className="cf-flood" aria-hidden="true" />
        <div className="cf-asm">
          {/* l'intérieur du coffre : lumière d'or et rangées de casiers, en retrait */}
          <div className="cf-inside" aria-hidden="true">
            <span className="cf-rays" />
          </div>

          <h1 id="cf-title" className="cf-title">
            <span className="cf-t-le">Le</span>{" "}
            <span className="cf-t-cf">Coffre</span>
            <span className="cf-t-sheen" aria-hidden="true" />
          </h1>

          {/* dormant : anneau d'acier, gâches des pênes, rivets */}
          <div className="cf-jamb" aria-hidden="true">
            <svg viewBox="0 0 256 256">
              <circle className="cf-jamb-rim" cx="128" cy="128" r="126.4" />
              <circle className="cf-jamb-rivets" cx="128" cy="128" r="117" />
              {BOLTS.map((i) => (
                <rect key={i} className="cf-jamb-notch" x="124.2" y="14.5" width="7.6" height="14.5" rx="1.2" transform={`rotate(${i * 30} 128 128)`} />
              ))}
              <circle className="cf-jamb-lip" cx="128" cy="128" r="100.6" />
            </svg>
          </div>
          <span className="cf-hinge t" aria-hidden="true" />
          <span className="cf-hinge b" aria-hidden="true" />

          {/* la porte : volant, gravure, pênes, épaisseur et dos */}
          <div className="cf-door" aria-hidden="true">
            {!LITE && (
              <>
                <span className="cf-slab s3" />
                <span className="cf-slab s2" />
                <span className="cf-slab s1" />
              </>
            )}
            <span className="cf-back" />
            <span className="cf-bolts">
              {BOLTS.map((i) => (
                <span key={i} className="cf-arm" style={{ "--i": i } as CSSProperties}>
                  <i className="cf-bolt" />
                </span>
              ))}
            </span>
            <span className="cf-face">
              <svg className="cf-engrave" viewBox="0 0 200 200">
                <defs>
                  <path id="cf-engrave-path" d="M100,100 m-79,0 a79,79 0 1,1 158,0 a79,79 0 1,1 -158,0" />
                </defs>
                <circle className="cf-eg-line" cx="100" cy="100" r="91.5" />
                <circle className="cf-eg-line" cx="100" cy="100" r="73.5" />
                <text className="cf-eg-shade">
                  <textPath href="#cf-engrave-path" textLength="488" lengthAdjust="spacing">{ENGRAVE}</textPath>
                </text>
                <text className="cf-eg-text">
                  <textPath href="#cf-engrave-path" textLength="488" lengthAdjust="spacing">{ENGRAVE}</textPath>
                </text>
              </svg>
              <span className="cf-core" />
            </span>
            <span className="cf-spindle" />
            <span className="cf-wheel">
              {SPOKES.map((k) => (
                <span key={k} className="cf-spoke" style={{ "--k": k } as CSSProperties} />
              ))}
              <span className="cf-hub">
                <span className="cf-emb" dangerouslySetInnerHTML={{ __html: emblemSvg }} />
              </span>
            </span>
          </div>
        </div>
        <div className="cf-floor" aria-hidden="true" />
      </div>

      <div className="cf-hero-txt">
        <p className="cf-kicker">Collection N° 26 · Maison d'Abbaretz</p>
        <p className="cf-lead">
          Fleurs et résines CBD, rangées lot par lot. Chaque variété est sélectionnée à la main par notre maison
          d'Abbaretz, en Loire-Atlantique.
        </p>
        <ul className="cf-facts">
          {FACTS.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
      <span className="cf-cue" aria-hidden="true">
        Les casiers
        <i />
      </span>
    </section>
  );
};

export default CoffreVault;
