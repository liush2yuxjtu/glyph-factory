import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js";

const assets = window.GLYPH_ASSET_REGISTRY || [];
const flows = window.GLYPH_FLOW_SCREENS || [];
const assetById = new Map(assets.map((asset) => [asset.id, asset]));

const $ = (id) => document.getElementById(id);
const canvas = $("asset-canvas");
const assetList = $("asset-list");
const stageTitle = $("stage-title");
const stageFamily = $("stage-family");
const stageAha = $("stage-aha");
const stageImpact = $("stage-impact");
const assetAppears = $("asset-appears");
const assetPurpose = $("asset-purpose");
const assetAction = $("asset-action");
const flowStrip = $("flow-strip");
const flowWorld = $("flow-world");
const flowScreenId = $("flow-screen-id");
const flowScreenRange = $("flow-screen-range");
const flowTitle = $("flow-title");
const flowSubtitle = $("flow-subtitle");
const flowGoal = $("flow-goal");
const flowInteraction = $("flow-interaction");
const flowShift = $("flow-shift");
const flowAssets = $("flow-assets");

let currentFilter = "all";
let selectedAsset = assets[0] || null;
let selectedFlow = flows[0] || null;
let activeAt = -Infinity;
let dragStart = null;
let dragMoved = false;
let yaw = -0.45;
let pitch = 0.08;

function createFallbackRenderer(targetCanvas) {
  const ctx = targetCanvas.getContext("2d");
  let pixelRatio = 1;
  let cssWidth = 1;
  let cssHeight = 1;
  let frameId = 0;

  targetCanvas.dataset.renderer = "canvas2d";

  function draw(now) {
    if (!ctx) return;
    const asset = selectedAsset || { family: "artifact", name: "Glyph", cn: "字形", accent: "#68ddff" };
    const age = (now - activeAt) / 1000;
    const pulse = age >= 0 && age <= 1.35 ? 1 - age / 1.35 : 0;
    const accent = asset.accent || "#68ddff";
    const w = cssWidth;
    const h = cssHeight;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const bg = ctx.createRadialGradient(w * 0.5, h * 0.36, 10, w * 0.5, h * 0.52, Math.max(w, h) * 0.7);
    bg.addColorStop(0, "rgba(104,221,255,.12)");
    bg.addColorStop(.45, "rgba(174,124,255,.05)");
    bg.addColorStop(1, "rgba(5,7,12,0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2 + Math.sin(yaw) * 26, h * 0.58 + pitch * 36);
    const scale = Math.min(w, h) / 360;
    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(0,0,0,.28)";
    ctx.beginPath();
    ctx.ellipse(0, 112, 94, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    const ringRadius = 96 + pulse * 14;
    ctx.strokeStyle = accent;
    ctx.globalAlpha = .34 + pulse * .42;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 78, ringRadius, ringRadius * .22, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (asset.family === "worker") {
      ctx.fillStyle = "#2a2d39";
      ctx.fillRect(-34, 20, 68, 78);
      ctx.fillStyle = "#e8dac3";
      ctx.fillRect(-30, 24, 60, 56);
      ctx.fillStyle = "#f0c2a0";
      ctx.beginPath();
      ctx.arc(0, -12, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.ellipse(0, -42, 42, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-38, -45, 76, 14);
      ctx.fillStyle = "#151821";
      ctx.beginPath();
      ctx.arc(-12, -10, 3.5, 0, Math.PI * 2);
      ctx.arc(12, -10, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#e8dac3";
      ctx.lineWidth = 13;
      const armSwing = pulse * 24;
      ctx.beginPath();
      ctx.moveTo(-28, 35);
      ctx.lineTo(-54, 68 - armSwing);
      ctx.moveTo(28, 35);
      ctx.lineTo(54, 68 + armSwing);
      ctx.stroke();
      ctx.strokeStyle = "#343847";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(-18, 92);
      ctx.lineTo(-24, 126);
      ctx.moveTo(18, 92);
      ctx.lineTo(24, 126);
      ctx.stroke();
    } else if (asset.id === "lever") {
      ctx.fillStyle = "#56331f";
      ctx.fillRect(-72, 50, 144, 48);
      ctx.fillStyle = "#a96832";
      ctx.fillRect(-58, 38, 116, 20);
      ctx.save();
      ctx.translate(0, 44);
      ctx.rotate(-0.45 + pulse * 0.95);
      ctx.fillStyle = "#6c7380";
      ctx.fillRect(-6, -96, 12, 100);
      ctx.fillStyle = "#d25c40";
      ctx.beginPath();
      ctx.arc(0, -100, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (asset.id === "crank") {
      ctx.fillStyle = "#56331f";
      ctx.fillRect(-70, 40, 140, 64);
      ctx.strokeStyle = "#d49748";
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.arc(0, 22, 48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.save();
      ctx.translate(0, 22);
      ctx.rotate(now / 900 * (pulse > 0 ? 6 : .5));
      ctx.lineWidth = 6;
      for (let i = 0; i < 6; i += 1) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(48, 0);
        ctx.stroke();
      }
      ctx.restore();
    } else if (asset.id === "insight-crystal") {
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 34 + pulse * 30;
      ctx.beginPath();
      ctx.moveTo(0, -78 - pulse * 12);
      ctx.lineTo(52, 5);
      ctx.lineTo(0, 88 + pulse * 12);
      ctx.lineTo(-52, 5);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (asset.id === "expanding-node-tower") {
      for (let i = 0; i < 4; i += 1) {
        const y = 82 - i * (42 + pulse * 5);
        ctx.fillStyle = i === 3 ? accent : i % 2 ? "#a96832" : "#56331f";
        ctx.fillRect(-58 + i * 6, y - 28, 116 - i * 12, 30);
      }
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(0, -105 - pulse * 22);
      ctx.lineTo(22, -70 - pulse * 12);
      ctx.lineTo(0, -44 - pulse * 6);
      ctx.lineTo(-22, -70 - pulse * 12);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = "#2a2d39";
      ctx.fillRect(-72, 38, 144, 64);
      ctx.fillStyle = accent;
      ctx.globalAlpha = .85;
      ctx.fillRect(-48, -34 - pulse * 6, 96, 72);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(255,255,255,.72)";
      ctx.lineWidth = 3;
      ctx.strokeRect(-48, -34 - pulse * 6, 96, 72);
    }

    ctx.fillStyle = "rgba(12,14,20,.76)";
    ctx.fillRect(-100, 142, 200, 48);
    ctx.fillStyle = accent;
    ctx.font = "700 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(asset.name, 0, 163);
    ctx.fillStyle = "#d8d8df";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText(asset.cn, 0, 180);
    ctx.restore();
  }

  return {
    shadowMap: { enabled: false, type: null },
    setPixelRatio(value) {
      pixelRatio = Math.max(1, Number(value) || 1);
    },
    setSize(width, height) {
      cssWidth = Math.max(1, width);
      cssHeight = Math.max(1, height);
      targetCanvas.width = Math.max(1, Math.round(cssWidth * pixelRatio));
      targetCanvas.height = Math.max(1, Math.round(cssHeight * pixelRatio));
    },
    render() {
      draw(performance.now());
    },
    setAnimationLoop(callback) {
      if (frameId) cancelAnimationFrame(frameId);
      const tick = (now) => {
        callback(now);
        frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);
    }
  };
}

function supportsWebGL() {
  try {
    const probe = document.createElement("canvas");
    return Boolean(probe.getContext("webgl2") || probe.getContext("webgl"));
  } catch {
    return false;
  }
}

const hasWebGL = supportsWebGL();
const renderer = hasWebGL
  ? new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  : createFallbackRenderer(canvas);

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
if (hasWebGL) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0f1219, 10, 22);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(5.8, 4.2, 7.3);
camera.lookAt(0, 1.15, 0);

const hemi = new THREE.HemisphereLight(0xbcecff, 0x5b3820, 1.15);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0xffd6a0, 3.1);
keyLight.position.set(4.5, 7, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x7ee5ff, 2.25);
rimLight.position.set(-5, 3, -4);
scene.add(rimLight);

const violetLight = new THREE.PointLight(0xa678ff, 3.2, 8, 2);
violetLight.position.set(-2.7, 2.3, 2.5);
scene.add(violetLight);

const worldRoot = new THREE.Group();
scene.add(worldRoot);

const modelRoot = new THREE.Group();
modelRoot.position.y = 0.08;
scene.add(modelRoot);

const stageRoot = new THREE.Group();
scene.add(stageRoot);

function mat(color, roughness = 0.55, metalness = 0.16, emissive = 0x000000, emissiveIntensity = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive,
    emissiveIntensity
  });
}

const materials = {
  bronze: mat(0xa96832, 0.4, 0.72),
  darkBronze: mat(0x56331f, 0.48, 0.76),
  brass: mat(0xd49748, 0.36, 0.7),
  steel: mat(0x6c7380, 0.28, 0.82),
  dark: mat(0x222531, 0.63, 0.28),
  darkSoft: mat(0x343847, 0.7, 0.16),
  ivory: mat(0xe8dac3, 0.82, 0.03),
  skin: mat(0xf0c2a0, 0.8, 0.02),
  blue: mat(0x5fc8ec, 0.44, 0.2, 0x1c809e, 0.36),
  violet: mat(0x9e73e8, 0.38, 0.18, 0x552a9d, 0.45),
  amber: mat(0xef9b43, 0.42, 0.26, 0x8a4215, 0.24),
  green: mat(0x76c9a0, 0.62, 0.08),
  whiteGlow: mat(0xf7f1dc, 0.38, 0.08, 0x8fdfff, 0.28),
  red: mat(0xd25c40, 0.5, 0.3),
  black: mat(0x12141a, 0.72, 0.2)
};

function mesh(geometry, material, position, rotation) {
  const item = new THREE.Mesh(geometry, material);
  if (position) item.position.set(position[0], position[1], position[2]);
  if (rotation) item.rotation.set(rotation[0], rotation[1], rotation[2]);
  item.castShadow = true;
  item.receiveShadow = true;
  return item;
}

function box(size, material, position, rotation) {
  return mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material, position, rotation);
}

function sphere(radius, material, position, widthSegments = 28, heightSegments = 18) {
  return mesh(new THREE.SphereGeometry(radius, widthSegments, heightSegments), material, position);
}

function cyl(radiusTop, radiusBottom, height, material, position, rotation, segments = 28) {
  return mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material, position, rotation);
}

function torus(radius, tube, material, position, rotation, segments = 48) {
  return mesh(new THREE.TorusGeometry(radius, tube, 16, segments), material, position, rotation);
}

function glowingMaterial(hex) {
  const color = new THREE.Color(hex);
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.32,
    metalness: 0.12,
    emissive: color,
    emissiveIntensity: 0.65
  });
}

function createPedestal() {
  const group = new THREE.Group();
  const lower = cyl(2.26, 2.42, 0.34, materials.darkBronze, [0, 0.02, 0]);
  const mid = cyl(1.92, 2.08, 0.24, materials.bronze, [0, 0.28, 0]);
  const top = cyl(1.72, 1.86, 0.18, materials.dark, [0, 0.47, 0]);
  group.add(lower, mid, top);

  const ring = torus(1.78, 0.035, materials.amber, [0, 0.57, 0], [Math.PI / 2, 0, 0]);
  group.add(ring);

  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    const light = sphere(0.055, materials.whiteGlow, [Math.cos(angle) * 1.92, 0.33, Math.sin(angle) * 1.92], 12, 8);
    group.add(light);
  }
  return group;
}

function createWorldNodes() {
  const group = new THREE.Group();
  group.position.set(0, 0.2, -2.6);
  const nodes = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = Math.PI * 0.15 + i * 0.52;
    const radius = 3.25 + (i % 2) * 0.35;
    const y = 1.05 + (i % 3) * 0.5;
    const node = new THREE.Group();
    node.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    const island = cyl(0.36, 0.46, 0.2, materials.darkSoft, [0, 0, 0]);
    const glow = sphere(0.09, i < 3 ? materials.blue : materials.violet, [0, 0.23, 0], 16, 12);
    node.add(island, glow);
    node.userData.glow = glow;
    node.userData.baseScale = 0.86 + i * 0.025;
    group.add(node);
    nodes.push(node);
  }

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x58d9ff, transparent: true, opacity: 0.34 });
  for (let i = 0; i < nodes.length - 1; i += 1) {
    const points = [nodes[i].position.clone(), nodes[i + 1].position.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, lineMaterial);
    group.add(line);
  }
  group.userData.nodes = nodes;
  return group;
}

stageRoot.add(createPedestal());
worldRoot.add(createWorldNodes());

const floor = cyl(8.2, 8.2, 0.05, mat(0x0b0d12, 1, 0), [0, -0.2, 0], null, 64);
floor.receiveShadow = true;
scene.add(floor);

function addArm(parent, side, y, material) {
  const arm = new THREE.Group();
  arm.position.set(side * 0.43, y, 0);
  const upper = cyl(0.11, 0.12, 0.58, material, [0, -0.26, 0], [0, 0, side * 0.15]);
  const hand = sphere(0.12, materials.skin, [0, -0.58, 0], 16, 10);
  arm.add(upper, hand);
  parent.add(arm);
  return arm;
}

function addLeg(parent, side, material) {
  const leg = new THREE.Group();
  leg.position.set(side * 0.2, 0.48, 0);
  leg.add(cyl(0.12, 0.14, 0.58, material, [0, -0.28, 0]));
  leg.add(box([0.22, 0.13, 0.36], materials.black, [0, -0.61, 0.09]));
  parent.add(leg);
  return leg;
}

function createWorker(asset) {
  const group = new THREE.Group();
  const accent = glowingMaterial(asset.accent);
  const body = new THREE.Group();
  const id = asset.id;
  body.position.y = 0.58;
  group.add(body);

  const torso = new THREE.Group();
  body.add(torso);

  if (id === "builder") {
    torso.add(box([0.98, 0.82, 0.58], materials.ivory, [0, 0.7, 0]));
    torso.add(box([1.08, 0.22, 0.64], materials.dark, [0, 0.47, 0.02]));
    torso.add(box([0.24, 0.28, 0.68], accent, [-0.56, 0.9, -0.02]));
    torso.add(box([0.24, 0.28, 0.68], accent, [0.56, 0.9, -0.02]));
  } else if (id === "connector") {
    torso.add(box([0.62, 0.96, 0.44], materials.ivory, [0, 0.72, 0]));
    torso.add(torus(0.35, 0.055, materials.blue, [0, 0.95, 0.28], [Math.PI / 2, 0, 0]));
  } else if (id === "illuminator") {
    const robe = mesh(new THREE.ConeGeometry(0.62, 1.3, 28), materials.ivory, [0, 0.72, 0]);
    robe.rotation.y = Math.PI;
    torso.add(robe);
    torso.add(box([0.68, 0.18, 0.46], materials.amber, [0, 0.45, 0.05]));
  } else if (id === "archivist") {
    torso.add(box([0.72, 0.94, 0.5], materials.green, [0, 0.7, 0]));
    torso.add(box([0.76, 0.2, 0.54], materials.darkBronze, [0, 0.46, 0.01]));
  } else if (id === "explorer") {
    torso.add(box([0.66, 1.02, 0.46], materials.darkSoft, [0, 0.72, 0]));
    torso.add(box([0.78, 0.18, 0.52], materials.blue, [0, 0.48, 0.02]));
    torso.rotation.z = -0.07;
  } else {
    torso.add(box([0.76, 0.96, 0.48], materials.ivory, [0, 0.7, 0]));
    torso.add(box([0.84, 0.2, 0.54], materials.darkSoft, [0, 0.46, 0.02]));
  }

  const head = sphere(0.43, materials.skin, [0, 1.52, 0], 32, 20);
  body.add(head);

  if (id !== "illuminator") {
    const hair = sphere(0.44, id === "archivist" ? materials.dark : materials.darkBronze, [0, 1.63, -0.03], 28, 16);
    hair.scale.set(1.02, 0.48, 1.03);
    body.add(hair);
  }

  if (id === "builder") {
    const helmet = sphere(0.5, accent, [0, 1.83, 0], 28, 16);
    helmet.scale.set(1.08, 0.5, 1.05);
    body.add(helmet);
    body.add(box([0.82, 0.07, 0.28], accent, [0.08, 1.76, 0.3]));
  } else if (id === "connector") {
    const cap = sphere(0.47, accent, [0, 1.82, -0.02], 28, 16);
    cap.scale.set(1.08, 0.38, 1.02);
    body.add(cap);
    body.add(torus(0.18, 0.045, materials.brass, [-0.2, 1.82, 0.35], [0, 0, 0]));
    body.add(torus(0.18, 0.045, materials.brass, [0.2, 1.82, 0.35], [0, 0, 0]));
  } else if (id === "illuminator") {
    const hood = torus(0.48, 0.13, materials.ivory, [0, 1.55, -0.03], [Math.PI / 2, 0, 0]);
    hood.scale.y = 1.18;
    body.add(hood);
    body.add(torus(0.58, 0.025, materials.amber, [0, 2.04, 0], [Math.PI / 2, 0, 0]));
  } else if (id === "archivist") {
    const cap = sphere(0.46, materials.green, [0, 1.82, 0], 24, 16);
    cap.scale.set(1.06, 0.35, 1.02);
    body.add(cap);
    body.add(torus(0.16, 0.028, materials.darkBronze, [-0.18, 1.56, 0.39], [0, 0, 0]));
    body.add(torus(0.16, 0.028, materials.darkBronze, [0.18, 1.56, 0.39], [0, 0, 0]));
    body.add(box([0.1, 0.025, 0.025], materials.darkBronze, [0, 1.56, 0.41]));
  } else if (id === "explorer") {
    const navigatorCap = sphere(0.48, materials.blue, [0, 1.83, -0.02], 28, 16);
    navigatorCap.scale.set(1.08, 0.36, 1.05);
    body.add(navigatorCap);
    body.add(torus(0.21, 0.045, materials.brass, [0.18, 1.82, 0.34], [0, 0, 0]));
  } else {
    const beret = cyl(0.49, 0.54, 0.12, accent, [0, 1.86, 0], [0.04, 0, -0.12], 24);
    beret.scale.z = 1.08;
    body.add(beret);
  }

  const eyeL = sphere(0.035, materials.black, [-0.14, 1.56, 0.4], 10, 8);
  const eyeR = sphere(0.035, materials.black, [0.14, 1.56, 0.4], 10, 8);
  body.add(eyeL, eyeR);

  const leftArm = addArm(body, -1, 1.14, id === "archivist" ? materials.green : materials.ivory);
  const rightArm = addArm(body, 1, 1.14, id === "archivist" ? materials.green : materials.ivory);
  const leftLeg = addLeg(body, -1, materials.darkSoft);
  const rightLeg = addLeg(body, 1, materials.darkSoft);

  const accessory = new THREE.Group();
  accessory.position.set(0, 0.95, 0.56);
  body.add(accessory);

  const backpack = new THREE.Group();
  backpack.position.set(0, 1.02, -0.43);
  body.add(backpack);

  let heroPart = null;

  if (id === "builder") {
    backpack.add(box([0.72, 0.9, 0.38], materials.darkBronze, [0, 0, 0]));
    backpack.add(box([0.34, 0.34, 0.08], accent, [0, 0.08, -0.24]));
    const hammer = new THREE.Group();
    hammer.position.set(0.44, 0.05, 0.08);
    hammer.add(cyl(0.055, 0.065, 1.34, materials.brass, [0, -0.34, 0], [0, 0, -0.42]));
    hammer.add(box([0.72, 0.34, 0.38], materials.darkBronze, [-0.28, 0.22, 0]));
    hammer.add(box([0.34, 0.2, 0.42], accent, [-0.57, 0.22, 0]));
    accessory.add(hammer);
    heroPart = hammer;
  } else if (id === "connector") {
    backpack.add(torus(0.46, 0.09, materials.darkBronze, [0, 0.05, 0], [0, 0, 0]));
    backpack.add(torus(0.3, 0.045, materials.blue, [0, 0.05, 0.02], [0, 0, 0]));
    const clamp = new THREE.Group();
    clamp.add(torus(0.3, 0.075, accent, [0.22, 0.04, 0], [0, 0, 0]));
    clamp.add(torus(0.3, 0.075, materials.blue, [-0.22, 0.04, 0], [0, 0, 0]));
    clamp.add(cyl(0.035, 0.035, 1.0, materials.blue, [0, -0.42, -0.05], [0, 0, Math.PI / 2]));
    accessory.add(clamp);
    heroPart = clamp;
  } else if (id === "illuminator") {
    const staff = new THREE.Group();
    staff.position.set(0.42, 0.1, 0.02);
    staff.add(cyl(0.045, 0.055, 1.62, materials.brass, [0, -0.24, 0], [0, 0, -0.1]));
    const orb = sphere(0.25, materials.amber, [0.08, 0.62, 0], 24, 16);
    staff.add(orb);
    staff.add(torus(0.38, 0.025, materials.amber, [0.08, 0.62, 0], [Math.PI / 2.4, 0.3, 0]));
    const point = new THREE.PointLight(new THREE.Color(asset.accent), 3.4, 4.2, 2);
    point.position.set(0.08, 0.62, 0.18);
    staff.add(point);
    accessory.add(staff);
    heroPart = orb;
  } else if (id === "archivist") {
    backpack.add(box([0.66, 1.06, 0.38], materials.darkBronze, [0, 0, 0]));
    for (let i = 0; i < 3; i += 1) {
      backpack.add(cyl(0.09, 0.09, 0.72, i % 2 ? materials.ivory : materials.brass, [-0.2 + i * 0.2, 0.18 + i * 0.12, -0.24], [0, 0, Math.PI / 2], 14));
    }
    const book = box([0.72, 0.5, 0.12], materials.red, [0, 0.02, 0]);
    accessory.add(book);
    accessory.add(box([0.22, 0.24, 0.02], accent, [0, 0.04, 0.07]));
    accessory.rotation.x = -0.18;
    heroPart = book;
  } else if (id === "explorer") {
    backpack.add(box([0.58, 0.84, 0.34], materials.darkBronze, [0, 0, 0]));
    backpack.add(cyl(0.12, 0.14, 0.6, materials.brass, [-0.24, 0.16, -0.18], [0.2, 0, 0]));
    const scope = cyl(0.12, 0.18, 0.9, materials.brass, [0.06, 0.12, 0.04], [Math.PI / 2, 0, 0.3], 20);
    const lens = cyl(0.2, 0.2, 0.06, accent, [0.25, 0.38, 0.42], [Math.PI / 2, 0, 0.3], 20);
    const compass = torus(0.32, 0.05, materials.blue, [-0.34, -0.1, 0.02], [0, 0, 0]);
    accessory.add(scope, lens, compass);
    heroPart = compass;
  } else {
    backpack.add(cyl(0.13, 0.13, 0.92, materials.ivory, [0.28, 0.18, -0.12], [0, 0, 0], 14));
    const map = box([0.88, 0.54, 0.04], mat(0xc9b88e, .9, 0), [0, 0.02, 0]);
    map.rotation.x = -0.12;
    accessory.add(map);
    accessory.add(torus(0.2, 0.035, accent, [-0.36, 0.3, 0.04], [0, 0, 0]));
    heroPart = map;
  }

  group.userData.motion = (t, pulse) => {
    const bounce = Math.sin(t * (id === "connector" ? 3.2 : 2.1)) * (id === "builder" ? 0.018 : 0.03);
    body.position.y = 0.58 + bounce;
    leftArm.rotation.z = -0.18 - Math.sin(t * 2.8) * 0.035 - pulse * (id === "builder" ? 0.12 : 0.34);
    rightArm.rotation.z = 0.18 + Math.sin(t * 2.8 + 0.5) * 0.035 + pulse * (id === "builder" ? 0.64 : 0.42);
    leftLeg.rotation.x = Math.sin(t * 2) * 0.018;
    rightLeg.rotation.x = -Math.sin(t * 2) * 0.018;
    accessory.rotation.y = Math.sin(t * 1.4) * 0.08 + pulse * (id === "connector" ? 0.36 : 0.18);
    if (id === "builder" && heroPart) heroPart.rotation.z = -0.18 + pulse * 0.62;
    if (id === "illuminator" && heroPart) heroPart.scale.setScalar(1 + pulse * 0.32 + Math.sin(t * 2) * 0.04);
    if (id === "explorer" && heroPart) heroPart.rotation.z = t * 0.25 + pulse * 0.5;
    if (id === "archivist" && heroPart) heroPart.rotation.y = Math.sin(t * 1.2) * 0.08;
    if (id === "cartographer" && heroPart) heroPart.rotation.x = -0.12 + Math.sin(t * 1.3) * 0.04;
    group.rotation.y = Math.sin(t * 0.35) * (id === "connector" ? 0.09 : 0.05);
  };
  return group;
}

function createLever() {
  const group = new THREE.Group();
  group.add(box([1.6, 0.38, 1.2], materials.darkBronze, [0, 0.58, 0]));
  group.add(box([1.28, 0.18, 0.9], materials.bronze, [0, 0.85, 0]));
  const pivot = new THREE.Group();
  pivot.position.set(0, 1.1, 0);
  const rod = cyl(0.08, 0.1, 1.52, materials.steel, [0, 0.72, 0], [0, 0, 0]);
  const knob = sphere(0.22, materials.red, [0, 1.55, 0], 24, 16);
  pivot.add(rod, knob);
  pivot.rotation.z = -0.38;
  group.add(pivot);
  group.userData.motion = (t, pulse) => {
    pivot.rotation.z = -0.38 + Math.sin(t * 0.7) * 0.02 + pulse * 0.92;
    knob.rotation.y = t;
  };
  return group;
}

function createCrank() {
  const group = new THREE.Group();
  group.add(box([1.55, 0.62, 0.9], materials.darkBronze, [0, 0.75, 0]));
  const wheel = new THREE.Group();
  wheel.position.set(0, 1.22, 0.52);
  wheel.add(torus(0.62, 0.09, materials.brass, [0, 0, 0], [0, 0, 0]));
  for (let i = 0; i < 6; i += 1) {
    const angle = i * Math.PI / 3;
    const spoke = cyl(0.03, 0.03, 1.1, materials.brass, [0, 0, 0], [0, 0, angle]);
    wheel.add(spoke);
  }
  wheel.add(cyl(0.08, 0.08, 0.7, materials.steel, [0.62, 0, 0.1], [Math.PI / 2, 0, 0]));
  group.add(wheel);
  group.userData.motion = (t, pulse) => {
    wheel.rotation.z = pulse > 0 ? t * 7 : t * 0.45;
  };
  return group;
}

function createGlyphCube(asset) {
  const group = new THREE.Group();
  const accent = glowingMaterial(asset.accent);
  const cube = box([1.5, 1.5, 1.5], accent, [0, 1.28, 0]);
  group.add(cube);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(cube.geometry),
    new THREE.LineBasicMaterial({ color: 0xdff8ff, transparent: true, opacity: 0.88 })
  );
  edges.position.copy(cube.position);
  group.add(edges);

  const core = mesh(new THREE.OctahedronGeometry(0.34, 0), materials.whiteGlow, [0, 1.28, 0]);
  group.add(core);
  group.userData.motion = (t, pulse) => {
    cube.rotation.x = t * 0.16;
    cube.rotation.y = t * 0.25;
    edges.rotation.copy(cube.rotation);
    core.rotation.y = -t * 0.8;
    core.scale.setScalar(1 + pulse * 0.28 + Math.sin(t * 2.2) * 0.04);
    group.position.y = Math.sin(t * 1.35) * 0.05 + pulse * 0.14;
  };
  return group;
}

function createAnnotationFlag(asset) {
  const group = new THREE.Group();
  group.add(cyl(0.055, 0.07, 2.35, materials.brass, [0, 1.45, 0]));
  const flag = box([1.25, 0.68, 0.05], glowingMaterial(asset.accent), [0.64, 2.12, 0]);
  flag.geometry.translate(0.6, 0, 0);
  group.add(flag);
  const base = cyl(0.62, 0.78, 0.34, materials.darkBronze, [0, 0.38, 0]);
  group.add(base);
  group.userData.motion = (t, pulse) => {
    flag.rotation.y = Math.sin(t * 3.1) * 0.05 + pulse * 0.18;
    flag.rotation.z = Math.sin(t * 2.4) * 0.02;
  };
  return group;
}

function createMagnifier(asset) {
  const group = new THREE.Group();
  const glow = glowingMaterial(asset.accent);
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xa9eaff,
    transparent: true,
    opacity: 0.18,
    roughness: 0.05,
    transmission: 0.48,
    side: THREE.DoubleSide
  });

  group.add(cyl(1.3, 1.48, 0.34, materials.darkBronze, [0, 0.36, 0]));
  group.add(cyl(1.05, 1.18, 0.22, materials.bronze, [0, 0.62, 0]));
  group.add(cyl(0.7, 0.82, 0.18, materials.dark, [0, 0.82, 0]));

  const yoke = new THREE.Group();
  yoke.position.y = 1.7;
  yoke.add(box([0.18, 1.82, 0.22], materials.brass, [-1.12, 0, 0]));
  yoke.add(box([0.18, 1.82, 0.22], materials.brass, [1.12, 0, 0]));
  yoke.add(box([2.34, 0.18, 0.22], materials.brass, [0, 0.88, 0]));
  group.add(yoke);

  const lensRig = new THREE.Group();
  lensRig.position.set(0, 1.75, 0);
  const outer = torus(0.98, 0.11, materials.brass, [0, 0, 0], [0, 0, 0]);
  const mid = torus(0.75, 0.055, glow, [0, 0, 0.02], [0.15, 0.2, 0]);
  const inner = torus(0.54, 0.035, materials.violet, [0, 0, 0.05], [-0.18, 0.28, 0]);
  const glass = mesh(new THREE.CircleGeometry(0.86, 64), glassMaterial, [0, 0, 0.01]);
  const focus = mesh(new THREE.OctahedronGeometry(0.2, 0), materials.whiteGlow, [0, 0, 0.24]);
  lensRig.add(outer, mid, inner, glass, focus);
  group.add(lensRig);

  const panels = [];
  const panelPositions = [
    [-1.48, 1.9, 0.12],
    [1.48, 1.94, 0.08],
    [-1.16, 0.95, 0.22],
    [1.18, 0.96, 0.2]
  ];
  panelPositions.forEach((position, index) => {
    const panel = box([0.5, 0.68, 0.055], index % 2 ? materials.violet : materials.blue, position);
    panel.rotation.y = index % 2 ? -0.25 : 0.25;
    group.add(panel);
    panels.push(panel);
  });

  const opticL = cyl(0.22, 0.28, 0.56, materials.steel, [-1.02, 1.45, 0.3], [Math.PI / 2, 0, 0], 20);
  const opticR = cyl(0.22, 0.28, 0.56, materials.steel, [1.02, 1.45, 0.3], [Math.PI / 2, 0, 0], 20);
  group.add(opticL, opticR);

  const point = new THREE.PointLight(new THREE.Color(asset.accent), 3.6, 5.2, 2);
  point.position.set(0, 1.75, 0.8);
  group.add(point);

  group.userData.motion = (t, pulse) => {
    lensRig.rotation.y = Math.sin(t * 0.35) * 0.18;
    mid.rotation.z = t * 0.32 + pulse * 0.6;
    inner.rotation.z = -t * 0.48 - pulse * 0.8;
    outer.rotation.z = Math.sin(t * 0.4) * 0.05;
    focus.rotation.x = t * 0.7;
    focus.rotation.y = t * 0.9;
    focus.scale.setScalar(1 + pulse * 0.34 + Math.sin(t * 2.2) * 0.04);
    panels.forEach((panel, index) => {
      panel.position.y += Math.sin(t * 1.4 + index) * 0.0015;
      panel.scale.setScalar(1 + pulse * 0.08 * (1 + index * 0.15));
    });
    point.intensity = 3.2 + pulse * 4.4 + Math.sin(t * 2.4) * 0.35;
    group.position.y = Math.sin(t * 0.8) * 0.025;
  };
  return group;
}

function createProjector(asset) {
  const group = new THREE.Group();
  const glow = glowingMaterial(asset.accent);
  const holoMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(asset.accent),
    transparent: true,
    opacity: 0.24,
    roughness: 0.2,
    metalness: 0.05,
    emissive: new THREE.Color(asset.accent),
    emissiveIntensity: 0.58
  });

  group.add(cyl(1.72, 1.95, 0.34, materials.darkBronze, [0, 0.34, 0], null, 48));
  group.add(cyl(1.48, 1.66, 0.22, materials.bronze, [0, 0.61, 0], null, 48));
  group.add(cyl(1.16, 1.28, 0.18, materials.dark, [0, 0.83, 0], null, 48));

  const core = mesh(new THREE.OctahedronGeometry(0.34, 0), materials.violet, [0, 1.12, 0]);
  group.add(core);

  const world = new THREE.Group();
  world.position.set(0, 2.02, 0);
  const globe = sphere(0.72, holoMaterial, [0, 0, 0], 36, 24);
  world.add(globe);
  const ringA = torus(0.98, 0.035, glow, [0, 0, 0], [Math.PI / 2.6, 0.22, 0]);
  const ringB = torus(1.28, 0.028, materials.violet, [0, 0, 0], [Math.PI / 2, 0, 0.45]);
  const ringC = torus(1.52, 0.022, materials.blue, [0, 0, 0], [Math.PI / 2.2, -0.35, -0.2]);
  world.add(ringA, ringB, ringC);

  const islands = [];
  const islandSpecs = [
    [-0.82, 0.48, 0.05, 0.34],
    [0.74, 0.34, 0.16, 0.3],
    [0.18, -0.42, 0.54, 0.26],
    [0.2, 0.7, -0.42, 0.22]
  ];
  islandSpecs.forEach((spec, index) => {
    const island = new THREE.Group();
    island.position.set(spec[0], spec[1], spec[2]);
    island.add(cyl(spec[3], spec[3] * 1.15, 0.13, materials.darkSoft, [0, 0, 0], null, 20));
    island.add(box([0.16, 0.22 + index * 0.03, 0.16], index % 2 ? materials.ivory : materials.brass, [0, 0.16, 0]));
    island.add(sphere(0.08, materials.green, [spec[3] * 0.55, 0.16, 0], 12, 8));
    world.add(island);
    islands.push(island);
  });
  group.add(world);

  const consoles = [];
  for (let i = 0; i < 4; i += 1) {
    const angle = i * Math.PI / 2 + Math.PI / 4;
    const consoleGroup = new THREE.Group();
    consoleGroup.position.set(Math.cos(angle) * 1.48, 0.88, Math.sin(angle) * 1.48);
    consoleGroup.rotation.y = -angle + Math.PI / 2;
    consoleGroup.add(box([0.54, 0.42, 0.42], materials.darkBronze, [0, 0, 0]));
    consoleGroup.add(box([0.38, 0.24, 0.04], i % 2 ? materials.violet : materials.blue, [0, 0.1, 0.23], [-0.22, 0, 0]));
    group.add(consoleGroup);
    consoles.push(consoleGroup);
  }

  const beacon = new THREE.Group();
  beacon.position.set(0, 1.1, -1.54);
  beacon.add(cyl(0.12, 0.16, 1.35, materials.brass, [0, 0.55, 0]));
  beacon.add(torus(0.24, 0.045, glow, [0, 1.24, 0], [Math.PI / 2, 0, 0]));
  beacon.add(mesh(new THREE.OctahedronGeometry(0.16, 0), materials.whiteGlow, [0, 1.24, 0]));
  group.add(beacon);

  const point = new THREE.PointLight(new THREE.Color(asset.accent), 4.8, 7, 2);
  point.position.set(0, 2.1, 0.6);
  group.add(point);

  group.userData.motion = (t, pulse) => {
    world.rotation.y = t * 0.16;
    globe.scale.setScalar(1 + pulse * 0.08 + Math.sin(t * 1.2) * 0.018);
    ringA.rotation.z = t * 0.34;
    ringB.rotation.z = -t * 0.22;
    ringC.rotation.z = t * 0.14;
    islands.forEach((island, index) => {
      island.position.y += Math.sin(t * 1.4 + index) * 0.0018;
      island.scale.setScalar(1 + pulse * (0.12 + index * 0.025));
    });
    core.rotation.y = t * 0.8;
    core.position.y = 1.12 + pulse * 0.18;
    consoles.forEach((consoleGroup, index) => {
      consoleGroup.rotation.z = Math.sin(t * 0.7 + index) * 0.02;
    });
    point.intensity = 4.2 + pulse * 5.6 + Math.sin(t * 2) * 0.3;
  };
  return group;
}

function createConveyor(asset) {
  const group = new THREE.Group();
  group.add(box([3.2, 0.34, 1.25], materials.darkBronze, [0, 0.62, 0]));
  group.add(box([2.95, 0.12, 1.05], materials.dark, [0, 0.84, 0]));
  for (let i = -2; i <= 2; i += 1) {
    group.add(cyl(0.11, 0.11, 1.04, materials.steel, [i * 0.58, 0.9, 0], [Math.PI / 2, 0, 0], 16));
  }
  const cubes = [];
  for (let i = 0; i < 3; i += 1) {
    const item = box([0.54, 0.54, 0.54], glowingMaterial(asset.accent), [-1.1 + i * 0.96, 1.24, 0]);
    group.add(item);
    cubes.push(item);
  }
  group.userData.motion = (t, pulse) => {
    cubes.forEach((item, index) => {
      const speed = pulse > 0 ? 1.8 : 0.24;
      const x = ((t * speed + index * 1.08) % 3.4) - 1.7;
      item.position.x = x;
      item.rotation.y = t * 0.6 + index;
    });
  };
  return group;
}

function createStampMachine(asset) {
  const group = new THREE.Group();
  group.add(box([2.15, 0.34, 1.7], materials.darkBronze, [0, 0.45, 0]));
  group.add(box([1.72, 0.18, 1.35], materials.dark, [0, 0.72, 0]));
  const posts = [-0.78, 0.78];
  posts.forEach((x) => {
    group.add(box([0.2, 2.15, 0.2], materials.bronze, [x, 1.68, 0]));
  });
  group.add(box([1.8, 0.24, 0.5], materials.bronze, [0, 2.72, 0]));
  const stamp = new THREE.Group();
  stamp.position.set(0, 2.28, 0);
  stamp.add(cyl(0.21, 0.24, 1.0, materials.steel, [0, 0, 0]));
  stamp.add(box([1.02, 0.22, 0.78], glowingMaterial(asset.accent), [0, -0.58, 0]));
  group.add(stamp);
  const cubeA = box([0.54, 0.54, 0.54], materials.blue, [-0.4, 1.08, 0]);
  const cubeB = box([0.54, 0.54, 0.54], materials.violet, [0.4, 1.08, 0]);
  group.add(cubeA, cubeB);
  group.userData.motion = (t, pulse) => {
    stamp.position.y = 2.28 - Math.sin(Math.min(1, pulse) * Math.PI) * 0.88;
    cubeA.rotation.y = t * 0.2;
    cubeB.rotation.y = -t * 0.22;
  };
  return group;
}

function createCrystal(asset) {
  const group = new THREE.Group();
  const crystalMaterial = glowingMaterial(asset.accent);
  crystalMaterial.emissiveIntensity = 0.9;
  const crystal = mesh(new THREE.OctahedronGeometry(0.92, 1), crystalMaterial, [0, 1.55, 0]);
  crystal.scale.y = 1.45;
  group.add(crystal);
  group.add(torus(1.05, 0.035, materials.violet, [0, 1.5, 0], [Math.PI / 2, 0, 0]));
  group.add(torus(0.78, 0.025, materials.blue, [0, 1.5, 0], [Math.PI / 2.5, 0.35, 0]));
  group.add(cyl(1.14, 1.34, 0.32, materials.darkBronze, [0, 0.42, 0]));
  const point = new THREE.PointLight(new THREE.Color(asset.accent), 4.4, 5, 2);
  point.position.set(0, 1.55, 0);
  group.add(point);
  group.userData.motion = (t, pulse) => {
    crystal.rotation.y = t * 0.44;
    crystal.rotation.x = Math.sin(t * 0.55) * 0.12;
    crystal.position.y = 1.55 + Math.sin(t * 1.7) * 0.08 + pulse * 0.18;
    crystal.scale.set(1 + pulse * 0.13, 1.45 + pulse * 0.22, 1 + pulse * 0.13);
    point.intensity = 3.8 + pulse * 5.4 + Math.sin(t * 2.2) * 0.4;
  };
  return group;
}

function createTower(asset) {
  const group = new THREE.Group();
  const floors = [];
  for (let i = 0; i < 4; i += 1) {
    const floorGroup = new THREE.Group();
    floorGroup.position.y = 0.58 + i * 0.62;
    floorGroup.add(cyl(0.9 - i * 0.08, 1.02 - i * 0.08, 0.24, i % 2 ? materials.bronze : materials.darkBronze, [0, 0, 0]));
    const core = box([0.52, 0.48, 0.52], i === 3 ? glowingMaterial(asset.accent) : materials.darkSoft, [0, 0.32, 0]);
    floorGroup.add(core);
    floors.push(floorGroup);
    group.add(floorGroup);
  }
  const crown = mesh(new THREE.OctahedronGeometry(0.34, 0), glowingMaterial(asset.accent), [0, 3.18, 0]);
  group.add(crown);
  for (let i = 0; i < 3; i += 1) {
    const bridge = box([1.15, 0.08, 0.24], materials.steel, [0.92 + i * 0.12, 1.02 + i * 0.62, 0], [0, 0, 0.08 * i]);
    bridge.rotation.y = i % 2 ? 0.65 : -0.65;
    group.add(bridge);
  }
  group.userData.motion = (t, pulse) => {
    floors.forEach((floorGroup, index) => {
      floorGroup.rotation.y = (index % 2 ? -1 : 1) * t * 0.08;
      floorGroup.position.y = 0.58 + index * 0.62 + Math.sin(t * 1.2 + index) * 0.025 + pulse * index * 0.08;
    });
    crown.rotation.y = t * 0.8;
    crown.position.y = 3.18 + Math.sin(t * 2.1) * 0.07 + pulse * 0.22;
  };
  return group;
}

function createModel(asset) {
  if (!asset) return new THREE.Group();
  if (asset.family === "worker") return createWorker(asset);
  if (asset.id === "lever") return createLever(asset);
  if (asset.id === "crank") return createCrank(asset);
  if (asset.id === "glyph-cube") return createGlyphCube(asset);
  if (asset.id === "annotation-flag") return createAnnotationFlag(asset);
  if (asset.id === "magnifier") return createMagnifier(asset);
  if (asset.id === "projector-beacon") return createProjector(asset);
  if (asset.id === "conveyor") return createConveyor(asset);
  if (asset.id === "stamp-machine") return createStampMachine(asset);
  if (asset.id === "insight-crystal") return createCrystal(asset);
  if (asset.id === "expanding-node-tower") return createTower(asset);
  return createGlyphCube(asset);
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry && typeof child.geometry.dispose === "function") child.geometry.dispose();
    if (child.material) {
      const list = Array.isArray(child.material) ? child.material : [child.material];
      list.forEach((material) => {
        if (!Object.values(materials).includes(material) && typeof material.dispose === "function") {
          material.dispose();
        }
      });
    }
  });
}

function setModel(asset) {
  while (modelRoot.children.length) {
    const child = modelRoot.children.pop();
    disposeObject(child);
  }
  const model = createModel(asset);
  modelRoot.add(model);
  modelRoot.userData.model = model;
  modelRoot.rotation.set(pitch, yaw, 0);
  activeAt = -Infinity;
}

function getFamilyLabel(asset) {
  const labels = {
    worker: "3D WORKER",
    machine: "FACTORY MACHINE",
    artifact: "WORLD ARTIFACT",
    instrument: "DISCOVERY INSTRUMENT",
    world: "WORLD STRUCTURE"
  };
  return labels[asset.family] || asset.family.toUpperCase();
}

function getOrbSymbol(asset) {
  if (asset.family === "worker") return "●";
  if (asset.family === "machine") return "⌁";
  if (asset.family === "artifact") return "◇";
  if (asset.family === "instrument") return "⌕";
  return "⌂";
}

function renderAssetList() {
  assetList.replaceChildren();
  assets
    .filter((asset) => currentFilter === "all" || asset.family === currentFilter)
    .forEach((asset) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "asset-card" + (selectedAsset && selectedAsset.id === asset.id ? " is-active" : "");
      button.style.setProperty("--asset-accent", asset.accent);
      button.setAttribute("aria-pressed", selectedAsset && selectedAsset.id === asset.id ? "true" : "false");
      button.innerHTML =
        '<span class="asset-orb" aria-hidden="true">' + getOrbSymbol(asset) + '</span>' +
        '<span><b>' + asset.name + '</b><small>' + asset.cn + ' · ' + asset.firstAha + '</small></span>' +
        '<span class="asset-act">ACT ' + asset.act + '</span>';
      button.addEventListener("click", () => selectAsset(asset.id));
      assetList.append(button);
    });
}

function selectAsset(id) {
  const asset = assetById.get(id);
  if (!asset) return;
  selectedAsset = asset;
  renderAssetList();
  stageTitle.textContent = asset.name + " · " + asset.cn;
  stageFamily.textContent = getFamilyLabel(asset);
  stageAha.innerHTML = "";
  const small = document.createElement("small");
  small.textContent = asset.firstAha + " · FIRST APPEARS";
  const strong = document.createElement("strong");
  strong.textContent = asset.firstAhaTitle;
  stageAha.append(small, strong);
  stageImpact.querySelector("strong").textContent = asset.worldEffect;
  assetAppears.textContent = asset.appears;
  assetPurpose.textContent = asset.purpose;
  assetAction.textContent = asset.action;
  document.documentElement.style.setProperty("--stage-accent", asset.accent);
  setModel(asset);
}

function triggerAsset() {
  if (!selectedAsset) return;
  activeAt = performance.now();
  stageImpact.classList.remove("is-live");
  requestAnimationFrame(() => stageImpact.classList.add("is-live"));
  window.setTimeout(() => stageImpact.classList.remove("is-live"), 1500);
}

function renderFlowStrip() {
  flowStrip.replaceChildren();
  flows.forEach((flow) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "flow-card" + (selectedFlow && selectedFlow.id === flow.id ? " is-active" : "");
    button.innerHTML =
      "<small>" + flow.id + " · ACT " + flow.act + " · " + flow.ahaRange + "</small>" +
      "<b>" + flow.title + "</b>" +
      "<span>" + flow.subtitle + "</span>";
    button.addEventListener("click", () => selectFlow(flow.id));
    flowStrip.append(button);
  });
}

function selectFlow(id) {
  const flow = flows.find((item) => item.id === id);
  if (!flow) return;
  selectedFlow = flow;
  renderFlowStrip();

  flowScreenId.textContent = flow.id + " · ACT " + flow.act;
  flowScreenRange.textContent = flow.ahaRange;
  flowTitle.textContent = flow.title;
  flowSubtitle.textContent = flow.subtitle;
  flowGoal.textContent = flow.userGoal;
  flowInteraction.textContent = flow.interaction;
  flowShift.textContent = flow.shift;
  flowWorld.dataset.act = String(flow.act);

  flowAssets.replaceChildren();
  flow.assets.forEach((assetId) => {
    const asset = assetById.get(assetId);
    if (!asset) return;
    const item = document.createElement("div");
    item.className = "flow-asset";
    item.style.setProperty("--asset-accent", asset.accent);
    item.innerHTML = '<i aria-hidden="true"></i><b>' + asset.name + '</b><span>' + asset.firstAha + "</span>";
    item.addEventListener("click", () => selectAsset(asset.id));
    flowAssets.append(item);
  });

  const representative = flow.assets.map((assetId) => assetById.get(assetId)).find(Boolean);
  if (representative) selectAsset(representative.id);
}

document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    currentFilter = chip.dataset.filter || "all";
    document.querySelectorAll(".filter-chip").forEach((item) => {
      const active = item === chip;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", active ? "true" : "false");
    });
    renderAssetList();
  });
});

canvas.tabIndex = 0;
canvas.addEventListener("pointerdown", (event) => {
  dragStart = { x: event.clientX, y: event.clientY, yaw, pitch };
  dragMoved = false;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!dragStart) return;
  const dx = event.clientX - dragStart.x;
  const dy = event.clientY - dragStart.y;
  if (Math.abs(dx) + Math.abs(dy) > 5) dragMoved = true;
  yaw = dragStart.yaw + dx * 0.009;
  pitch = THREE.MathUtils.clamp(dragStart.pitch + dy * 0.006, -0.35, 0.42);
});

canvas.addEventListener("pointerup", (event) => {
  if (dragStart && !dragMoved) triggerAsset();
  dragStart = null;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener("pointercancel", () => {
  dragStart = null;
});

canvas.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    triggerAsset();
  }
  if (event.key === "ArrowLeft") yaw -= 0.15;
  if (event.key === "ArrowRight") yaw += 0.15;
  if (event.key === "ArrowUp") pitch = Math.max(-0.35, pitch - 0.08);
  if (event.key === "ArrowDown") pitch = Math.min(0.42, pitch + 0.08);
});

function resizeRenderer() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const targetWidth = Math.floor(width * pixelRatio);
  const targetHeight = Math.floor(height * pixelRatio);
  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

new ResizeObserver(resizeRenderer).observe(canvas);

function animate(now) {
  const t = now / 1000;
  resizeRenderer();

  modelRoot.rotation.y += (yaw - modelRoot.rotation.y) * 0.12;
  modelRoot.rotation.x += (pitch - modelRoot.rotation.x) * 0.12;

  const age = (now - activeAt) / 1000;
  const pulse = age >= 0 && age <= 1.35 ? 1 - age / 1.35 : 0;
  const model = modelRoot.userData.model;
  if (model && typeof model.userData.motion === "function") {
    model.userData.motion(t, pulse);
  }

  const worldGroup = worldRoot.children[0];
  if (worldGroup && worldGroup.userData.nodes) {
    worldGroup.userData.nodes.forEach((node, index) => {
      const visible = selectedAsset ? index < Math.max(1, selectedAsset.act) : index < 1;
      const targetScale = visible ? node.userData.baseScale : 0.42;
      const bonus = pulse > 0 && index === Math.min(5, Math.max(0, (selectedAsset ? selectedAsset.act : 1) - 1)) ? pulse * 0.35 : 0;
      const scale = targetScale + bonus;
      node.scale.setScalar(scale);
      node.visible = true;
      node.traverse((child) => {
        if (child.material && "opacity" in child.material) child.material.opacity = visible ? 1 : 0.18;
      });
    });
    worldGroup.rotation.y = Math.sin(t * 0.14) * 0.08;
  }

  violetLight.intensity = 2.9 + Math.sin(t * 1.4) * 0.28 + pulse * 2.2;
  renderer.render(scene, camera);
}

renderAssetList();
renderFlowStrip();
if (selectedAsset) selectAsset(selectedAsset.id);
if (selectedFlow) selectFlow(selectedFlow.id);
renderer.setAnimationLoop(animate);
