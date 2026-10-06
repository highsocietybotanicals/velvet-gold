// Le Pochon Royal en 3D (textures du fichier d'impression) : rotation automatique et au doigt.
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export function createPouchScene(card: HTMLElement, canvas: HTMLCanvasElement, faceUrl: string, backUrl: string, onFail: () => void) {
  const REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.matchMedia("(max-width: 899px)").matches ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  scene.add(new THREE.HemisphereLight(0xfff1d6, 0x0a0806, 0.35));
  const key = new THREE.SpotLight(0xffd79a, 40, 0, 0.6, 0.6, 2); key.position.set(1.6, 2.4, 2.6); scene.add(key);
  const rim = new THREE.PointLight(0xb9c7ff, 6, 0, 2); rim.position.set(-1.8, 0.6, -1.2); scene.add(rim);

  const W = 1, H = 1.622, BULGE = 0.085;
  const face = (tex: THREE.Texture) => {
    const g = new THREE.PlaneGeometry(W, H, 40, 64), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / W + 0.5, v = p.getY(i) / H + 0.5, vv = Math.min(v / 0.9, 1);
      const b = Math.pow(Math.sin(Math.PI * u), 0.55) * (v < 0.9 ? Math.pow(Math.sin(Math.PI * vv), 0.5) : 0);
      // +0,004 : la face passe devant le liseré, sinon la soudure plate du haut disparaît sous l'or
      p.setZ(i, 0.004 + BULGE * b + Math.sin(u * 37 + v * 23) * 0.0016 * b);
    }
    g.computeVertexNormals();
    return new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.42, metalness: 0.28, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 0.9 }));
  };
  const pouch = new THREE.Group(); scene.add(pouch);
  const loader = new THREE.TextureLoader();
  const load = (src: string) => new Promise<THREE.Texture>((res, rej) => loader.load(src, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }, undefined, rej));

  let rotY = -0.5, raf = 0, visible = false, disposed = false;
  let drag: { x: number; r: number } | null = null;
  const fit = () => {
    const w = card.clientWidth, h = card.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const V = Math.max(H / 0.55, (W * 1.25) / 0.7 / camera.aspect);
    const dist = V / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    camera.position.set(0, -0.12 * V, dist); camera.lookAt(0, -0.12 * V, 0); camera.updateProjectionMatrix();
  };
  const draw = () => {
    pouch.rotation.y = rotY; pouch.rotation.x = 0.06;
    pouch.position.y = REDUCE ? 0 : Math.sin(performance.now() / 900) * 0.02;
    renderer.render(scene, camera);
  };
  Promise.all([load(faceUrl), load(backUrl)]).then(([f, b]) => {
    pouch.add(face(f));
    const back = face(b); back.rotation.y = Math.PI; pouch.add(back);
    pouch.add(new THREE.Mesh(new THREE.BoxGeometry(W * 1.004, H * 1.002, 0.006), new THREE.MeshStandardMaterial({ color: 0x8a6d2e, metalness: 1, roughness: 0.35 })));
    fit(); draw();
  }).catch(onFail);

  const ro = new ResizeObserver(() => { fit(); draw(); }); ro.observe(card);
  const down = (e: PointerEvent) => { drag = { x: e.clientX, r: rotY }; card.setPointerCapture(e.pointerId); };
  // boucle en cours : elle dessine déjà à chaque image, inutile de rendre une seconde fois par mouvement du doigt
  const move = (e: PointerEvent) => { if (drag) { rotY = drag.r + (e.clientX - drag.x) * 0.012; if (!raf) draw(); } };
  const up = () => { drag = null; };
  card.addEventListener("pointerdown", down); card.addEventListener("pointermove", move);
  card.addEventListener("pointerup", up); card.addEventListener("pointercancel", up);
  const loop = () => { raf = 0; if (disposed || !visible || document.hidden) return; if (!drag && !REDUCE) rotY += 0.0035; draw(); raf = requestAnimationFrame(loop); };
  // mouvement réduit : l'image ne change qu'au chargement, au redimensionnement et au doigt, pas de boucle
  const wake = () => { if (!disposed && visible && !document.hidden && !raf && !REDUCE) raf = requestAnimationFrame(loop); };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; wake(); });
  io.observe(card);
  // retour sur l'onglet : la boucle s'était arrêtée, on la relance (sinon le pochon restait figé)
  document.addEventListener("visibilitychange", wake);

  return () => {
    disposed = true; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
    document.removeEventListener("visibilitychange", wake);
    card.removeEventListener("pointerdown", down); card.removeEventListener("pointermove", move);
    card.removeEventListener("pointerup", up); card.removeEventListener("pointercancel", up);
    renderer.dispose(); pmrem.dispose();
    // carte retirée du DOM : contexte WebGL rendu tout de suite (sinon il attend le ramasse-miettes)
    if (!canvas.isConnected) renderer.forceContextLoss();
  };
}
