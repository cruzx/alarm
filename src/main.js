import * as THREE from "three";
import "./styles.css";
import { createMotionEditor } from "./motion-editor.js";

const config = {
  width: 1080,
  height: 1080,
  duration: 4,
  fps: 30,
  captureMode: new URLSearchParams(window.location.search).has("capture"),
};

function createCoinLayers() {
  return [
    {
      id: "coin",
      name: "3D Coin",
      color: "#f9c74f",
      expanded: true,
      properties: {
        rotationY: {
          label: "Y Rotation",
          unit: "deg",
          min: 0,
          max: 720,
          value: 0,
          keyframes: [
            { time: 0, value: 0 },
            { time: config.duration, value: 360 },
          ],
        },
        tilt: {
          label: "Tilt",
          unit: "deg",
          min: -35,
          max: 35,
          value: -10,
          keyframes: [
            { time: 0, value: -10 },
            { time: config.duration / 2, value: -4 },
            { time: config.duration, value: -10 },
          ],
        },
        scale: {
          label: "Scale",
          unit: "%",
          min: 70,
          max: 130,
          value: 100,
          keyframes: [
            { time: 0, value: 100 },
            { time: config.duration / 2, value: 103 },
            { time: config.duration, value: 100 },
          ],
        },
        bounce: {
          label: "Float",
          unit: "px",
          min: -120,
          max: 120,
          value: 0,
          keyframes: [
            { time: 0, value: 0 },
            { time: config.duration * 0.25, value: 42 },
            { time: config.duration * 0.5, value: 0 },
            { time: config.duration * 0.75, value: -26 },
            { time: config.duration, value: 0 },
          ],
        },
      },
    },
    {
      id: "lighting",
      name: "Lighting",
      color: "#fff1a8",
      expanded: true,
      properties: {
        sweep: {
          label: "Sweep",
          unit: "%",
          min: 0,
          max: 100,
          value: 72,
          keyframes: [
            { time: 0, value: 38 },
            { time: config.duration / 2, value: 100 },
            { time: config.duration, value: 38 },
          ],
        },
        glint: {
          label: "Glint",
          unit: "%",
          min: 0,
          max: 100,
          value: 50,
          keyframes: [
            { time: 0, value: 20 },
            { time: config.duration * 0.24, value: 96 },
            { time: config.duration * 0.5, value: 18 },
            { time: config.duration * 0.75, value: 92 },
            { time: config.duration, value: 20 },
          ],
        },
      },
    },
  ];
}

const project = {
  name: "Untitled Motion",
  duration: config.duration,
  fps: config.fps,
  canvas: {
    width: config.width,
    height: config.height,
    x: 0,
    y: 0,
    sourceWidth: config.width,
    sourceHeight: config.height,
  },
  layers: [],
};

if (window.__MOTION_FORGE_PROJECT__?.layers) {
  project.name = window.__MOTION_FORGE_PROJECT__.name || project.name;
  project.layers.splice(0, project.layers.length, ...window.__MOTION_FORGE_PROJECT__.layers);
}

let activeScene = project.layers.some((layer) => layer.id === "coin") ? "coin" : "empty";

const canvas = document.querySelector("#stage");
let captureFigmaStage = null;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(config.captureMode ? 1 : Math.min(window.devicePixelRatio, 2));
renderer.setSize(config.width, config.height, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14202c);

const camera = new THREE.PerspectiveCamera(34, config.width / config.height, 0.1, 100);
camera.position.set(0, 0.28, 8.4);

const coin = new THREE.Group();
scene.add(coin);
coin.visible = activeScene === "coin";
const coinFitScale = 0.78;

const gold = new THREE.MeshPhysicalMaterial({
  color: 0xffc845,
  emissive: 0x241300,
  emissiveIntensity: 0.18,
  roughness: 0.2,
  metalness: 0.72,
  clearcoat: 0.55,
  clearcoatRoughness: 0.22,
});

const darkGold = new THREE.MeshPhysicalMaterial({
  color: 0xd89017,
  emissive: 0x1e1000,
  emissiveIntensity: 0.1,
  roughness: 0.28,
  metalness: 0.65,
  clearcoat: 0.35,
  clearcoatRoughness: 0.3,
});

const hotGold = new THREE.MeshPhysicalMaterial({
  color: 0xffef94,
  emissive: 0x3a2500,
  emissiveIntensity: 0.22,
  roughness: 0.14,
  metalness: 0.7,
  clearcoat: 0.8,
  clearcoatRoughness: 0.12,
});

const coinBody = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 0.36, 144, 1, false), gold);
coinBody.rotation.x = Math.PI / 2;
coinBody.castShadow = true;
coinBody.receiveShadow = true;
coin.add(coinBody);

const frontRing = new THREE.Mesh(new THREE.TorusGeometry(1.23, 0.055, 20, 144), hotGold);
frontRing.position.z = 0.205;
frontRing.castShadow = true;
coin.add(frontRing);

const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.035, 16, 96), darkGold);
innerRing.position.z = 0.215;
coin.add(innerRing);

const backRing = frontRing.clone();
backRing.position.z = -0.205;
backRing.rotation.y = Math.PI;
coin.add(backRing);

const crest = new THREE.Group();
const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.065, 18, 96, Math.PI * 1.58), hotGold);
crescent.rotation.z = -Math.PI * 0.78;
crescent.position.z = 0.245;
crest.add(crescent);

for (let i = -1; i <= 1; i += 1) {
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.82 - Math.abs(i) * 0.18, 0.075), hotGold);
  bar.position.set(i * 0.25, 0, 0.24);
  bar.rotation.z = i * 0.22;
  bar.castShadow = true;
  crest.add(bar);
}
coin.add(crest);

const backCrest = crest.clone();
backCrest.position.z = -0.49;
backCrest.rotation.y = Math.PI;
coin.add(backCrest);

const ridges = [];
const ridgeGeometry = new THREE.BoxGeometry(0.038, 0.17, 0.42);
for (let i = 0; i < 96; i += 1) {
  const angle = (i / 96) * Math.PI * 2;
  const ridge = new THREE.Mesh(ridgeGeometry, i % 2 === 0 ? hotGold : darkGold);
  ridge.position.set(Math.cos(angle) * 1.64, Math.sin(angle) * 1.64, 0);
  ridge.rotation.z = angle;
  ridge.castShadow = true;
  ridges.push(ridge);
  coin.add(ridge);
}

const sparkMaterial = new THREE.MeshBasicMaterial({
  color: 0xfff7cb,
  transparent: true,
  opacity: 0.85,
});
const sparkle = new THREE.Group();
for (let i = 0; i < 5; i += 1) {
  const ray = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.52, 0.035), sparkMaterial);
  ray.rotation.z = (i / 5) * Math.PI * 2;
  sparkle.add(ray);
}
sparkle.position.set(1.2, 0.95, 0.42);
coin.add(sparkle);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(3.4, 96),
  new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.3 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2.1;
floor.receiveShadow = true;
scene.add(floor);

const rim = new THREE.DirectionalLight(0xfff0b0, 5.4);
rim.position.set(-3.2, 3.2, 4);
rim.castShadow = true;
rim.shadow.mapSize.set(2048, 2048);
scene.add(rim);

const fill = new THREE.DirectionalLight(0xffffff, 3.8);
fill.position.set(1.2, 1.4, 5.5);
scene.add(fill);

const sweep = new THREE.PointLight(0xffd86b, 28, 9);
sweep.position.set(2.5, 1.4, 3);
scene.add(sweep);

scene.add(new THREE.HemisphereLight(0xfff5d0, 0x243040, 2.7));

function easeInOutSine(x) {
  return -(Math.cos(Math.PI * x) - 1) / 2;
}

function getProperty(layerId, propertyId) {
  return project.layers.find((layer) => layer.id === layerId)?.properties[propertyId];
}

function interpolateKeyframes(keyframes, seconds) {
  if (!keyframes.length) return 0;
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  if (seconds <= sorted[0].time) return sorted[0].value;
  if (seconds >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

  const nextIndex = sorted.findIndex((keyframe) => keyframe.time >= seconds);
  const previous = sorted[nextIndex - 1];
  const next = sorted[nextIndex];
  const span = next.time - previous.time || 1;
  const progress = easeInOutSine((seconds - previous.time) / span);
  return previous.value + (next.value - previous.value) * progress;
}

function timelineValue(layerId, propertyId, seconds) {
  const property = getProperty(layerId, propertyId);
  return property ? interpolateKeyframes(property.keyframes, seconds) : 0;
}

function setKeyframe(layerId, propertyId, time, value) {
  const property = getProperty(layerId, propertyId);
  if (!property) return;
  const safeTime = Math.max(0, Math.min(project.duration, Number(time)));
  const existing = property.keyframes.find((keyframe) => Math.abs(keyframe.time - safeTime) < 0.02);
  if (existing) {
    existing.value = Number(value);
  } else {
    property.keyframes.push({ time: safeTime, value: Number(value) });
  }
  property.value = Number(value);
  property.keyframes.sort((a, b) => a.time - b.time);
  renderAt(currentTime);
}

function importFigmaLayers(layers) {
  project.layers = project.layers.filter((layer) => layer.kind !== "figma");
  const existingIds = new Set(project.layers.map((layer) => layer.id));
  layers.forEach((layer, index) => {
    let id = layer.id;
    while (existingIds.has(id)) {
      id = `${layer.id}-${index + existingIds.size}`;
    }
    existingIds.add(id);
    project.layers.push({ ...layer, id });
  });
  renderAt(currentTime);
  window.motionForge?.emitTime(currentTime);
  return layers.length;
}

function setMotionTarget(layerId, enabled) {
  const layer = project.layers.find((item) => item.id === layerId);
  if (!layer) return;
  layer.motionTarget = Boolean(enabled);
}

function setLayerVisible(layerId, visible) {
  const layer = project.layers.find((item) => item.id === layerId);
  if (!layer) return;
  layer.hidden = !visible;
  renderAt(currentTime);
  window.motionForge?.emitTime(currentTime);
}

function replaceGeneratedLayers(layers) {
  const figmaLayers = project.layers.filter((layer) => layer.kind === "figma");
  project.layers.splice(0, project.layers.length, ...layers, ...figmaLayers);
}

function createMotionFromPrompt(prompt) {
  const brief = prompt.trim();
  const lower = brief.toLowerCase();
  if (!brief) {
    activeScene = "empty";
    project.name = "Untitled Motion";
    replaceGeneratedLayers([]);
    renderAt(currentTime);
    window.motionForge?.emitTime(currentTime);
    return "Ready for a motion brief";
  }

  if (lower.includes("coin") || brief.includes("金币")) {
    activeScene = "coin";
    project.name = "3D Coin Motion";
    replaceGeneratedLayers(createCoinLayers());
    applyAiDraft(brief);
    window.motionForge?.emitTime(currentTime);
    return "Created 3D coin motion";
  }

  activeScene = "empty";
  project.name = "Motion Draft";
  replaceGeneratedLayers([]);
  renderAt(currentTime);
  window.motionForge?.emitTime(currentTime);
  return "Created a blank motion draft; import Figma layers or ask Codex to build this scene";
}

function applyAiDraft(prompt) {
  const lower = prompt.toLowerCase();
  if ((lower.includes("homepage") || lower.includes("figma") || prompt.includes("首页")) && project.layers.some((layer) => layer.kind === "figma")) {
    return applyHomepageMotion();
  }

  const coinRotation = getProperty("coin", "rotationY");
  const glint = getProperty("lighting", "glint");
  const sweepAmount = getProperty("lighting", "sweep");
  const bounce = getProperty("coin", "bounce");

  if (!coinRotation || !glint || !sweepAmount || !bounce) {
    return createMotionFromPrompt(prompt);
  }

  if (lower.includes("slow") || lower.includes("premium") || lower.includes("luxury")) {
    coinRotation.keyframes = [
      { time: 0, value: 0 },
      { time: project.duration, value: 270 },
    ];
    glint.keyframes = [
      { time: 0, value: 18 },
      { time: 1.15, value: 100 },
      { time: project.duration, value: 18 },
    ];
  } else if (lower.includes("fast") || lower.includes("game") || lower.includes("reward")) {
    coinRotation.keyframes = [
      { time: 0, value: 0 },
      { time: project.duration, value: 720 },
    ];
    bounce.keyframes = [
      { time: 0, value: 0 },
      { time: 0.45, value: 62 },
      { time: 0.9, value: -22 },
      { time: 1.35, value: 38 },
      { time: 1.8, value: 0 },
      { time: project.duration, value: 0 },
    ];
  } else {
    coinRotation.keyframes = [
      { time: 0, value: 0 },
      { time: project.duration / 2, value: 180 },
      { time: project.duration, value: 360 },
    ];
  }

  if (lower.includes("shine") || lower.includes("glow") || lower.includes("highlight")) {
    sweepAmount.keyframes = [
      { time: 0, value: 30 },
      { time: project.duration * 0.42, value: 100 },
      { time: project.duration, value: 30 },
    ];
    glint.keyframes = [
      { time: 0, value: 20 },
      { time: project.duration * 0.35, value: 100 },
      { time: project.duration * 0.72, value: 88 },
      { time: project.duration, value: 20 },
    ];
  }

  renderAt(currentTime);
  return "Draft applied";
}

function applyHomepageMotion() {
  const figmaLayers = project.layers.filter((layer) => layer.kind === "figma" && layer.motionTarget);
  if (!figmaLayers.length) return "Select layer targets first";

  activeScene = "empty";
  project.name = "PC Homepage Motion";

  const ordered = [...figmaLayers].sort((a, b) => (
    (a.figma.y - b.figma.y) || (a.figma.x - b.figma.x)
  ));

  ordered.forEach((layer, index) => {
    const positionX = getProperty(layer.id, "positionX");
    const positionY = getProperty(layer.id, "positionY");
    const scale = getProperty(layer.id, "scale");
    const rotation = getProperty(layer.id, "rotation");
    const opacity = getProperty(layer.id, "opacity");
    if (!positionX || !positionY || !scale || !rotation || !opacity) return;

    const baseX = layer.figma.x;
    const baseY = layer.figma.y;
    const isHeader = baseY < config.height * 0.18;
    const isHero = layer.figma.width > config.width * 0.46 || layer.figma.height > config.height * 0.26;
    const isSmallDetail = layer.figma.width < config.width * 0.16 && layer.figma.height < config.height * 0.12;
    const delay = Math.min(1.16, index * 0.075 + (isHeader ? 0 : 0.12));
    const enterTime = Math.min(project.duration - 0.65, delay + (isHero ? 0.82 : 0.58));
    const settleTime = Math.min(project.duration - 0.35, enterTime + 0.24);
    const yLift = isHeader ? -24 : (isHero ? 52 : 38);
    const xDrift = isHeader ? -18 : (index % 2 === 0 ? -22 : 22);
    const startScale = isHeader ? 98 : (isHero ? 94 : 92);
    const startRotation = isHeader ? 0 : (isSmallDetail ? (index % 2 === 0 ? -2 : 2) : (index % 2 === 0 ? -1.1 : 1.1));

    positionX.value = baseX;
    positionX.keyframes = [
      { time: 0, value: baseX + xDrift },
      { time: delay, value: baseX + xDrift },
      { time: enterTime, value: baseX },
      { time: project.duration, value: baseX },
    ];

    positionY.value = baseY;
    positionY.keyframes = [
      { time: 0, value: baseY + yLift },
      { time: delay, value: baseY + yLift },
      { time: enterTime, value: baseY },
      { time: project.duration, value: baseY },
    ];

    scale.value = 100;
    scale.keyframes = [
      { time: 0, value: startScale },
      { time: delay, value: startScale },
      { time: enterTime, value: isHero ? 101.5 : 101 },
      { time: settleTime, value: 100 },
      { time: project.duration, value: 100 },
    ];

    rotation.value = 0;
    rotation.keyframes = [
      { time: 0, value: startRotation },
      { time: delay, value: startRotation },
      { time: enterTime, value: 0 },
      { time: project.duration, value: 0 },
    ];

    opacity.value = 100;
    opacity.keyframes = [
      { time: 0, value: 0 },
      { time: delay, value: 0 },
      { time: enterTime, value: 100 },
      { time: project.duration, value: 100 },
    ];
  });

  renderAt(currentTime);
  window.motionForge?.emitTime(currentTime);
  return `Applied homepage motion to ${figmaLayers.length} layers`;
}

function renderAt(seconds) {
  currentTime = ((seconds % config.duration) + config.duration) % config.duration;
  const hasCoinScene = activeScene === "coin" && !!getProperty("coin", "rotationY");
  coin.visible = hasCoinScene;
  floor.visible = hasCoinScene;
  sweep.visible = hasCoinScene;

  if (!hasCoinScene) {
    renderer.render(scene, camera);
    renderCaptureFigmaLayers(currentTime);
    return;
  }

  const p = currentTime / config.duration;
  const turn = THREE.MathUtils.degToRad(timelineValue("coin", "rotationY", currentTime));
  const tilt = THREE.MathUtils.degToRad(timelineValue("coin", "tilt", currentTime));
  const scale = timelineValue("coin", "scale", currentTime) / 100;
  const bounce = timelineValue("coin", "bounce", currentTime) / 420;
  const glint = timelineValue("lighting", "glint", currentTime) / 100;
  const sweepAmount = timelineValue("lighting", "sweep", currentTime) / 100;

  coin.rotation.y = turn;
  coin.rotation.x = tilt + Math.sin(p * Math.PI * 2) * 0.04;
  coin.position.y = bounce;
  coin.scale.setScalar(scale * coinFitScale);

  crest.scale.setScalar(1 + glint * 0.05);
  sparkle.rotation.z = -turn * 1.8;
  sparkle.scale.setScalar(0.38 + glint * 0.74);
  sparkMaterial.opacity = 0.16 + glint * 0.78;

  ridges.forEach((ridge, index) => {
    ridge.scale.z = 0.86 + Math.sin(turn + index * 0.18) * 0.12;
  });

  sweep.position.x = Math.cos(turn) * 3.4;
  sweep.position.z = 2.2 + Math.sin(turn) * 1.4;
  sweep.intensity = 8 + sweepAmount * 28;

  camera.position.x = Math.sin(turn * 0.5) * 0.18;
  camera.position.y = 0.24 + Math.cos(turn) * 0.05;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  renderCaptureFigmaLayers(currentTime);
}

let start = performance.now();
let manualTime = 0;
let currentTime = 0;
let previewZoom = "fit";
let previewQuality = "HQ";

function animate(now) {
  if (manualTime === null) {
    renderAt((now - start) / 1000);
    window.motionForge?.emitTime(currentTime);
    requestAnimationFrame(animate);
  }
}

function resizePreview() {
  const workspace = document.querySelector(".composition");
  const maxWidth = workspace?.clientWidth || window.innerWidth;
  const maxHeight = workspace?.clientHeight || window.innerHeight;
  const fitScale = Math.min(maxWidth / config.width, maxHeight / config.height);
  const scale = previewZoom === "fit" ? fitScale : Math.max(0.2, Math.min(5, Number(previewZoom) || 1));
  canvas.style.width = `${Math.floor(config.width * scale)}px`;
  canvas.style.height = `${Math.floor(config.height * scale)}px`;
  window.dispatchEvent(new CustomEvent("motionforge:resize-preview"));
}

function setCanvasSize(width, height) {
  const nextWidth = Math.round(Number(width));
  const nextHeight = Math.round(Number(height));
  if (!Number.isFinite(nextWidth) || !Number.isFinite(nextHeight) || nextWidth < 120 || nextHeight < 120) {
    return null;
  }
  config.width = Math.min(4096, nextWidth);
  config.height = Math.min(4096, nextHeight);
  project.canvas = {
    ...(project.canvas || {}),
    width: project.canvas?.width || config.width,
    height: project.canvas?.height || config.height,
    sourceWidth: project.canvas?.sourceWidth || config.width,
    sourceHeight: project.canvas?.sourceHeight || config.height,
  };
  canvas.width = config.width;
  canvas.height = config.height;
  renderer.setSize(config.width, config.height, false);
  camera.aspect = config.width / config.height;
  camera.updateProjectionMatrix();
  resizePreview();
  renderAt(currentTime);
  window.motionForge.width = config.width;
  window.motionForge.height = config.height;
  window.motionForge.emitTime(currentTime);
  return { width: config.width, height: config.height };
}

function renderCaptureFigmaLayers(seconds) {
  if (!captureFigmaStage) return;
  const figmaLayers = project.layers.filter((layer) => layer.kind === "figma" && !layer.hidden);
  captureFigmaStage.innerHTML = figmaLayers.map((layer) => {
    const x = timelineValue(layer.id, "positionX", seconds);
    const y = timelineValue(layer.id, "positionY", seconds);
    const scale = timelineValue(layer.id, "scale", seconds) / 100;
    const rotation = timelineValue(layer.id, "rotation", seconds);
    const opacity = timelineValue(layer.id, "opacity", seconds) / 100;
    const hasImage = Boolean(layer.figma.imageUrl);
    const style = [
      `left:${x}px`,
      `top:${y}px`,
      `width:${layer.figma.width}px`,
      `height:${layer.figma.height}px`,
      `background:${hasImage ? "transparent" : layer.figma.fill}`,
      `border-radius:${layer.figma.radius}px`,
      `opacity:${opacity}`,
      `transform:translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
      `color:${layer.figma.textColor}`,
    ].join(";");
    const content = layer.figma.type === "TEXT" ? escapeHtml(layer.figma.characters || layer.name) : "";
    const image = hasImage ? `<img src="${escapeHtml(layer.figma.imageUrl)}" alt="" />` : content;
    return `<div class="figma-layer ${layer.figma.type.toLowerCase()} ${hasImage ? "has-image" : ""}" style="${style}">${image}</div>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

window.motionForge = {
  project,
  duration: config.duration,
  fps: config.fps,
  width: config.width,
  height: config.height,
  currentTime: 0,
  seek(seconds) {
    manualTime = seconds;
    this.currentTime = ((seconds % config.duration) + config.duration) % config.duration;
    renderAt(this.currentTime);
    this.emitTime(this.currentTime);
  },
  play() {
    manualTime = null;
    start = performance.now() - currentTime * 1000;
    requestAnimationFrame(animate);
  },
  pause() {
    manualTime = currentTime;
  },
  setKeyframe,
  importFigmaLayers,
  setMotionTarget,
  setLayerVisible,
  setPreviewZoom(value) {
    previewZoom = value === "fit" ? "fit" : Math.max(0.2, Math.min(5, Number(value) || 1));
    resizePreview();
    return previewZoom;
  },
  setPreviewQuality(value) {
    previewQuality = value === "Draft" ? "Draft" : "HQ";
    renderer.setPixelRatio(config.captureMode ? 1 : (previewQuality === "HQ" ? Math.min(window.devicePixelRatio, 2) : 1));
    renderAt(currentTime);
    return previewQuality;
  },
  setCanvasSize,
  valueAt: timelineValue,
  createMotionFromPrompt,
  applyAiDraft,
  applyHomepageMotion,
  restoreProjectSnapshot(snapshot) {
    if (!snapshot?.project) return false;
    const restoredProject = JSON.parse(JSON.stringify(snapshot.project));
    project.name = restoredProject.name || project.name;
    project.duration = restoredProject.duration || project.duration;
    project.fps = restoredProject.fps || project.fps;
    project.canvas = restoredProject.canvas || project.canvas;
    project.layers.splice(0, project.layers.length, ...(restoredProject.layers || []));
    activeScene = project.layers.some((layer) => layer.id === "coin") ? "coin" : "empty";
    renderAt(currentTime);
    this.emitTime(currentTime);
    return true;
  },
  emitTime(seconds) {
    this.currentTime = seconds;
    window.dispatchEvent(new CustomEvent("motionforge:time", { detail: { seconds } }));
  },
  exportProject() {
    return JSON.stringify(project, null, 2);
  },
};

canvas.width = config.width;
canvas.height = config.height;

if (config.captureMode) {
  document.body.classList.add("capture-mode");
  const captureFrame = document.createElement("div");
  captureFrame.id = "capture-frame";
  captureFrame.className = "capture-frame";
  captureFrame.style.width = `${config.width}px`;
  captureFrame.style.height = `${config.height}px`;
  captureFigmaStage = document.createElement("div");
  captureFigmaStage.className = "figma-stage capture-figma-stage";
  document.body.innerHTML = "";
  document.body.appendChild(captureFrame);
  captureFrame.appendChild(canvas);
  captureFrame.appendChild(captureFigmaStage);
  canvas.style.width = `${config.width}px`;
  canvas.style.height = `${config.height}px`;
  renderAt(0.2);
} else {
  createMotionEditor({ motionForge: window.motionForge, canvas });
  resizePreview();
  window.addEventListener("resize", resizePreview);
  renderAt(0);
  window.motionForge.emitTime(0);
}
