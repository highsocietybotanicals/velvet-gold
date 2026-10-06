import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { isLowEnd } from "@/components/minuit/minuitData";

/*
 * Bandeau « salle de contrôle » de l'administration (purement visuel).
 * Titre gravé déduit de la route affichée, horloge en Geist Mono, ligne d'oscilloscope dorée.
 * Aucune donnée chargée, aucune action : le seul élément interactif est le bouton passé en enfant.
 */

type Section = { path: string; title: string; sub: string };

// Même ordre que la barre latérale : le numéro affiché suit cet ordre.
const SECTIONS: Section[] = [
  { path: "/admin/tableau-de-bord", title: "Tableau de bord", sub: "Vue d'ensemble de la maison" },
  { path: "/admin/commandes", title: "Commandes", sub: "Registre des commandes" },
  { path: "/admin/clients", title: "Clients", sub: "Carnet de la clientèle" },
  { path: "/admin/produits", title: "Produits", sub: "Catalogue des fleurs et des résines" },
  { path: "/admin/inventaire", title: "Inventaire", sub: "Stock en grammes, variété par variété" },
  { path: "/admin/prix", title: "Gestion des prix", sub: "Grille tarifaire du site" },
  { path: "/admin/rentabilite", title: "Rentabilité", sub: "Coûts, marges et bénéfice par commande" },
  { path: "/admin/pro", title: "Pro & Facturation", sub: "Comptes professionnels et factures" },
  { path: "/admin/marketing", title: "Marketing", sub: "Avis en attente et réseaux sociaux" },
  { path: "/admin/logistique", title: "Logistique", sub: "Commandes manuelles, codes et trajets" },
  { path: "/admin/comptabilite", title: "Comptabilité", sub: "Livre des comptes" },
  { path: "/admin/commerciaux", title: "Commerciaux", sub: "Réseau commercial terrain" },
];

const sectionOf = (pathname: string) => {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/admin") return { n: 1, title: SECTIONS[0].title, sub: SECTIONS[0].sub };
  const i = SECTIONS.findIndex((s) => p === s.path || p.startsWith(s.path + "/"));
  if (i < 0) return { n: 0, title: "Administration", sub: "Salle de contrôle" };
  const s = SECTIONS[i];
  if (s.path === "/admin/clients" && p !== s.path) return { n: i + 1, title: "Fiche client", sub: s.sub };
  return { n: i + 1, title: s.title, sub: s.sub };
};

const pad = (n: number) => String(n).padStart(2, "0");

/*
 * Tracé d'oscilloscope : sinusoïde dont l'amplitude respire par salves.
 * Deux périodes identiques (0-1200 et 1200-2400) : une translation de -50 % boucle sans raccord visible.
 * Une demi-onde par courbe de Bézier quadratique : le tracé reste léger.
 */
const WAVE = (() => {
  const H = 12; // ligne de base (viewBox haut de 24)
  const half = 1200 / 36; // 18 ondes par période
  let d = `M0 ${H}`;
  for (let k = 0; k < 72; k++) {
    const x0 = k * half;
    const xm = x0 + half / 2;
    const env = 1 + 7 * Math.pow(Math.sin((Math.PI * xm) / 400), 4); // salves toutes les 400 unités
    const cy = H + (k % 2 === 0 ? -2 : 2) * env * 0.92;
    d += ` Q${xm.toFixed(1)} ${cy.toFixed(1)} ${(x0 + half).toFixed(1)} ${H}`;
  }
  return d;
})();

const AdminConsoleBar = ({ children }: { children?: ReactNode }) => {
  const { pathname } = useLocation();
  const sec = sectionOf(pathname);
  const rootRef = useRef<HTMLDivElement>(null);

  // Réglages lus une fois : petit écran ou mouvement réduit → heures et minutes seulement.
  const [withSeconds] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(min-width: 640px) and (prefers-reduced-motion: no-preference)").matches
  );
  const [lite] = useState(() => isLowEnd());
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(() => typeof document === "undefined" || !document.hidden);
  const [now, setNow] = useState(() => new Date());
  const on = inView && pageVisible;

  // L'horloge et l'oscilloscope ne tournent que si le bandeau est à l'écran et l'onglet visible.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!on) return;
    let t = 0;
    const tick = () => {
      const d = new Date();
      setNow(d);
      const wait = withSeconds ? 1000 - d.getMilliseconds() : 60000 - d.getSeconds() * 1000 - d.getMilliseconds();
      t = window.setTimeout(tick, wait + 20);
    };
    tick();
    return () => window.clearTimeout(t);
  }, [on, withSeconds]);

  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  const date = now.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

  const cls = ["adm-band", !on && "is-idle", lite && "is-lite"].filter(Boolean).join(" ");
  // Clé d'affichage : à chaque nouvelle section, la plaque se regrave et un reflet glisse sur la laque.
  const stage = `${sec.n}-${sec.title}`;

  return (
    <div ref={rootRef} className={cls}>
      <span key={`sheen-${stage}`} className="adm-sheen" aria-hidden="true" />
      <div className="adm-band-row">
        {children}

        <div key={`plate-${stage}`} className="adm-plate">
          <p className="adm-kick">
            <span>Administration</span>
            {sec.n > 0 && <span className="adm-no" aria-hidden="true">N° {pad(sec.n)}</span>}
          </p>
          <p className="adm-title">{sec.title}</p>
          <p className="adm-sub">{sec.sub}</p>
          {sec.n > 0 && (
            <span className="adm-ghost" aria-hidden="true">
              {pad(sec.n)}
            </span>
          )}
        </div>

        <div className="adm-clock" aria-hidden="true">
          <span className="adm-time">
            <span className="adm-lamp" />
            {hh}:{mm}
            {withSeconds && <small>:{ss}</small>}
          </span>
          <span className="adm-date">{date}</span>
        </div>
      </div>

      <div className="adm-scope" aria-hidden="true">
        <svg className="adm-wave" viewBox="0 0 2400 24" preserveAspectRatio="none" focusable="false">
          <path className="adm-glow" d={WAVE} />
          <path className="adm-line" d={WAVE} />
        </svg>
        <span className="adm-pen" />
      </div>
      <div className="adm-ruler" aria-hidden="true" />
    </div>
  );
};

export default AdminConsoleBar;
