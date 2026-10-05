// Scène 3D de l'accueil « Minuit Carat » : rideau de fer, emblème en or massif, tunnel d'arches sous la pluie,
// sol mouillé avec reflets et trois lots qui défilent au scroll. Un seul renderer, pause hors écran.
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export interface MinuitSceneOptions {
  lots: string[][]; // pour chaque lot du tunnel : sources d'image par ordre de préférence
  emblemSvg: string;
  mobile: boolean;
  reduce: boolean;
}
export interface MinuitScene {
  lift: (instant: boolean) => void;
  setProgress: (p: number) => void;
  dispose: () => void;
}

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Charge la première source qui répond (bucket, puis détourage du code, puis photo). */
function loadFirst(loader: THREE.TextureLoader, srcs: string[], done: (t: THREE.Texture) => void, i = 0) {
  if (i >= srcs.length) return;
  loader.load(srcs[i], (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; done(t); }, undefined, () => loadFirst(loader, srcs, done, i + 1));
}

export function createMinuitScene(canvas: HTMLCanvasElement, o: MinuitSceneOptions): MinuitScene {
  const { mobile: MOBILE, reduce: REDUCE } = o;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !MOBILE, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MOBILE ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060508);
  scene.fog = new THREE.FogExp2(0x060508, 0.042);
  const camera = new THREE.PerspectiveCamera(MOBILE ? 62 : 45, 1, 0.05, 140);
  camera.position.set(0, 0.25, 6);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0x3a2c40, 0x050404, 0.5));
  const key = new THREE.PointLight(0xffd59a, 14, 0, 2); key.position.set(1.4, 1.9, 5.6); scene.add(key);
  const sweep = new THREE.PointLight(0xfff0c8, 6, 0, 2); sweep.position.set(-1.5, 0.6, 5.2); scene.add(sweep);
  const prodLight = new THREE.PointLight(0xffc979, 0, 0, 2); scene.add(prodLight);

  // tunnel d'arches
  const GY = -1.6, CY = 1.3, R = 4.2, N = MOBILE ? 9 : 13, STEP = 5.5;
  const archMat = new THREE.MeshStandardMaterial({ color: 0x15110d, metalness: 0.9, roughness: 0.38, envMapIntensity: 0.3 });
  const archGeo = new THREE.TorusGeometry(R, 0.17, 12, 96, Math.PI);
  const legGeo = new THREE.CylinderGeometry(0.17, 0.21, CY - GY, 14);
  const filGeo = new THREE.TorusGeometry(R - 0.22, 0.016, 6, 128, Math.PI);
  const filLeg = new THREE.CylinderGeometry(0.016, 0.016, CY - GY, 6);
  const lampGeo = new THREE.SphereGeometry(0.075, 14, 14);
  const arches: { fm: THREE.MeshBasicMaterial; z: number }[] = [];
  for (let i = 0; i < N; i++) {
    const z = -2 - i * STEP, g = new THREE.Group(); g.position.z = z;
    const a = new THREE.Mesh(archGeo, archMat); a.position.y = CY; g.add(a);
    const fm = new THREE.MeshBasicMaterial({ color: 0xf6c86a, transparent: true, opacity: 0 });
    const f = new THREE.Mesh(filGeo, fm); f.position.set(0, CY, 0.19); g.add(f);
    [-1, 1].forEach((s) => {
      const l = new THREE.Mesh(legGeo, archMat); l.position.set(s * R, (CY + GY) / 2, 0); g.add(l);
      const fl = new THREE.Mesh(filLeg, fm); fl.position.set(s * (R - 0.22), (CY + GY) / 2, 0.19); g.add(fl);
      const lamp = new THREE.Mesh(lampGeo, fm); lamp.position.set(s * (R - 0.55), CY - 0.15, 0.3); g.add(lamp);
    });
    scene.add(g); arches.push({ fm, z });
  }

  // sol mouillé : miroir + flaques
  const W0 = window.innerWidth, H0 = window.innerHeight, DPR = renderer.getPixelRatio();
  const mirror = new Reflector(new THREE.PlaneGeometry(16, 150), { textureWidth: W0 * DPR * 0.5, textureHeight: H0 * DPR * 0.5, color: 0x6e6e6e, clipBias: 0.003 });
  mirror.rotation.x = -Math.PI / 2; mirror.position.set(0, GY, -66); scene.add(mirror);
  const pc = document.createElement("canvas"); pc.width = pc.height = 512;
  const px = pc.getContext("2d")!;
  px.fillStyle = "#fff"; px.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * 512, y = Math.random() * 512, r = 20 + Math.random() * 90;
    const gr = px.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(0,0,0,.95)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    px.fillStyle = gr; px.beginPath(); px.ellipse(x, y, r, r * (0.4 + Math.random() * 0.5), Math.random() * 3, 0, 7); px.fill();
  }
  const puddles = new THREE.CanvasTexture(pc); puddles.wrapS = puddles.wrapT = THREE.RepeatWrapping; puddles.repeat.set(2, 18);
  const wet = new THREE.Mesh(new THREE.PlaneGeometry(16, 150), new THREE.MeshStandardMaterial({ color: 0x0c0a0a, roughness: 0.9, metalness: 0.1, transparent: true, opacity: 0.94, alphaMap: puddles, envMapIntensity: 0.1 }));
  wet.rotation.x = -Math.PI / 2; wet.position.set(0, GY + 0.004, -66); scene.add(wet);
  const dash = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.07, 1.1), new THREE.MeshBasicMaterial({ color: 0x6b6250 }), 48);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  for (let i = 0; i < 48; i++) { m4.compose(new THREE.Vector3(0, GY + 0.01, 4 - i * 3), q, new THREE.Vector3(1, 1, 1)); dash.setMatrixAt(i, m4); }
  scene.add(dash);
  [-1, 1].forEach((s) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.01, 150), new THREE.MeshBasicMaterial({ color: 0x9c7a35 })); l.position.set(s * 3.3, GY + 0.01, -66); scene.add(l); });

  // pluie
  const RN = MOBILE ? 650 : 1500, rp = new Float32Array(RN * 6), re = new Float32Array(RN * 2);
  for (let i = 0; i < RN; i++) { const x = (Math.random() - 0.5) * 16, y = Math.random() * 10, z = 4 - Math.random() * 36; rp.set([x, y, z, x, y, z], i * 6); re[i * 2 + 1] = 1; }
  const rg = new THREE.BufferGeometry(); rg.setAttribute("position", new THREE.BufferAttribute(rp, 3)); rg.setAttribute("aEnd", new THREE.BufferAttribute(re, 1));
  const rainMat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uZ: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: "attribute float aEnd; uniform float uT; uniform float uZ; varying float vA; void main(){ vec3 p=position; p.y=mod(p.y-uT*9.0,10.0)-1.6+aEnd*0.32; p.x+=aEnd*0.04; p.z+=uZ; vA=0.12+0.2*aEnd; vec4 mv=modelViewMatrix*vec4(p,1.0); vA*=clamp(1.0-(-mv.z)/30.0,0.0,1.0); gl_Position=projectionMatrix*mv; }",
    fragmentShader: "varying float vA; void main(){ gl_FragColor=vec4(0.95,0.9,0.8,vA); }",
  });
  const rain = new THREE.LineSegments(rg, rainMat); rain.frustumCulled = false; scene.add(rain);

  // poussière d'or
  const DN = MOBILE ? 500 : 1100, dp = new Float32Array(DN * 3), ds = new Float32Array(DN);
  for (let i = 0; i < DN; i++) { dp.set([(Math.random() - 0.5) * 8, GY + Math.random() * 5.5, 4 - Math.random() * 62], i * 3); ds[i] = Math.random(); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(dp, 3)); dg.setAttribute("aS", new THREE.BufferAttribute(ds, 1));
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uPR: { value: renderer.getPixelRatio() } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: "attribute float aS; uniform float uT; uniform float uPR; varying float vA; void main(){ vec3 p=position; p.y+=sin(uT*0.4+aS*40.0)*0.25; p.x+=cos(uT*0.3+aS*20.0)*0.2; vec4 mv=modelViewMatrix*vec4(p,1.0); gl_PointSize=(2.0+aS*5.0)*uPR*(6.0/-mv.z); vA=(0.35+0.65*abs(sin(uT*1.3+aS*60.0)))*clamp(1.0-(-mv.z)/34.0,0.0,1.0); gl_Position=projectionMatrix*mv; }",
    fragmentShader: "varying float vA; void main(){ float d=length(gl_PointCoord-0.5); if(d>0.5) discard; gl_FragColor=vec4(1.0,0.82,0.45,vA*smoothstep(0.5,0.0,d)); }",
  });
  scene.add(new THREE.Points(dg, dustMat));

  // lots flottants : le noir de la photo devient transparent (fonctionne avec un détourage comme avec une photo sur fond noir)
  const gc = document.createElement("canvas"); gc.width = gc.height = 128;
  const gx = gc.getContext("2d")!, gg = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gg.addColorStop(0, "rgba(255,214,140,.9)"); gg.addColorStop(0.35, "rgba(201,162,74,.35)"); gg.addColorStop(1, "rgba(0,0,0,0)");
  gx.fillStyle = gg; gx.fillRect(0, 0, 128, 128);
  const GLOW = new THREE.CanvasTexture(gc);
  const loader = new THREE.TextureLoader();
  const STATIONS = o.lots.slice(0, 3).map((srcs, i) => ({ srcs, z: -7 - 18 * i, side: i % 2 ? -1 : 1 }));
  const lots3d = STATIONS.map((s) => {
    const grp = new THREE.Group(); grp.position.set(0, 0.2, s.z); scene.add(grp);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.55, depthWrite: false }));
    glow.scale.set(4.2, 4.2, 1); glow.position.z = -0.4; grp.add(glow);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 0.93, 96), new THREE.MeshBasicMaterial({ color: 0xf4c66a, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = GY - 0.2 + 0.015; grp.add(ring);
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: null }, uO: { value: 0 } }, transparent: true, depthWrite: false,
      vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
      fragmentShader: "uniform sampler2D map; uniform float uO; varying vec2 vUv; void main(){ vec4 c=texture2D(map,vUv); float l=max(c.r,max(c.g,c.b)); float a=c.a*smoothstep(0.035,0.13,l); vec2 d=vUv-0.5; a*=smoothstep(0.5,0.4,max(abs(d.x),abs(d.y))); gl_FragColor=vec4(c.rgb,a*uO); }",
    });
    mat.toneMapped = false;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); grp.add(mesh);
    loadFirst(loader, s.srcs, (t) => {
      mat.uniforms.map.value = t; mat.needsUpdate = true;
      const img = t.image as { width: number; height: number };
      const h = 2.0; mesh.scale.set((h * img.width) / img.height, h, 1);
    });
    return { ...s, grp, mesh, mat, glow, ring };
  });

  // rideau de fer
  const shG = new THREE.PlaneGeometry(16, 12, 1, 420), sp = shG.attributes.position;
  for (let i = 0; i < sp.count; i++) sp.setZ(i, Math.sin(sp.getY(i) * 30) * 0.03 + (Math.sin(sp.getY(i) * 30) > 0.92 ? 0.012 : 0));
  shG.computeVertexNormals();
  const shutter = new THREE.Group();
  shutter.add(new THREE.Mesh(shG, new THREE.MeshStandardMaterial({ color: 0x28231e, metalness: 0.88, roughness: 0.46, envMapIntensity: 0.55 })));
  const rail = new THREE.Mesh(new THREE.BoxGeometry(16, 0.14, 0.09), new THREE.MeshStandardMaterial({ color: 0x8a6d2e, metalness: 1, roughness: 0.3 }));
  rail.position.y = -6; shutter.add(rail);
  shutter.position.set(0, GY + 6, 3.35); scene.add(shutter);

  // emblème 3D en or massif (SVG vectoriel de la marque)
  const emblem = new THREE.Group(); emblem.visible = false; scene.add(emblem);
  let emblemBase = 0.6;
  const fitEmblem = () => {
    const d = camera.position.z - 4.15, vh = 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), vw = vh * camera.aspect;
    emblemBase = Math.min(vh * (MOBILE ? 0.36 : 0.42), vw * 0.62);
    emblem.position.set(0, 0.25 + vh * (MOBILE ? 0.16 : 0.12), 4.15); emblem.scale.setScalar(emblemBase);
  };
  try {
    const data = new SVGLoader().parse(o.emblemSvg), shapes: THREE.Shape[] = [];
    data.paths.forEach((p) => shapes.push(...SVGLoader.createShapes(p)));
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: 110, bevelEnabled: true, bevelThickness: 26, bevelSize: 16, bevelSegments: 2, curveSegments: MOBILE ? 4 : 6 });
    geo.center(); geo.computeBoundingBox();
    const bb = geo.boundingBox!, hgt = bb.max.y - bb.min.y || 1;
    const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xe0b95e, metalness: 1, roughness: 0.27, clearcoat: 0.5, clearcoatRoughness: 0.25, envMapIntensity: 1.5, side: THREE.DoubleSide }));
    m.scale.set(1 / hgt, -1 / hgt, 1 / hgt); emblem.add(m); emblem.visible = true;
  } catch { /* emblème absent : le rideau suffit */ }

  // post-traitement (bureau) : lueur faible sur l'emblème, pleine dans le tunnel
  let composer: EffectComposer | null = null, bloom: UnrealBloomPass | null = null;
  if (!MOBILE) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(W0, H0), 0.12, 0.4, 0.92);
    composer.addPass(bloom); composer.addPass(new OutputPass());
  }

  const state = { phase: "gate" as "gate" | "lift" | "hero", t0: 0, camZ: 6, tz: 6, mx: 0, my: 0, p: 0, station: 0 };
  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    composer?.setSize(w, h);
    if (state.phase === "gate") fitEmblem();
  };
  const onMove = (e: PointerEvent) => { state.mx = e.clientX / window.innerWidth - 0.5; state.my = e.clientY / window.innerHeight - 0.5; };
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onMove, { passive: true });

  let visible = true, raf = 0, disposed = false;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); });
  io.observe(canvas);
  const onVis = () => { if (!document.hidden && visible && !raf) raf = requestAnimationFrame(frame); };
  document.addEventListener("visibilitychange", onVis);
  const clock = new THREE.Clock();

  function frame() {
    raf = 0;
    if (disposed || !visible || document.hidden) return;
    const t = REDUCE ? 0 : clock.getElapsedTime(), now = performance.now();
    rainMat.uniforms.uT.value = t; dustMat.uniforms.uT.value = t;
    if (state.phase === "gate") {
      emblem.rotation.y = Math.sin(t * 0.7) * 0.55 + state.mx * 0.6; emblem.rotation.x = state.my * 0.25;
      sweep.position.x = Math.sin(t * 0.9) * 2.2; sweep.position.y = 0.4 + Math.cos(t * 0.6) * 0.8;
    } else if (state.phase === "lift") {
      const k = Math.min(1, (now - state.t0) / 2600), e = ease(k);
      emblem.rotation.y += 0.09 * (1 - k * 0.6);
      emblem.position.y += (2.2 - emblem.position.y) * 0.02 * sstep(0.15, 1, k);
      emblem.scale.setScalar(emblemBase * (1 - sstep(0.35, 0.95, k)));
      shutter.position.y = GY + 6 + e * 10;
      arches.forEach((a, i) => { a.fm.opacity = sstep(0.25 + i * 0.04, 0.45 + i * 0.04, k) * (0.85 + Math.random() * 0.15); });
      state.camZ = 6 - 6 * sstep(0.3, 1, k);
      key.intensity = 14 * (1 - e) + 3;
      if (bloom) { bloom.strength = 0.12 + 0.68 * e; bloom.threshold = 0.92 - 0.12 * e; bloom.radius = 0.4 + 0.15 * e; }
      if (k >= 1) { state.phase = "hero"; shutter.visible = false; emblem.visible = false; }
    } else {
      arches.forEach((a) => { a.fm.opacity = 0.92 + Math.sin(t * 7 + a.z) * 0.04; });
      const x = state.p * 2, fl = Math.floor(Math.min(x, 1.999));
      const stair = fl + sstep(0.2, 0.8, x - fl);
      state.tz = -18 * Math.min(2, stair);
      state.camZ += (state.tz - state.camZ) * (REDUCE ? 1 : 0.1);
      state.station = Math.min(2, Math.round(x));
    }
    rainMat.uniforms.uZ.value = state.camZ;
    camera.position.z = state.camZ;
    camera.position.x += (state.mx * 0.7 - camera.position.x) * 0.05;
    camera.position.y += (0.25 - state.my * 0.35 - camera.position.y) * 0.05;
    camera.lookAt(camera.position.x * 0.3, MOBILE && state.phase !== "gate" ? -0.45 : 0.3, state.camZ - 10);
    lots3d.forEach((L, i) => {
      const dist = state.camZ - L.z;
      L.grp.position.y = 0.25 + Math.sin(t * 0.9 + i) * 0.08;
      L.grp.position.x = L.side * sstep(8.5, 2.5, dist) * 3.2;
      L.mesh.rotation.y = Math.sin(t * 0.5 + i) * 0.16 + state.mx * 0.3;
      L.ring.rotation.z = t * 0.2; L.ring.scale.setScalar(1 + Math.sin(t * 1.4 + i) * 0.04);
      const vis = 1 - sstep(9, 14, dist);
      L.mat.uniforms.uO.value = L.mat.uniforms.map.value ? vis : 0;
      (L.glow.material as THREE.SpriteMaterial).opacity = 0.55 * vis; L.ring.visible = vis > 0.05;
    });
    const cur = lots3d[Math.min(state.station, lots3d.length - 1)];
    if (cur) { prodLight.position.set(cur.grp.position.x, 2.4, cur.z + 1.6); prodLight.intensity = state.phase === "gate" ? 0 : 9; }
    if (composer) composer.render(); else renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  resize(); raf = requestAnimationFrame(frame);

  return {
    lift(instant) {
      state.t0 = performance.now();
      if (instant) {
        state.phase = "hero"; shutter.visible = false; emblem.visible = false; state.camZ = 0;
        arches.forEach((a) => (a.fm.opacity = 1));
        if (bloom) { bloom.strength = 0.8; bloom.threshold = 0.8; bloom.radius = 0.55; }
      } else state.phase = "lift";
    },
    setProgress(p) { state.p = p; },
    dispose() {
      disposed = true; cancelAnimationFrame(raf); io.disconnect();
      window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      composer?.dispose(); renderer.dispose(); pmrem.dispose();
    },
  };
}
