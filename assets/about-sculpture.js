import * as THREE from "./vendor/three.module.min.js";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
const CREAM = 0xf3ede0;

const init = () => {
  const stage = document.querySelector("[data-about-sculpture]");
  if (!stage) return;

  const canvas = stage.querySelector("[data-about-canvas]");
  const holder = stage.querySelector(".sculpture-stage");
  if (!canvas || !holder) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
  } catch (err) {
    stage.classList.add("is-fallback");
    return;
  }

  const mobile = window.matchMedia("(max-width: 760px)");
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile.matches ? 1.4 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  if ("transmissionResolutionScale" in renderer) renderer.transmissionResolutionScale = 0.6;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(2.72, 1.92, 5.2);
  camera.lookAt(0, -0.05, 0);

  /* ── Seamless cream backdrop ───────────────────────────
   * A large back-side sphere painted the exact page cream
   * fills the transparent canvas so the artwork merges with
   * the About section instead of sitting in a visible box.
   * It also gives the metal and glass surfaces something to
   * reflect and refract.
   */
  const backdrop = new THREE.Mesh(
    new THREE.SphereGeometry(40, 32, 24),
    new THREE.MeshBasicMaterial({ color: CREAM, side: THREE.BackSide, depthWrite: false })
  );
  scene.add(backdrop);

  /* ── Studio environment for reflections ─────────────── */
  const makeEnvTexture = () => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#f6f0e4");
    grad.addColorStop(0.4, "#e3e6f2");
    grad.addColorStop(0.62, "#93a6f0");
    grad.addColorStop(0.82, "#28357e");
    grad.addColorStop(1, "#0b112b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    const softbox = (x, y, w, h, a) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(w, h));
      g.addColorStop(0, `rgba(255,255,255,${a})`);
      g.addColorStop(0.55, `rgba(255,255,255,${a * 0.35})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - w, y - h, w * 2, h * 2);
    };
    softbox(250, 120, 220, 130, 0.98);
    softbox(800, 160, 180, 110, 0.8);
    softbox(520, 320, 300, 170, 0.28);

    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromEquirectangular(makeEnvTexture()).texture;
  scene.environment = envMap;
  pmrem.dispose();

  /* ── Lighting ───────────────────────────────────────── */
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  const key = new THREE.DirectionalLight(0xfff4e6, 2.7);
  key.position.set(-3.4, 4.6, 4.2);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x9db2ff, 2.6);
  rim.position.set(4.4, 2.2, -3.6);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xffffff, 0.8);
  fill.position.set(0.6, -2.6, 3.2);
  scene.add(fill);

  /* ── Materials ──────────────────────────────────────── */
  const cobaltCore = new THREE.MeshPhysicalMaterial({
    color: 0x1736d6,
    metalness: 0.28,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.5,
    sheen: 0.5,
    sheenColor: new THREE.Color(0x6a86ff)
  });

  const silver = new THREE.MeshPhysicalMaterial({
    color: 0xe9ecef,
    metalness: 1,
    roughness: 0.22,
    clearcoat: 0.6,
    clearcoatRoughness: 0.18,
    envMapIntensity: 1.6
  });

  const darkRod = new THREE.MeshPhysicalMaterial({
    color: 0x9aa0aa,
    metalness: 1,
    roughness: 0.34,
    envMapIntensity: 1.4
  });

  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.02,
    transmission: 1,
    thickness: 0.45,
    attenuationColor: new THREE.Color(0xd9e2ff),
    attenuationDistance: 2.6,
    ior: 1.48,
    transparent: true,
    opacity: 1,
    envMapIntensity: 1.8,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    side: THREE.DoubleSide
  });

  /* ── Cobalt core sphere ─────────────────────────────── */
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.92, 96, 96), cobaltCore);
  scene.add(core);

  /* ── Orbital ring assemblies ────────────────────────── */
  const makeRing = (radius, tube) =>
    new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 26, 220), silver);

  const makeGlassRing = (radius, tube) =>
    new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 20, 200), glass);

  const orbitals = new THREE.Group();
  scene.add(orbitals);

  const spinners = [];

  const addOrbital = (mesh, rot, spin) => {
    const g = new THREE.Group();
    g.rotation.set(rot[0], rot[1], rot[2]);
    g.add(mesh);
    orbitals.add(g);
    spinners.push({ group: g, axis: spin.axis, speed: spin.speed });
    return g;
  };

  const ringA = makeRing(1.34, 0.052);
  addOrbital(ringA, [1.24, 0.12, -0.28], { axis: "y", speed: 0.14 });

  const ringB = makeGlassRing(1.62, 0.03);
  addOrbital(ringB, [1.42, -0.42, 0.22], { axis: "y", speed: -0.1 });

  const ringC = makeRing(1.05, 0.036);
  addOrbital(ringC, [1.05, 0.55, 0.6], { axis: "z", speed: 0.18 });

  const ringD = makeGlassRing(1.9, 0.022);
  addOrbital(ringD, [1.62, 0.9, -0.5], { axis: "z", speed: -0.08 });

  /* ── Thin rods + minimal connections ────────────────── */
  const rodGeo = new THREE.CylinderGeometry(0.014, 0.014, 1, 16);
  const capGeo = new THREE.SphereGeometry(0.045, 24, 24);

  const addRod = (a, b, material) => {
    const from = new THREE.Vector3(...a);
    const to = new THREE.Vector3(...b);
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const len = from.distanceTo(to);

    const rod = new THREE.Mesh(rodGeo, material);
    rod.scale.y = len;
    rod.position.copy(mid);
    rod.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      to.clone().sub(from).normalize()
    );
    orbitals.add(rod);

    [from, to].forEach((p) => {
      const cap = new THREE.Mesh(capGeo, material);
      cap.position.copy(p);
      orbitals.add(cap);
    });
  };

  const s = Math.SQRT1_2 * 1.34;
  addRod([-s, -s, 0], [s, s, 0], darkRod);
  addRod([0, -s, -s], [0, s, s], darkRod);

  const nodeGeo = new THREE.SphereGeometry(0.085, 32, 32);
  [
    [-s, -s, 0],
    [s, s, 0],
    [0, s, s],
    [0, -s, -s]
  ].forEach((p) => {
    const node = new THREE.Mesh(nodeGeo, silver);
    node.position.set(...p);
    orbitals.add(node);
  });

  /* ── Soft contact shadow on the page ────────────────── */
  const shadowTexture = (() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(24,28,58,0.4)");
    g.addColorStop(0.5, "rgba(24,28,58,0.14)");
    g.addColorStop(1, "rgba(24,28,58,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 4),
    new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -1.62, 0);
  scene.add(shadow);

  /* ── Pointer-responsive tilt (desktop only) ─────────── */
  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  let pointerBound = false;

  if (!mobile.matches && window.matchMedia("(hover: hover)").matches) {
    const onMove = (event) => {
      const rect = holder.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      target.x = THREE.MathUtils.clamp(nx * 0.5, -0.28, 0.28);
      target.y = THREE.MathUtils.clamp(ny * 0.4, -0.22, 0.22);
    };
    holder.addEventListener("pointermove", onMove);
    holder.addEventListener("pointerleave", () => {
      target.x = 0;
      target.y = 0;
    });
    pointerBound = true;
  }

  /* ── Resize ─────────────────────────────────────────── */
  const resize = () => {
    const rect = holder.getBoundingClientRect();
    const w = Math.max(rect.width, 1);
    const h = Math.max(rect.height, 1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(holder);

  /* ── Animation ──────────────────────────────────────── */
  let visible = true;
  let last = performance.now();
  let elapsed = 0;
  let rafId = 0;

  let io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
      },
      { threshold: 0 }
    );
    io.observe(holder);
  }

  const animate = () => {
    rafId = requestAnimationFrame(animate);
    if (!visible || document.hidden) return;

    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;
    const t = elapsed;

    spinners.forEach(({ group, axis, speed }) => {
      group.rotation[axis] += dt * speed;
    });

    core.rotation.y = t * 0.06;

    pointer.x += (target.x - pointer.x) * 0.06;
    pointer.y += (target.y - pointer.y) * 0.06;
    orbitals.rotation.y = pointer.x + Math.sin(t * 0.22) * 0.05;
    orbitals.rotation.x = pointer.y + Math.sin(t * 0.18) * 0.035;

    key.intensity = 2.7 + Math.sin(t * 0.3) * 0.1;
    rim.intensity = 2.6 + Math.cos(t * 0.24) * 0.1;

    renderer.render(scene, camera);
  };

  const applyReducedMotion = () => {
    renderer.render(scene, camera);
  };

  resize();

  if (REDUCED.matches) {
    applyReducedMotion();
    REDUCED.addEventListener("change", () => {
      if (REDUCED.matches) {
        cancelAnimationFrame(rafId);
        applyReducedMotion();
      } else {
        last = performance.now();
        animate();
      }
    });
  } else {
    animate();
  }

  stage.classList.add("is-ready");

  /* ── Cleanup ────────────────────────────────────────── */
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(rafId);
    if (io) io.disconnect();
    ro.disconnect();
    if (pointerBound) {
      holder.replaceWith(holder.cloneNode(true));
    }
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => m.dispose());
      }
    });
    envMap.dispose();
    renderer.dispose();
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
