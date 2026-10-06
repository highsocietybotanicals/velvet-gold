import { useRef } from "react";
import { Link } from "react-router-dom";
import emblemSvg from "@/assets/brand/hsb-emblem.svg?raw";
import { AMBIANCE } from "@/components/minuit/minuitData";
import SocieteSky from "@/components/minuit/areas/societe/SocieteSky";
import { Numeral, Shutter, SoImg } from "@/components/minuit/areas/societe/ManifestoParts";
import { useManifesto } from "@/components/minuit/areas/societe/useManifesto";
import "@/components/minuit/areas/societe/societe.css";

// « Le manifeste » : la page La Société en quatre chapitres, sur un paysage de nuit traversé de lignes haute tension.
// Textes sans allégation d'effet : arômes, sélection, méthode, conformité. Aucun chiffre ni fait inventé.

const values = [
  {
    title: "Sélection rigoureuse",
    description: "Seules les génétiques les plus prometteuses intègrent notre collection.",
  },
  {
    title: "Œil de joaillier",
    description: "Chaque lot est sélectionné à la main, à l'œil, avant d'entrer dans la collection.",
  },
  {
    title: "Passion artisanale",
    description: "De la sélection à l'emballage, chaque étape est réalisée avec une attention méticuleuse.",
  },
];

const chapters = [
  { id: "so-ch-1", n: "I", title: "De la rue à la maison" },
  { id: "so-ch-2", n: "II", title: "La sélection à la main" },
  { id: "so-ch-3", n: "III", title: "La nuit pour signature" },
  { id: "so-ch-4", n: "IV", title: "L'engagement" },
];

const AboutSection = () => {
  const rootRef = useRef<HTMLElement>(null);
  useManifesto(rootRef);

  return (
    <section id="societe" ref={rootRef} className="so-root" aria-labelledby="so-title">
      <SocieteSky />

      <div className="so-flow">
        {/* ---- prologue ---- */}
        <div className="so-hero">
          <div className="so-hero-in">
            <p className="so-kicker">Notre histoire · Le manifeste</p>
            <h1 id="so-title" className="so-h1">
              <span className="so-line"><span>La Société</span></span>
              <span className="so-line"><span className="so-choc so-foil">Le manifeste</span></span>
            </h1>
            <p className="so-lead">
              High Society Botanicals, maison française de CBD premium. Quatre chapitres pour dire d'où nous venons,
              comment nous choisissons, et ce à quoi nous nous engageons.
            </p>
            <nav className="so-toc" aria-label="Chapitres du manifeste">
              <ol>
                {chapters.map((c) => (
                  <li key={c.id}>
                    <a href={`#${c.id}`}><b aria-hidden="true">{c.n}</b><span>{c.title}</span></a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          <p className="so-cue" aria-hidden="true"><i /><span>Défilez, le courant suit votre lecture</span></p>
        </div>

        {/* ---- I · de la rue à la maison ---- */}
        <section id="so-ch-1" className="so-ch" aria-labelledby="so-ch-1-t">
          <Numeral n="I" />
          <div className="so-plate">
            <div className="so-plate-in">
              <p className="so-kicker">Chapitre I<span className="so-of" aria-hidden="true">I — IV</span></p>
              <h2 id="so-ch-1-t" className="so-h2">
                <span>De la rue</span>
                <span className="so-choc so-foil">à la maison.</span>
              </h2>
              <p className="so-say">Une maison française née entre les lignes haute tension et la rue.</p>
              <p className="so-txt">
                <strong>High Society Botanicals</strong> est née d'une passion commune pour l'excellence botanique
                et d'un désir de redéfinir les standards du marché du CBD.
              </p>
              <p className="so-txt">
                L'aplomb de la rue, l'exigence d'une maison de joaillerie&nbsp;: c'est notre ligne, et nous la tenons
                d'un bout à l'autre de la collection.
              </p>
              <p className="so-brass"><span>Maison française</span><b>Abbaretz</b><span>Loire-Atlantique · 44</span></p>
            </div>
            <Shutter n="I" />
          </div>
        </section>

        {/* ---- II · la sélection à la main ---- */}
        <section id="so-ch-2" className="so-ch is-right is-wide" aria-labelledby="so-ch-2-t">
          <Numeral n="II" />
          <div className="so-plate">
            <div className="so-plate-in">
              <div className="so-split">
                <div>
                  <p className="so-kicker">Chapitre II<span className="so-of" aria-hidden="true">II — IV</span></p>
                  <h2 id="so-ch-2-t" className="so-h2">
                    <span>La sélection</span>
                    <span className="so-choc so-foil">à la main.</span>
                  </h2>
                  <p className="so-say">
                    On choisit chaque lot comme un joaillier choisit une pierre&nbsp;: à l'œil, à la main, sans compromis.
                  </p>
                  <p className="so-txt">
                    Notre maison sélectionne avec une rigueur absolue les plus belles génétiques, pour offrir à nos
                    membres une collection d'arômes et de textures d'exception. Chaque variété est le fruit d'un travail
                    méticuleux, alliant traditions ancestrales et innovations modernes.
                  </p>
                </div>
                <figure className="so-arch">
                  <SoImg
                    srcs={AMBIANCE.duo}
                    alt="Deux têtes de fleur CBD, l'une givrée blanche, l'autre violette naturelle, sur un socle d'onyx"
                  />
                  <figcaption>Sélectionné à la main</figcaption>
                </figure>
              </div>
              <ol className="so-vals">
                {values.map((value, index) => (
                  <li key={value.title}>
                    <span className="so-no">N° {String(index + 1).padStart(2, "0")}</span>
                    <h3>{value.title}</h3>
                    <p>{value.description}</p>
                  </li>
                ))}
              </ol>
            </div>
            <Shutter n="II" />
          </div>
        </section>

        {/* ---- III · la nuit pour signature ---- */}
        <section id="so-ch-3" className="so-ch is-wide" aria-labelledby="so-ch-3-t">
          <Numeral n="III" />
          <div className="so-plate">
            <div className="so-plate-in">
              <div className="so-split">
                <div>
                  <p className="so-kicker">Chapitre III<span className="so-of" aria-hidden="true">III — IV</span></p>
                  <h2 id="so-ch-3-t" className="so-h2">
                    <span>La nuit</span>
                    <span className="so-choc so-foil">pour signature.</span>
                  </h2>
                  <p className="so-say">
                    Noir profond, feuille d'or, néon&nbsp;: chaque lot est présenté comme une pièce de joaillerie,
                    numéroté dans la Collection N°&nbsp;26.
                  </p>
                  <ul className="so-ticket">
                    <li><span>Le pochon</span><b>Scellé, damas noir et or</b></li>
                    <li><span>L'expédition</span><b>Discrète, en 48&nbsp;h</b></li>
                    <li><span>En main propre</span><b>Autour du 44</b></li>
                    <li><span>Par tranche de 10&nbsp;g</span><b>Kit (briquet et feuilles) et échantillon de 1&nbsp;g offerts</b></li>
                  </ul>
                </div>
                <figure className="so-vitrine">
                  <span className="so-neon-w" aria-hidden="true">Minuit</span>
                  <SoImg srcs={AMBIANCE.violette} alt="Tête de fleur CBD aux reflets sombres, sous un projecteur" />
                  <figcaption>Collection N°&nbsp;26</figcaption>
                </figure>
              </div>
            </div>
            <Shutter n="III" />
          </div>
        </section>

        {/* ---- IV · l'engagement ---- */}
        <section id="so-ch-4" className="so-ch is-right" aria-labelledby="so-ch-4-t">
          <Numeral n="IV" />
          <div className="so-plate">
            <div className="so-plate-in">
              <p className="so-kicker">Chapitre IV<span className="so-of" aria-hidden="true">IV — IV</span></p>
              <h2 id="so-ch-4-t" className="so-h2">
                <span>L'engagement</span>
                <span className="so-choc so-foil">de la maison.</span>
              </h2>
              <p className="so-say">Trois poinçons, comme sur une pièce d'orfèvrerie. Ils ne se négocient pas.</p>
              <ul className="so-marks">
                <li>
                  <span className="so-stamp" aria-hidden="true"><b>&lt;0,3</b><small>% THC</small></span>
                  <div>
                    <h3>THC &lt; 0,3&nbsp;%</h3>
                    <p>Le seuil fixé par la réglementation française.</p>
                  </div>
                </li>
                <li>
                  <span className="so-stamp" aria-hidden="true"><b>LABO</b><small>sur demande</small></span>
                  <div>
                    <h3>Analyse sur demande</h3>
                    <p>L'analyse laboratoire est disponible sur simple demande.</p>
                  </div>
                </li>
                <li>
                  <span className="so-stamp" aria-hidden="true"><b>18+</b><small>majeurs</small></span>
                  <div>
                    <h3>Majeurs uniquement</h3>
                    <p>La maison est réservée aux personnes majeures.</p>
                  </div>
                </li>
              </ul>
            </div>
            <Shutter n="IV" />
          </div>
        </section>

        {/* ---- coda : le courant arrive, le néon s'allume ---- */}
        <div className="so-coda">
          <div className="so-emb" aria-hidden="true" dangerouslySetInnerHTML={{ __html: emblemSvg }} />
          <p className="so-neon" aria-hidden="true">
            <span className="so-neon-off">High Society</span>
            <span className="so-neon-on">High Society</span>
            <small>Botanicals · Maison de nuit</small>
          </p>
          <h2 className="so-h2">
            <span>Une question&nbsp;?</span>
            <span className="so-choc so-foil">Écrivez à la maison.</span>
          </h2>
          <p className="so-txt">Un lot, une demande d'analyse, une livraison en main propre&nbsp;: nous vous lisons.</p>
          <Link to="/contact" className="so-cta">
            En Savoir Plus
          </Link>
          <p className="so-foot">Maison française · Abbaretz (44) · <b>THC&nbsp;&lt;&nbsp;0,3&nbsp;%</b> · Réservé aux majeurs</p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
