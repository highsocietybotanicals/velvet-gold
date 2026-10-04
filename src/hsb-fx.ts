// @ts-nocheck
/* ==========================================================================
   HSB FX — effets 3D « waouh » pour tout le site High Society Botanicals.
   Un seul fichier, aucune dépendance. S'applique automatiquement à tout le
   site (y compris aux éléments ajoutés plus tard par React).
   Installation : dans src/main.tsx →  import { startHsbFx } from "./hsb-fx";
                                        import "./hsb-fx.css";  startHsbFx();
   Ciblage automatique : .product-card, .btn-luxury, .btn-luxury-outline,
   h1/h2 .font-display, images de contenu. Ajout manuel possible avec les
   attributs data-fx="tilt" | "magnet" | "reveal" | "parallax" | "split".
   ========================================================================== */

const SEL = {
  tilt: '.product-card, [data-fx~="tilt"]',
  magnet: '.btn-luxury, .btn-luxury-outline, [data-fx~="magnet"]',
  split: 'main h1.font-display, main h2.font-display, [data-fx~="split"]',
  reveal: 'main section, [data-fx~="reveal"]',
  parallax: '.product-card img, [data-fx~="parallax"]',
  interactive: 'a, button, [role="button"], input, select, textarea, label, .product-card',
};
const EXCLUDE = '.lh-root, [data-fx-off], [data-radix-popper-content-wrapper], [role="dialog"], nav[aria-label="admin"], .admin';

let started = false;

export function startHsbFx() {
  if (started || typeof window === 'undefined') return;
  started = true;
  if (location.pathname.startsWith('/admin')) return; // jamais dans l'administration

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches; // souris
  document.documentElement.classList.add('hsb-fx', fine ? 'hsb-fx-mouse' : 'hsb-fx-touch');
  if (reduce) { document.documentElement.classList.add('hsb-fx-reduced'); return; }

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const done = new WeakSet();
  const excluded = (el) => !!el.closest(EXCLUDE);

  /* ---------------- one shared animation loop ---------------- */
  const tickers = new Set();
  let raf = 0;
  const loop = (t) => { tickers.forEach((f) => f(t)); raf = tickers.size ? requestAnimationFrame(loop) : 0; };
  const addTick = (f) => { tickers.add(f); if (!raf) raf = requestAnimationFrame(loop); };
  const delTick = (f) => tickers.delete(f);

  /* ---------------- 1. 3D tilt + glare (cards) ---------------- */
  function tilt(el) {
    if (!fine) return; // sur mobile : effet d'apparition 3D uniquement (voir reveal)
    el.classList.add('fx-tilt');
    const glare = document.createElement('span'); glare.className = 'fx-glare'; glare.setAttribute('aria-hidden', 'true');
    el.appendChild(glare);
    let tx = 0, ty = 0, cx = 0, cy = 0, hover = false;
    const f = () => {
      cx += (tx - cx) * 0.14; cy += (ty - cy) * 0.14;
      el.style.setProperty('--rx', `${(-cy * 9).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${(cx * 11).toFixed(2)}deg`);
      el.style.setProperty('--gx', `${(50 + cx * 50).toFixed(1)}%`);
      el.style.setProperty('--gy', `${(50 + cy * 50).toFixed(1)}%`);
      if (!hover && Math.abs(cx) < 0.002 && Math.abs(cy) < 0.002) { delTick(f); el.classList.remove('fx-tilting'); }
    };
    el.addEventListener('pointerenter', () => { hover = true; el.classList.add('fx-tilting'); addTick(f); });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      tx = clamp((e.clientX - r.left) / r.width - 0.5, -0.5, 0.5) * 2;
      ty = clamp((e.clientY - r.top) / r.height - 0.5, -0.5, 0.5) * 2;
    });
    el.addEventListener('pointerleave', () => { hover = false; tx = 0; ty = 0; });
  }

  /* ---------------- 2. magnetic buttons + shine ---------------- */
  function magnet(el) {
    el.classList.add('fx-magnet');
    if (!fine) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, hover = false;
    const f = () => {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      el.style.setProperty('--mx', `${cx.toFixed(2)}px`); el.style.setProperty('--my', `${cy.toFixed(2)}px`);
      if (!hover && Math.abs(cx) < 0.05 && Math.abs(cy) < 0.05) delTick(f);
    };
    el.addEventListener('pointerenter', () => { hover = true; addTick(f); });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * 0.28; ty = (e.clientY - (r.top + r.height / 2)) * 0.4;
    });
    el.addEventListener('pointerleave', () => { hover = false; tx = 0; ty = 0; });
  }

  /* ---------------- 3. titles: letters flip up in 3D ---------------- */
  function split(el) {
    if (el.querySelector('.fx-ch') || el.children.length > 0) return; // titres en texte simple uniquement : on ne casse jamais un titre composé
    const text = el.textContent; if (!text || text.length > 80) return;
    el.setAttribute('aria-label', text.trim());
    const frag = document.createDocumentFragment(); let i = 0;
    text.split(/(\s+)/).forEach((word) => {
      if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(word)); return; }
      const w = document.createElement('span'); w.className = 'fx-word'; w.setAttribute('aria-hidden', 'true');
      [...word].forEach((ch) => { const s = document.createElement('span'); s.className = 'fx-ch'; s.textContent = ch; s.style.setProperty('--i', String(i++)); w.appendChild(s); });
      frag.appendChild(w);
    });
    // on garde les couleurs/dégradés du titre d'origine
    el.textContent = ''; el.appendChild(frag); el.classList.add('fx-split');
    io.observe(el);
  }

  /* ---------------- 4. sections & images reveal ---------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('fx-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  function reveal(el) {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.9) return; // déjà visible au chargement : on ne cache rien
    el.classList.add('fx-reveal'); io.observe(el);
  }

  /* ---------------- 5. parallax (images inside cards) ---------------- */
  const para = new Set();
  function parallax(el) { el.classList.add('fx-parallax'); para.add(el); }
  let lastY = -1;
  addTick(() => {
    const y = scrollY; if (y === lastY) return; lastY = y;
    const vh = innerHeight;
    para.forEach((img) => {
      if (!img.isConnected) { para.delete(img); return; }
      const r = img.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      const p = (r.top + r.height / 2 - vh / 2) / vh; // -0.5 … 0.5
      img.style.setProperty('--py', `${(p * -18).toFixed(1)}px`);
    });
    progress.style.transform = `scaleX(${clamp(y / Math.max(1, document.documentElement.scrollHeight - vh), 0, 1).toFixed(4)})`;
  });

  /* ---------------- 6. gold scroll progress bar ---------------- */
  const progress = document.createElement('div'); progress.className = 'fx-progress'; progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);

  /* ---------------- 7. golden cursor (mouse only) ---------------- */
  if (fine) {
    const dot = document.createElement('div'); dot.className = 'fx-cursor-dot';
    const ring = document.createElement('div'); ring.className = 'fx-cursor-ring';
    [dot, ring].forEach((n) => { n.setAttribute('aria-hidden', 'true'); document.body.appendChild(n); });
    let mx = -100, my = -100, rx = -100, ry = -100, big = 0, bigT = 0;
    addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      const t = e.target instanceof Element ? e.target.closest(SEL.interactive) : null;
      bigT = t && !excluded(t) ? 1 : 0;
      document.documentElement.classList.toggle('fx-cursor-on', true);
    }, { passive: true });
    document.addEventListener('pointerleave', () => document.documentElement.classList.remove('fx-cursor-on'));
    addEventListener('pointerdown', () => ring.classList.add('fx-press'));
    addEventListener('pointerup', () => ring.classList.remove('fx-press'));
    addTick(() => {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2; big += (bigT - big) * 0.18;
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0) scale(${(1 + big * 1.25).toFixed(3)})`;
      ring.style.opacity = String(0.55 + big * 0.35);
    });
  }

  /* ---------------- 8. gold burst on every click/tap ---------------- */
  const burst = document.createElement('canvas'); burst.className = 'fx-burst'; burst.setAttribute('aria-hidden', 'true');
  document.body.appendChild(burst);
  const bx = burst.getContext('2d'); let sparks = [];
  const sizeBurst = () => { const d = Math.min(devicePixelRatio || 1, 2); burst.width = innerWidth * d; burst.height = innerHeight * d; bx.setTransform(d, 0, 0, d, 0, 0); };
  sizeBurst(); addEventListener('resize', sizeBurst);
  const drawBurst = () => {
    bx.clearRect(0, 0, innerWidth, innerHeight);
    sparks = sparks.filter((s) => (s.life -= 0.022) > 0);
    for (const s of sparks) {
      s.vx *= 0.94; s.vy = s.vy * 0.94 + 0.08; s.x += s.vx; s.y += s.vy;
      bx.globalAlpha = s.life; bx.fillStyle = s.c;
      bx.beginPath(); bx.arc(s.x, s.y, s.r * (0.5 + s.life * 0.5), 0, 6.283); bx.fill();
    }
    if (!sparks.length) { delTick(drawBurst); bx.clearRect(0, 0, innerWidth, innerHeight); }
  };
  addEventListener('pointerdown', (e) => {
    const t = e.target instanceof Element ? e.target.closest('a, button, [role="button"], .product-card') : null;
    if (!t || excluded(t)) return;
    const n = t.matches('.btn-luxury, [aria-label*="panier" i], [data-fx~="burst"]') ? 34 : 16;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, v = 2 + Math.random() * 5.5;
      sparks.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, r: 1 + Math.random() * 2.4, life: 1,
        c: ['#fff1c2', '#f0d68e', '#d4af37', '#b8913f'][i % 4] });
    }
    addTick(drawBurst);
  }, { passive: true });

  /* ---------------- apply to current + future elements ---------------- */
  const apply = (root) => {
    const q = (s) => (root.matches?.(s) ? [root] : []).concat([...(root.querySelectorAll?.(s) || [])]);
    const run = (s, fn) => q(s).forEach((el) => { const k = fn.name; if (excluded(el)) return; if (!done.has(el)) done.add(el); else if (el.dataset['fx' + k]) return; el.dataset['fx' + k] = '1'; fn(el); });
    run(SEL.tilt, tilt); run(SEL.magnet, magnet); run(SEL.split, split); run(SEL.reveal, reveal); run(SEL.parallax, parallax);
  };
  apply(document.body);
  let queued = [];
  new MutationObserver((muts) => {
    muts.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && queued.push(n)));
    if (queued.length === 1) requestAnimationFrame(() => { const list = queued; queued = []; list.forEach((n) => n.isConnected && apply(n)); });
  }).observe(document.body, { childList: true, subtree: true });

  // l'admin est une SPA : si on y entre, on coupe le curseur doré
  const stopOnAdmin = () => document.documentElement.classList.toggle('hsb-fx-off', location.pathname.startsWith('/admin'));
  addEventListener('popstate', stopOnAdmin);
  const push = history.pushState; history.pushState = function (...a) { const r = push.apply(this, a); stopOnAdmin(); return r; };
}
