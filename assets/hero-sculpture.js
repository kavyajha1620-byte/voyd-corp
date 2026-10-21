import * as THREE from "./vendor/three.module.min.js";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");
const CREAM = 0xf3ede0;

const init = () => {
  const stage = document.querySelector("[data-hero-sculpture]");
  if (!stage) return;

  const canvas = stage.querySelector("[data-sculpture-canvas]");
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

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.08, 5.9);
  camera.lookAt(0, 0, 0);

  /* â”€â”€ Seamless cream backdrop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   * Fills the canvas with the exact page cream so the
   * artwork merges with the hero instead of sitting in a
   * visible rectangle. Also gives the glass something to
   * refract.
   */
  const backdrop = new THREE.Mesh(
    new THREE.SphereGeometry(40, 32, 24),
    new THREE.MeshBasicMaterial({ color: CREAM, side: THREE.BackSide, depthWrite: false })
  );
  scene.add(backdrop);

  /* â”€â”€ Studio environment for reflections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const makeEnvTexture = () => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#f4eee1");
    grad.addColorStop(0.38, "#dfe3f0");
    grad.addColorStop(0.58, "#7f95ef");
    grad.addColorStop(0.78, "#22307a");
    grad.addColorStop(1, "#0a1029");
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
    softbox(280, 130, 230, 140, 0.95);
    softbox(790, 170, 190, 120, 0.75);
    softbox(540, 330, 300, 170, 0.3);

    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromEquirectangular(makeEnvTexture()).texture;
  scene.environment = envMap;
  pmrem.dispose();

  /* â”€â”€ Lighting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));

  const key = new THREE.DirectionalLight(0xfff3e2, 2.6);
  key.position.set(-3.2, 4.4, 4.6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x94acff, 3.0);
  rim.position.set(4.2, 1.6, -3.8);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xffffff, 0.9);
  fill.position.set(0.5, -2.4, 3.4);
  scene.add(fill);

  /* â”€â”€ Letterforms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const letterPath = (kind) => {
    const s = new THREE.Shape();
    if (kind === "V") {
      s.moveTo(0, 1);
      s.lineTo(0.19, 1);
      s.lineTo(0.4, 0.3);
      s.lineTo(0.61, 1);
      s.lineTo(0.8, 1);
      s.lineTo(0.5, 0);
      s.lineTo(0.3, 0);
      s.closePath();
    } else if (kind === "O") {
      s.absellipse(0.4, 0.5, 0.4, 0.5, 0, Math.PI * 2, false, 0);
      const hole = new THREE.Path();
      hole.absellipse(0.4, 0.5, 0.155, 0.275, 0, Math.PI * 2, true, 0);
      s.holes.push(hole);
    } else if (kind === "Y") {
      s.moveTo(0, 1);
      s.lineTo(0.22, 1);
      s.lineTo(0.42, 0.52);
      s.lineTo(0.62, 1);
      s.lineTo(0.84, 1);
      s.lineTo(0.52, 0.4);
      s.lineTo(0.52, 0);
      s.lineTo(0.32, 0);
      s.lineTo(0.32, 0.4);
      s.closePath();
    } else {
      s.moveTo(0, 0);
      s.lineTo(0.28, 0);
      s.bezierCurveTo(0.68, 0, 0.82, 0.22, 0.82, 0.5);
      s.bezierCurveTo(0.82, 0.78, 0.68, 1, 0.28, 1);
      s.lineTo(0, 1);
      s.closePath();
      const hole = new THREE.Path();
      hole.moveTo(0.2, 0.18);
      hole.lineTo(0.4, 0.18);
      hole.bezierCurveTo(0.56, 0.18, 0.6, 0.34, 0.6, 0.5);
      hole.bezierCurveTo(0.6, 0.66, 0.56, 0.82, 0.4, 0.82);
      hole.lineTo(0.2, 0.82);
      hole.closePath();
      s.holes.push(hole);
    }
    return s;
  };

  const cobalt = new THREE.MeshPhysicalMaterial({
    color: 0x1b3ad4,
    metalness: 0.16,
    roughness: 0.34,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.25,
    sheen: 0.35,
    sheenColor: new THREE.Color(0x5470ff)
  });

  const extrude = {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.028,
    bevelSegments: 3,
    curveSegments: 24
  };

  const word = new THREE.Group();
  word.rotation.set(0.1, -0.32, -0.13);
  word.position.x = 0.0;

  const glyphs = [
    { k: "V", x: -0.72, y: 0.02, z: 0.34, ry: 0.13, rz: 0.02, s: 1.02 },
    { k: "O", x: -0.14, y: -0.02, z: -0.04, ry: -0.06, rz: -0.01, s: 0.98 },
    { k: "Y", x: 0.42, y: 0.01, z: -0.18, ry: 0.11, rz: 0.02, s: 1.0 },
    { k: "D", x: 0.98, y: -0.01, z: -0.52, ry: -0.15, rz: -0.02, s: 1.02 }
  ];

  const reflect = new THREE.MeshBasicMaterial({
    color: 0x2d43ad,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const reflected = new THREE.Group();
  reflected.rotation.set(0.1, -0.32, -0.13);
  reflected.position.x = 0.0;

  glyphs.forEach((g) => {
    const geo = new THREE.ExtrudeGeometry(letterPath(g.k), extrude);
    geo.center();
    const mesh = new THREE.Mesh(geo, cobalt);
    mesh.scale.set(0.96 * g.s, 1.30 * g.s, 1);
    mesh.position.set(g.x, g.y, g.z);
    mesh.rotation.set(0.02, g.ry, g.rz);
    word.add(mesh);

    const rmesh = new THREE.Mesh(geo, reflect);
    rmesh.scale.set(0.96 * g.s, -1.30 * g.s, 1);
    rmesh.position.set(g.x, g.y, g.z);
    rmesh.rotation.set(0.02, g.ry, g.rz);
    reflected.add(rmesh);
  });
  scene.add(word);

  reflected.position.y = -1.96;
  reflected.scale.y = 0.9;
  scene.add(reflected);

  /* â”€â”€ Glass rings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.02,
    transmission: 1,
    thickness: 0.5,
    attenuationColor: new THREE.Color(0xd4ddff),
    attenuationDistance: 2.4,
    ior: 1.48,
    transparent: true,
    opacity: 1,
    envMapIntensity: 1.7,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    side: THREE.DoubleSide
  });

  const rings = new THREE.Group();

  const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.034, 20, 160), glass);
  ringA.rotation.set(1.28, 0.08, -0.3);
  rings.add(ringA);

  const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.022, 16, 160), glass);
  ringB.rotation.set(1.4, -0.36, 0.18);
  rings.add(ringB);

  const ringC = new THREE.Mesh(new THREE.TorusGeometry(1.04, 0.016, 14, 140), glass);
  ringC.rotation.set(1.1, 0.5, 0.5);
  rings.add(ringC);

  scene.add(rings);

  /* â”€â”€ Spheres â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const polished = new THREE.MeshPhysicalMaterial({
    color: 0x1c3ee0,
    metalness: 0.82,
    roughness: 0.06,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.5
  });

  const crystal = new THREE.MeshPhysicalMaterial({
    color: 0xe8efff,
    metalness: 0,
    roughness: 0.01,
    transmission: 1,
    thickness: 0.6,
    ior: 1.52,
    transparent: true,
    envMapIntensity: 2,
    clearcoat: 1,
    clearcoatRoughness: 0.02
  });

  const spheres = [];
  const addSphere = (radius, position, material, phase) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 48), material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.userData.baseY = position[1];
    mesh.userData.phase = phase;
    mesh.userData.amplitude = 0.02 + phase * 0.012;
    scene.add(mesh);
    spheres.push(mesh);
    return mesh;
  };

  addSphere(0.36, [0.05, -0.1, 0.86], polished, 1);
  addSphere(0.13, [-0.6, 0.98, 0.42], crystal, 2);
  addSphere(0.1, [0.97, -0.9, 0.55], crystal, 3);
  addSphere(0.06, [0.72, 0.84, -0.12], crystal, 4);

  /* â”€â”€ Soft contact shadow + floor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const shadowTexture = (() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(18,22,52,0.42)");
    g.addColorStop(0.45, "rgba(18,22,52,0.16)");
    g.addColorStop(1, "rgba(18,22,52,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 1.4),
    new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -0.98, 0.2);
  scene.add(shadow);

  /* â”€â”€ Resize â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  /* â”€â”€ Animation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  let visible = true;
  let last = performance.now();
  let elapsed = 0;

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
      },
      { threshold: 0 }
    );
    io.observe(holder);
  }

  const animate = () => {
    requestAnimationFrame(animate);
    if (!visible || document.hidden) return;

    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;
    const t = elapsed;

    rings.rotation.y += dt * 0.12;
    rings.rotation.x = Math.sin(t * 0.18) * 0.05;
    rings.rotation.z += dt * 0.015;

    word.rotation.z = -0.13 + Math.sin(t * 0.25) * 0.012;
    word.position.y = Math.sin(t * 0.4) * 0.015;

    reflected.rotation.z = word.rotation.z;
    reflected.position.y = -1.96 + word.position.y * 0.6;

    spheres.forEach((sphere) => {
      sphere.position.y = sphere.userData.baseY + Math.sin(t * 0.5 + sphere.userData.phase) * sphere.userData.amplitude;
    });

    key.intensity = 2.6 + Math.sin(t * 0.3) * 0.1;
    rim.intensity = 3.0 + Math.cos(t * 0.24) * 0.12;

    renderer.render(scene, camera);
  };

  const applyMotionPreference = () => {
    if (REDUCED.matches) {
      renderer.render(scene, camera);
    }
  };

  resize();

  if (REDUCED.matches) {
    applyMotionPreference();
    REDUCED.addEventListener("change", () => {
      if (REDUCED.matches) {
        renderer.render(scene, camera);
      } else {
        last = performance.now();
        animate();
      }
    });
  } else {
    animate();
  }

  stage.classList.add("is-ready");
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
