/* High Society Botanicals — ouverture « lévitation » (plongée dans l'emblème + produits détourés en lévitation).
   Composant fourni clé en main et testé hors Lovable : NE PAS réécrire la logique ni le CSS. */
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import emblemRaw from "@/assets/brand/hsb-emblem.svg?raw";
// WebP à la taille d'origine (w=1200 est borné par vite-imagetools à la largeur source) : les w/h déclarés ci-dessous restent exacts.
import mango from "@/assets/flowers/mango-x-ice-real.jpg?w=1200&quality=82&format=webp";
import platinum from "@/assets/flowers/platinum-og-real.jpg?w=1200&quality=82&format=webp";
import lemon from "@/assets/resins/lemon-punch-hash-real.jpg?w=1200&quality=82&format=webp";
import bhm from "@/assets/resins/bhm-real.jpg?w=1200&quality=82&format=webp";
import { mountLevitation, type LevitationProduct } from "./levitationEngine";
import "./levitation-hero.css";

const PRODUCTS: LevitationProduct[] = [
  { name: "Mango X Ice", cat: "Fleur exotique", src: mango, w: 768, h: 1024 },
  { name: "Platinum OG", cat: "Fleur · Cali Genetics", src: platinum, w: 1024, h: 1024 },
  { name: "Lemon Punch Hash", cat: "Résine · Force Noire", src: lemon, w: 1200, h: 1200 },
  { name: "BHM", cat: "Résine exotique", src: bhm, w: 1200, h: 1200 },
];

const EMBLEM_PATH = (emblemRaw.match(/\sd="([^"]+)"/) || [])[1] || "";

const LevitationHero = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current || !EMBLEM_PATH) return;
    return mountLevitation(rootRef.current, { products: PRODUCTS, emblemPath: EMBLEM_PATH, blend: true });
  }, []);

  return (
    <div ref={rootRef} className="lh-root">
      <section className="lh-pin lh-dive" data-lh="dive">
        <div className="lh-sticky">
          <canvas className="lh-emblemCanvas" data-lh="emblemCanvas" role="img" aria-label="Emblème High Society Botanicals" />
          <p className="lh-kicker">Maison de fleurs &amp; résines CBD</p>
          <div className="lh-flash" data-lh="flash" />
          <p className="lh-hint">Défiler<i /></p>
        </div>
      </section>

      <section className="lh-pin lh-show" data-lh="show">
        <div className="lh-sticky">
          <div className="lh-light" />
          <div className="lh-cone" />
          <canvas className="lh-bokehBack" data-lh="bokehBack" aria-hidden="true" />
          <div className="lh-giant" data-lh="giant" aria-hidden="true" />
          <div className="lh-floor" />
          <div className="lh-stage3d"><div className="lh-rig" data-lh="rig" /></div>
          <canvas className="lh-bokehFront" data-lh="bokehFront" aria-hidden="true" />
          <div className="lh-hud" data-lh="hud"><b>01</b> / 04</div>
          <div className="lh-title" data-lh="title"><h2 data-lh="tName" /><p data-lh="tCat" /></div>
          <div className="lh-ctaRow" data-lh="cta">
            <Link className="lh-btn lh-solid" to="/catalogue">Explorer la collection</Link>
            <Link className="lh-btn" to="/sommelier">Le Sommelier</Link>
          </div>
          <div className="lh-bar"><i data-lh="barI" /></div>
        </div>
      </section>
    </div>
  );
};

export default LevitationHero;
