import { useEffect, useRef } from "react";
import { isLowEnd } from "@/components/minuit/minuitData";
import { embStyle } from "./proEmblem";

interface Props {
  /** Raison sociale affichée sur la carte (repli : « Maison partenaire »). */
  holder?: string | null;
  /** Carte vierge : dossier encore à l'étude. */
  pending?: boolean;
}

// Pose de repos (en fraction du débattement) : la carte se présente de trois quarts.
const REST_X = -0.55;
const REST_Y = -0.3;

/**
 * Carte de membre du salon privé : métal noir brossé, emblème doré en relief, numéro gravé,
 * reflet holographique doré. Souris : la carte s'incline et le reflet suit le pointeur.
 * Tactile : balayage automatique lent. Mouvement réduit : pose fixe. Décor pur (aria-hidden).
 */
const ProMemberCard = ({ holder, pending = false }: Props) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const card = cardRef.current;
    if (!scene || !card) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 900px)").matches;
    // Téléphone modeste : entrée en scène conservée, mais pas de balayage continu.
    const low = !fine && isLowEnd();
    scene.classList.add(reduce || low ? "is-still" : fine ? "is-hover" : "is-auto");
    if (!reduce) scene.classList.add("is-armed");

    let visible = false;
    let raf = 0;
    let hover = false;
    let tx = REST_X, ty = REST_Y, cx = REST_X, cy = REST_Y;

    const apply = () => {
      card.style.setProperty("--rx", `${(-cy * 12).toFixed(2)}deg`);
      card.style.setProperty("--ry", `${(cx * 16).toFixed(2)}deg`);
      card.style.setProperty("--px", cx.toFixed(3));
      card.style.setProperty("--py", cy.toFixed(3));
    };
    const tick = () => {
      cx += (tx - cx) * 0.1;
      cy += (ty - cy) * 0.1;
      apply();
      const settled = Math.abs(tx - cx) < 0.002 && Math.abs(ty - cy) < 0.002;
      if (!visible || (!hover && settled)) { raf = 0; return; }
      raf = requestAnimationFrame(tick);
    };
    const run = () => { if (!raf && visible) raf = requestAnimationFrame(tick); };

    // Animations et boucle uniquement quand la carte est à l'écran.
    let reported = false;
    const io = "IntersectionObserver" in window
      ? new IntersectionObserver(([e]) => {
          reported = true;
          visible = e.isIntersecting;
          scene.classList.toggle("is-live", visible);
          if (visible) scene.classList.add("is-seen");
          else if (raf) { cancelAnimationFrame(raf); raf = 0; }
        }, { threshold: 0.12 })
      : null;
    if (io) io.observe(scene);
    else { visible = true; scene.classList.add("is-live", "is-seen"); }
    // Filet de sécurité : si l'observateur ne répond jamais (prérendu, capture…), la carte ne reste pas invisible.
    const failsafe = window.setTimeout(() => { if (!reported) scene.classList.add("is-seen"); }, 2500);

    if (reduce || !fine) return () => { window.clearTimeout(failsafe); io?.disconnect(); };

    apply();
    const onEnter = () => { hover = true; scene.classList.add("is-on"); run(); };
    const onMove = (e: PointerEvent) => {
      const r = scene.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      run();
    };
    const onLeave = () => { hover = false; tx = REST_X; ty = REST_Y; scene.classList.remove("is-on"); run(); };
    scene.addEventListener("pointerenter", onEnter);
    scene.addEventListener("pointermove", onMove);
    scene.addEventListener("pointerleave", onLeave);
    return () => {
      window.clearTimeout(failsafe);
      io?.disconnect();
      if (raf) cancelAnimationFrame(raf);
      scene.removeEventListener("pointerenter", onEnter);
      scene.removeEventListener("pointermove", onMove);
      scene.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const name = holder?.trim() || (pending ? "Dossier à l'étude" : "Maison partenaire");

  return (
    <div ref={sceneRef} className={`pr-scene${pending ? " is-pending" : ""}`} aria-hidden="true">
      <div className="pr-rise">
        <div className="pr-float">
          <div ref={cardRef} className="pr-card">
            <i className="pr-card-edge e2" />
            <i className="pr-card-edge e1" />
            <div className="pr-card-face">
              <i className="pr-card-holo" />
              <i className="pr-card-glare" />
              <div className="pr-card-top">
                <span className="pr-card-mark">
                  High Society
                  <small>Botanicals · Maison de nuit</small>
                </span>
                <span className="pr-card-tag">Salon privé</span>
              </div>
              <span className="pr-card-no">PRO · N° 26</span>
              <dl className="pr-card-foot">
                <div className="h">
                  <dt>Titulaire</dt>
                  <dd>{name}</dd>
                </div>
                <div className="m">
                  <dt>Maison</dt>
                  <dd>Abbaretz · 44</dd>
                </div>
              </dl>
              {pending && <span className="pr-card-stamp">Gravure en cours</span>}
            </div>
            <div className="pr-card-emb" style={embStyle}>
              <i className="s2" />
              <i className="s1" />
              <i className="hi" />
              <i className="au" />
              <span className="sheen"><i /></span>
            </div>
          </div>
        </div>
      </div>
      <i className="pr-card-floor" />
    </div>
  );
};

export default ProMemberCard;
