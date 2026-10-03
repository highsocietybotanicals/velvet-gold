// @ts-nocheck
/* High Society Botanicals — moteur de l'ouverture « lévitation ».
   Écrit et testé hors Lovable (60 fps, aucune image agrandie au-delà de sa taille réelle).
   Ne pas réécrire : toute modification doit être re-testée. */
import Lenis from "lenis";

export interface LevitationProduct { name: string; cat: string; src: string; w: number; h: number; }

export function mountLevitation(root: HTMLElement, opts: { products: LevitationProduct[]; emblemPath: string; blend?: boolean }): () => void {
  const $ = (id) => root.querySelector(`[data-lh="${id}"]`);
  const offs = [];
  const on = (t, type, fn, o) => { t.addEventListener(type, fn, o); offs.push(() => t.removeEventListener(type, fn, o)); };
  let rafId = 0, alive = true;

  const PRODUCTS = opts.products;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 820px)').matches;
  const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const easeIO = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  const easeO = t => 1 - Math.pow(1 - t, 3);
  const lerp = (a, b, t) => a + (b - a) * t;

  let lenis = null;
  if (!reduce) lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1.15, touchMultiplier: 1.4, smoothWheel: true });

  const secs = { dive: $('dive'), show: $('show') };
  let vh = innerHeight, tops = {};
  function measure(){ vh = innerHeight; for (const k in secs){ const r = secs[k].getBoundingClientRect(); tops[k] = { top: r.top + scrollY, h: secs[k].offsetHeight }; } }
  const prog = (k, y) => clamp((y - tops[k].top) / (tops[k].h - vh));

  /* ---------- emblem on canvas: vector redrawn at exact zoom = always sharp ---------- */
  const cv = $('emblemCanvas'), ctx = cv.getContext('2d');
  const P = new Path2D(opts.emblemPath);                 // potrace coords (0..33000, y up)
  const VB_W = 3300, VB_H = 3400;                    // emblem box
  const WIN = { x: VB_W * 0.4795, y: VB_H * 0.3513 };// house window = zoom target
  let W = 0, H = 0, dpr = 1, base = 1;
  function size(){
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    base = Math.min(W * 0.62, H * 0.6) / VB_H;      // emblem height ≈ 60% of screen
  }
  const gold = ctx.createLinearGradient(0, 34000, 33000, 0); // in path space
  [[0,'#6e5020'],[.28,'#d9b968'],[.42,'#fff1c2'],[.55,'#c79d45'],[.78,'#f0d68e'],[1,'#5e4219']].forEach(s => gold.addColorStop(s[0], s[1]));

  const t0 = performance.now();
  function drawEmblem(p, now){
    // intro reveal (time based) then scroll dive
    const intro = reduce ? 1 : easeO(clamp((now - t0 - 250) / 2200));
    const dive = easeIO(seg(p, 0.08, 0.86));
    const zoom = Math.exp(Math.log(140) * dive);
    const s = base * zoom;
    // the window starts at its natural place and drifts to screen centre while we dive
    const startX = W / 2 + (WIN.x - VB_W / 2) * base, startY = H / 2 + (WIN.y - VB_H / 2) * base;
    const ax = lerp(startX, W / 2, dive), ay = lerp(startY, H / 2, dive);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (zoom > 130) return;
    ctx.save();
    ctx.translate(ax, ay); ctx.scale(s, s); ctx.translate(-WIN.x, -WIN.y);
    // potrace space -> emblem space
    ctx.translate(0, VB_H); ctx.scale(0.1, -0.1);
    // soft glow under the emblem (only when small; cheap)
    if (zoom < 3) { ctx.shadowColor = 'rgba(212,175,55,.28)'; ctx.shadowBlur = 40 * dpr / zoom; }
    // base bronze silhouette
    ctx.globalAlpha = 0.35 + 0.65 * intro;
    ctx.fillStyle = intro < 1 ? '#3a2a10' : gold;
    ctx.fill(P);
    ctx.shadowBlur = 0;
    if (intro < 1) { // gold revealed by a diagonal light wipe
      ctx.save();
      const wipe = lerp(-6000, 40000, intro);
      ctx.beginPath(); ctx.moveTo(-8000, 40000); ctx.lineTo(wipe, 40000); ctx.lineTo(wipe - 9000, -8000); ctx.lineTo(-8000, -8000); ctx.closePath();
      ctx.clip(); ctx.globalAlpha = 1; ctx.fillStyle = gold; ctx.fill(P); ctx.restore();
    }
    // moving specular band (loops every 6 s)
    const ph = ((now - t0) / 6000) % 1, bx = lerp(-12000, 45000, ph);
    const sheen = ctx.createLinearGradient(bx - 3000, 0, bx + 3000, 6000);
    sheen.addColorStop(0, 'rgba(255,255,255,0)'); sheen.addColorStop(.5, 'rgba(255,250,230,.55)'); sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = intro; ctx.fillStyle = sheen; ctx.fill(P);
    ctx.restore();
  }



  /* ---------- build product layers (cut-outs, no frames) ---------- */
  const rig = $('rig');
  rig.innerHTML = '';
  const els = PRODUCTS.map((p, i) => {
    const d = document.createElement('div'); d.className = opts.blend ? 'lh-prod lh-blend' : 'lh-prod';
    // never display bigger than the file's own pixels → always sharp
    d.style.setProperty('--mw', `min(${mobile ? (opts.blend ? 96 : 80) : (opts.blend ? 58 : 50)}vw, ${p.w}px)`);
    d.style.setProperty('--mh', `min(${mobile ? (opts.blend ? 50 : 34) : (opts.blend ? 70 : 46)}vh, ${p.h}px)`);
    d.innerHTML = `<div class="lh-glow"></div><img src="${p.src}" alt="${p.name}" ${i ? 'loading="lazy"' : ''} decoding="async"><img class="lh-refl" src="${p.src}" alt="" aria-hidden="true" decoding="async">`;
    rig.appendChild(d); return d;
  });
  const calls = document.createElement('div');
  calls.innerHTML = `<div class="lh-call lh-c1"><span class="lh-ln"></span><span class="lh-dot"></span>Catégorie<b data-lh="cCat"></b></div>
    <div class="lh-call lh-c2"><span class="lh-ln"></span><span class="lh-dot"></span>Taux de THC<b>&lt; 0,3 %</b></div>
    <div class="lh-call lh-c3"><i></i>Analyses laboratoire <b style="display:inline;margin-left:6px">consultables</b></div>`;
  [...calls.children].forEach(c => rig.appendChild(c));
  const c1 = rig.querySelector('.lh-c1'), c2 = rig.querySelector('.lh-c2'), c3 = rig.querySelector('.lh-c3'), cCat = $('cCat');
  const ln1 = c1.querySelector('.lh-ln'), ln2 = c2.querySelector('.lh-ln');

  /* ---------- bokeh: one canvas behind, one in front (depth parallax) ---------- */
  const SPRITE = document.createElement('canvas'); SPRITE.width = SPRITE.height = 128;
  { const s = SPRITE.getContext('2d'), g = s.createRadialGradient(64,64,0,64,64,64);
    g.addColorStop(0,'rgba(255,224,150,1)'); g.addColorStop(.4,'rgba(226,180,90,.45)'); g.addColorStop(1,'rgba(212,175,55,0)'); s.fillStyle = g; s.fillRect(0,0,128,128); }
  function bokeh(id, n, rMin, rMax, aMax){
    const c = $(id), x = c.getContext('2d'); let w, h, d, parts;
    const init = () => { d = Math.min(devicePixelRatio || 1, 1.5); w = c.clientWidth; h = c.clientHeight; c.width = w * d; c.height = h * d; x.setTransform(d,0,0,d,0,0);
      parts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: rMin + Math.random() * (rMax - rMin), v: .05 + Math.random() * .25, a: .15 + Math.random() * aMax, ph: Math.random() * 6.28 })); };
    init(); on(window, 'resize', init);
    return (now, boost) => {
      x.globalAlpha = 1; x.clearRect(0, 0, w, h);
      for (const q of parts) {
        q.y -= q.v * boost; if (q.y < -q.r) { q.y = h + q.r; q.x = Math.random() * w; }
        x.globalAlpha = q.a * (.6 + .4 * Math.sin(now / 900 + q.ph));
        x.drawImage(SPRITE, q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
      }
    };
  }
  const drawBack = bokeh('bokehBack', mobile ? 26 : 46, 1, 4, .55);
  const drawFront = bokeh('bokehFront', mobile ? 5 : 9, 14, 42, .14);
  const bokehBack = $('bokehBack'), bokehFront = $('bokehFront');

  /* ---------- pointer → 3D illusion ---------- */
  let mx = 0, my = 0, cx = 0, cy = 0;
  on(window, 'pointermove', e => { if (e.pointerType === 'touch') return; mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });

  const flash = $('flash');
  const kicker = $('dive').querySelector('.lh-kicker'), hint = $('dive').querySelector('.lh-hint');
  const giant = $('giant'), tName = $('tName'), tCat = $('tCat');
  const hud = $('hud').querySelector('b'), title = $('title');
  const cta = $('cta'), barI = $('barI');
  let cur = -1;
  function fitGiant(){ giant.style.fontSize = ''; const max = innerWidth * 0.94, w = giant.scrollWidth;
    if (w > max) giant.style.fontSize = (parseFloat(getComputedStyle(giant).fontSize) * max / w).toFixed(1) + 'px'; }
  on(window, 'resize', () => fitGiant());
  function setProduct(i){
    if (i === cur) return; cur = i; const p = PRODUCTS[i];
    giant.textContent = p.name.toUpperCase(); fitGiant(); tName.textContent = p.name; tCat.textContent = p.cat; cCat.textContent = p.cat.split('·').pop().trim();
    hud.textContent = String(i + 1).padStart(2, '0');
  }

  function render(now){
    const y = lenis ? lenis.scroll : scrollY;
    /* Act I */
    const pd = prog('dive', y);
    if (y < tops.dive.top + tops.dive.h) drawEmblem(pd, now);
    flash.style.opacity = (seg(pd, 0.68, 0.82) * (1 - seg(pd, 0.92, 1)) * 0.95).toFixed(3);
    kicker.style.opacity = hint.style.opacity = (1 - seg(pd, 0, 0.12)).toFixed(3);

    /* Act II */
    const ps = prog('show', y);
    const inShow = y > tops.show.top - vh && y < tops.show.top + tops.show.h;
    // pointer smoothing + idle sway so it feels alive on phones too
    const sway = mobile ? Math.sin(now / 2200) * .35 : 0;
    cx += ((mx || sway) - cx) * .06; cy += ((my || Math.cos(now / 2900) * (mobile ? .2 : 0)) - cy) * .06;
    if (inShow) {
      drawBack(now, 1); drawFront(now, 1);
      bokehBack.style.transform = `translate3d(${-cx * 14}px,${-cy * 10}px,0)`;
      bokehFront.style.transform = `translate3d(${cx * 40}px,${cy * 28}px,0)`;
      rig.style.transform = `rotateY(${cx * 16}deg) rotateX(${-cy * 10}deg)`;
    }
    const N = PRODUCTS.length, span = 0.86 / N;      // 0..0.86 = products, then CTA
    const idx = Math.min(N - 1, Math.floor(clamp(ps, 0, 0.8599) / span));
    setProduct(idx);
    const bob = Math.sin(now / 1400) * 7, tilt = Math.sin(now / 2300) * 2.2;
    els.forEach((el, i) => {
      const a = i * span, b = a + span;
      const inT = easeO(seg(ps, a - (i ? 0.02 : 0), a + span * 0.38));
      const outT = i === N - 1 ? 0 : easeIO(seg(ps, b - span * 0.22, b + 0.01));
      const o = (i === 0 ? easeO(seg(ps, 0, span * 0.3)) : inT) * (1 - outT);
      if (o < 0.002) { if (el.style.opacity !== '0') el.style.opacity = '0'; return; }
      const rise = (1 - inT) * 120 - outT * 160;
      const sc = lerp(0.82, 1, inT) + outT * 0.06;
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translate(-50%,-50%) translate3d(0,${rise + bob}px,${(1 - inT) * -260 + outT * 120}px) rotateZ(${tilt}deg) scale(${sc})`;
    });
    // callouts draw in during the "hold" part of each product
    const local = (clamp(ps, 0, 0.8599) - idx * span) / span;
    const callT = easeO(seg(local, 0.3, 0.55)) * (1 - seg(local, 0.8, 0.95) * (idx < N - 1 ? 1 : 0));
    [c1, c2, c3].forEach((c, k) => { const t = clamp(callT * 1.4 - k * .2); c.style.opacity = t.toFixed(3); c.style.transform = `translateZ(60px) translateY(${(1 - t) * 10}px)`; });
    ln1.style.transform = `scaleX(${callT})`; ln2.style.transform = `scaleX(${callT})`;
    const showIn = easeO(seg(ps, 0, 0.06));
    giant.style.opacity = (showIn * (0.25 + 0.75 * clamp(callT + .2))).toFixed(3);
    giant.style.transform = `translate(calc(-50% + ${((local - .5) * -60 - cx * 30).toFixed(1)}px), ${mobile ? '-95%' : '-62%'})`;
    const ctaT = easeO(seg(ps, 0.88, 0.96));
    title.style.opacity = (showIn * clamp(callT * 1.3) * (mobile ? 1 - ctaT : 1)).toFixed(3);
    if (mobile) c3.style.opacity = (parseFloat(c3.style.opacity) * (1 - ctaT)).toFixed(3);
    cta.style.opacity = ctaT.toFixed(3); cta.style.pointerEvents = ctaT > .9 ? 'auto' : 'none';
    cta.style.transform = `translateY(${(1 - ctaT) * 20}px)`;
    barI.style.transform = `scaleX(${ps.toFixed(4)})`;
  }

  function raf(now){
    if (lenis) lenis.raf(now);
    render(now);
    rafId = requestAnimationFrame(raf);
  }
  function init(){ size(); measure(); }
  on(window, 'resize', init);
  init();
  if (!reduce) rafId = requestAnimationFrame(raf);
  else { drawEmblem(0, t0 + 99999); render(t0 + 99999); }
  document.fonts && document.fonts.ready.then(() => { if (alive) { measure(); fitGiant(); } });

  return () => { alive = false; cancelAnimationFrame(rafId); offs.forEach((f) => f()); if (lenis) lenis.destroy(); rig.innerHTML = ''; };
}
