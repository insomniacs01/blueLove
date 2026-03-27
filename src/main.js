import './style.css';

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

import { createDreamPass } from './post/createDreamPass.js';
import { createBackdrop } from './scene/createBackdrop.js';
import { createEnergyBase } from './scene/createEnergyBase.js';
import { createFractureVeil } from './scene/createFractureVeil.js';
import { createFlowRibbons } from './scene/createFlowRibbons.js';
import { createHeartParticles } from './scene/createHeartParticles.js';
import { createHeartStarfield } from './scene/createHeartStarfield.js';
import { createNameFireworks } from './scene/createNameFireworks.js';
import { createSkyStreaks } from './scene/createSkyStreaks.js';
import { createStarBackdrop } from './scene/createStarBackdrop.js';
import { createStoryHalo } from './scene/createStoryHalo.js';
import { createSolidHeart } from './scene/createSolidHeart.js';
import { computeSceneState } from './scene/sceneState.js';
import { DEFAULT_STORY_NAME, resolveStoryName } from './storyConfig.js';

const app = document.querySelector('#app');

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050810, 0.078);

const camera = new THREE.PerspectiveCamera(
  36,
  window.innerWidth / window.innerHeight,
  0.1,
  40
);
camera.position.set(0, 0.18, 7.8);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.92,
  0.76,
  0.22
);
composer.addPass(bloomPass);
const afterimagePass = new AfterimagePass(0.9);
composer.addPass(afterimagePass);
const dreamPass = createDreamPass();
composer.addPass(dreamPass.pass);

const root = new THREE.Group();
scene.add(root);
const spectacleGroup = new THREE.Group();
root.add(spectacleGroup);

const searchParams = new URLSearchParams(window.location.search);
const prototypeMode = searchParams.get('mode');
const debugView = searchParams.get('debug');
const timelineParam = Number.parseFloat(searchParams.get('t') ?? '');
const freezeTimeline =
  searchParams.get('freeze') === '1' || searchParams.get('freeze') === 'true';
// Edit DEFAULT_STORY_NAME in src/storyConfig.js, or override with ?name=...
const storyName = resolveStoryName(searchParams.get('name') ?? DEFAULT_STORY_NAME);
const isSolidHeartMode = prototypeMode === 'solid-heart';
const isPrototypeMode = isSolidHeartMode;
const isShapeDebugMode = isPrototypeMode && debugView === 'shape';
const showAtmosphere = !isShapeDebugMode;
const showFullScene = !isPrototypeMode;
if (isPrototypeMode) {
  scene.fog = null;
  scene.background = new THREE.Color(isShapeDebugMode ? 0x090b10 : 0x0f1220);
  renderer.toneMappingExposure = isShapeDebugMode ? 0.96 : 1.04;
}
const backdrop = showAtmosphere ? createBackdrop() : null;
const skyStreaks = showAtmosphere ? createSkyStreaks() : null;
const starBackdrop = showAtmosphere ? createStarBackdrop() : null;
const heartField = showFullScene ? createHeartParticles() : null;
const heartStarfield = showFullScene ? createHeartStarfield() : null;
const energyBase = showFullScene ? createEnergyBase() : null;
const flowRibbons = showFullScene ? createFlowRibbons() : null;
const fractureVeil = showFullScene ? createFractureVeil() : null;
const storyHalo = showFullScene ? createStoryHalo() : null;
const nameFireworks = showFullScene ? createNameFireworks({ name: storyName }) : null;
const solidHeart = isSolidHeartMode ? createSolidHeart() : null;

if (skyStreaks) {
  scene.add(skyStreaks.group);
}

if (starBackdrop) {
  scene.add(starBackdrop.group);
}

if (nameFireworks) {
  scene.add(nameFireworks.group);
}

if (backdrop) {
  root.add(backdrop.group);
}

if (isPrototypeMode) {
  if (solidHeart) {
    root.add(solidHeart.group);
  }
} else {
  spectacleGroup.add(storyHalo.group);
  spectacleGroup.add(heartField.group);
  spectacleGroup.add(heartStarfield.group);
  spectacleGroup.add(energyBase.group);
  spectacleGroup.add(flowRibbons.group);
  spectacleGroup.add(fractureVeil.group);
}

const ambientLight = new THREE.AmbientLight(0x8fa4ff, 0.3);
scene.add(ambientLight);

const fillLight = new THREE.PointLight(0x8ceaff, 4, 12, 2);
fillLight.position.set(0, 0.8, 4.5);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0xffc7d9, isPrototypeMode ? 14 : 0, 14, 2);
rimLight.position.set(-2.8, 1.8, 3.5);
scene.add(rimLight);

const backLight = new THREE.PointLight(0xff7ca8, isPrototypeMode ? 10 : 0, 18, 2);
backLight.position.set(2.2, 0.3, -4.6);
scene.add(backLight);

const storyLight = new THREE.PointLight(0x74d8ff, 0, 16, 2);
storyLight.position.set(0, -0.9, 2.8);
scene.add(storyLight);

const vowLight = new THREE.PointLight(0xff9ab9, 0, 18, 2);
vowLight.position.set(-1.4, 1.2, 1.8);
scene.add(vowLight);

const fillCold = new THREE.Color(0x8ceaff);
const fillWarm = new THREE.Color(0xffb7d5);
const rimCool = new THREE.Color(0x88b6ff);
const rimWarm = new THREE.Color(0xffa3c5);
const backCool = new THREE.Color(0x7f8fff);
const backWarm = new THREE.Color(0xff7ca8);

function onResize() {
  const { innerWidth, innerHeight } = window;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  if (heartField) {
    heartField.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  if (skyStreaks) {
    skyStreaks.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  if (starBackdrop) {
    starBackdrop.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  if (heartStarfield) {
    heartStarfield.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  if (nameFireworks) {
    nameFireworks.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  if (energyBase) {
    energyBase.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  if (fractureVeil) {
    fractureVeil.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  dreamPass.setSize(innerWidth, innerHeight);
}

window.addEventListener('resize', onResize);

const startTime = performance.now();
const timelineOffset = Number.isFinite(timelineParam) ? timelineParam : 0;

function animate(now) {
  const elapsed = freezeTimeline
    ? timelineOffset
    : timelineOffset + (now - startTime) / 1000;
  const state = computeSceneState(elapsed);

  if (isPrototypeMode) {
    root.rotation.y = 0;
    root.rotation.x = 0;
    root.position.y = 0;
    if (isShapeDebugMode) {
      camera.position.set(0, 0.18, 7.3);
      camera.lookAt(0, 0.12, 0);
    } else {
      camera.position.x = Math.sin(elapsed * 0.18) * 0.14;
      camera.position.y = 0.28 + Math.cos(elapsed * 0.16) * 0.06;
      camera.position.z = 7.08;
      camera.lookAt(0, 0.16, 0);
    }

    ambientLight.intensity = isShapeDebugMode ? 0.0 : 1.05;
    fillLight.position.x = isShapeDebugMode ? 0.0 : 2.6 + Math.sin(elapsed * 0.7) * 0.4;
    fillLight.position.y = isShapeDebugMode ? 0.0 : 1.4;
    fillLight.position.z = isShapeDebugMode ? 0.0 : 5.4;
    fillLight.intensity = isShapeDebugMode ? 0.0 : 10.5;

    rimLight.intensity = isShapeDebugMode ? 0.0 : 8.6 + Math.sin(elapsed * 1.1) * 0.8;
    backLight.intensity = isShapeDebugMode ? 0.0 : 6.8 + Math.cos(elapsed * 0.8) * 0.7;
    storyLight.intensity = 0;
    vowLight.intensity = 0;
    bloomPass.enabled = !isShapeDebugMode;
    afterimagePass.enabled = !isShapeDebugMode;
    dreamPass.pass.enabled = !isShapeDebugMode;
    afterimagePass.uniforms.damp.value = 1.0;
    if (solidHeart) {
      solidHeart.update(state);
    }
  } else {
    const loopDrift = THREE.MathUtils.clamp(
      (1 - state.rebirth) * (1 - state.yearning * 0.72) * (1 - state.repair * 0.82),
      0,
      1
    );
    const skyFocus = state.skyFocus;
    const spectacleHidden = state.spectacleFade > 0.96;

    scene.fog.density =
      0.062 +
      state.veil * 0.014 +
      state.yearning * 0.006 -
      state.afterglow * 0.012 -
      state.fireworksPresence * 0.018 -
      state.glyphHold * 0.012;
    renderer.toneMappingExposure =
      0.96 +
      state.invocation * 0.04 +
      state.yearning * 0.06 +
      state.fracture * 0.1 +
      state.afterglow * 0.015 +
      state.fireworksBurst * 0.03 -
      state.glyphReveal * 0.02 -
      state.glyphHold * 0.07 -
      loopDrift * 0.04;
    bloomPass.strength =
      0.98 +
      state.yearning * 0.22 +
      state.fracture * 0.18 +
      state.reunion * 0.015 +
      state.fireworksBurst * 0.02 -
      state.glyphReveal * 0.16 -
      state.glyphHold * 0.22 +
      state.afterglow * 0.018 -
      loopDrift * 0.065;
    bloomPass.radius = 0.78 + state.veil * 0.06 + state.fireworksPresence * 0.014 - state.afterglow * 0.01 - state.glyphHold * 0.12;
    bloomPass.threshold = 0.18 + state.veil * 0.02 - state.afterglow * 0.004 + state.glyphReveal * 0.08 + state.glyphHold * 0.12;

    ambientLight.intensity =
      0.28 +
      state.serenity * 0.12 +
      state.yearning * 0.16 +
      state.afterglow * 0.015 +
      state.fireworksPresence * 0.08 +
      -state.veil * 0.04;

    const stableOrbit =
      0.016 +
      state.invocation * 0.012 +
      state.yearning * 0.034 +
      state.afterglow * 0.024 -
      state.veil * 0.01;
    root.rotation.y =
      Math.sin(elapsed * 0.16 + state.yearning * 0.45) * stableOrbit +
      state.fracture * 0.22 +
      state.pursuit * 0.06 -
      state.repair * 0.05 -
      skyFocus * 0.08;
    root.rotation.x =
      Math.cos(elapsed * 0.1) * 0.008 -
      state.veil * 0.02 -
      state.fracture * 0.038 +
      state.afterglow * 0.014 -
      skyFocus * 0.03;
    root.position.y =
      state.invocation * 0.04 +
      state.yearning * 0.03 -
      state.fracture * 0.04 +
      state.reunion * 0.06 +
      state.afterglow * 0.04 -
      loopDrift * 0.08 -
      state.spectacleFade * 0.34;
    spectacleGroup.position.y = -state.spectacleFade * 0.38;
    spectacleGroup.position.z = -state.spectacleFade * 0.24;
    spectacleGroup.visible = !spectacleHidden;

    camera.position.x =
      (
        Math.sin(elapsed * 0.11 + state.yearning * 0.2) * (0.04 + state.yearning * 0.08) +
        state.fracture * 0.2 -
        state.reunion * 0.04
      ) *
      (1 - skyFocus * 0.88);
    camera.position.y =
      0.04 +
      state.invocation * 0.08 +
      state.yearning * 0.16 +
      Math.cos(elapsed * 0.15) * 0.03 +
      state.fracture * 0.12 +
      state.afterglow * 0.05 -
      loopDrift * 0.04 +
      skyFocus * 0.24 +
      state.glyphHold * 0.04;
    camera.position.z =
      7.28 -
      state.invocation * 0.18 -
      state.yearning * 0.3 -
      state.fracture * 0.2 -
      state.pursuit * 0.18 +
      state.afterglow * 0.08 +
      loopDrift * 0.16 +
      skyFocus * 0.22;
    camera.lookAt(
      Math.sin(elapsed * 0.08) * 0.01 - state.fracture * 0.03,
      0.1 +
        state.yearning * 0.08 +
        state.fracture * 0.16 +
        state.reunion * 0.12 +
        skyFocus * 0.24 +
        state.glyphHold * 0.03 -
        loopDrift * 0.05,
      0
    );

    fillLight.color.lerpColors(fillCold, fillWarm, state.afterglow * 0.72 + state.reunion * 0.18);
    fillLight.position.x =
      Math.sin(elapsed * 0.34) * (0.9 + state.yearning * 0.5) +
      state.fracture * 0.32 -
      state.reunion * 0.08;
    fillLight.position.y =
      0.78 +
      Math.sin(elapsed * 0.82) * 0.26 +
      state.yearning * 0.24 +
      state.shock * 0.22 +
      state.afterglow * 0.18;
    fillLight.position.z = 4.5 - state.yearning * 0.22 + state.fracture * 0.16;
    fillLight.intensity =
      3.4 +
      state.heartPresence * 1.1 +
      state.yearning * 1.3 +
      state.fracture * 2.0 +
      state.fireworksPresence * 0.42 +
      state.afterglow * 0.14 +
      state.reunion * 0.03 -
      loopDrift * 0.34;

    rimLight.color.lerpColors(rimCool, rimWarm, state.reunion * 0.4 + state.afterglow * 0.75);
    rimLight.position.x = -2.8 - state.veil * 0.3 + state.afterglow * 0.2;
    rimLight.position.y = 1.8 + state.yearning * 0.4 + state.afterglow * 0.3;
    rimLight.position.z = 3.5;
    rimLight.intensity = 0.3 + state.yearning * 0.92 + state.reunion * 0.06 + state.afterglow * 0.08;

    backLight.color.lerpColors(backCool, backWarm, state.fracture * 0.34 + state.afterglow * 0.82);
    backLight.position.x = 2.2 + state.fracture * 0.36 - state.reunion * 0.18;
    backLight.position.y = 0.3 + state.fracture * 0.2 + state.afterglow * 0.18;
    backLight.position.z = -4.6;
    backLight.intensity = 0.24 + state.veil * 0.36 + state.fracture * 1.1 + state.afterglow * 0.04;

    storyLight.position.x = Math.sin(elapsed * 0.18) * 0.24;
    storyLight.position.y = -0.92 + state.gravity * 0.18 + state.afterglow * 0.24;
    storyLight.position.z = 2.8 - state.yearning * 0.12;
    storyLight.intensity =
      state.yearning * 1.78 +
      state.reunion * 0.04 +
      state.afterglow * 0.06 +
      state.fireworksPresence * 0.1;

    vowLight.position.x = -1.4 + state.afterglow * 0.4;
    vowLight.position.y = 1.2 + state.reunion * 0.36 + state.afterglow * 0.28;
    vowLight.position.z = 1.8;
    vowLight.intensity = state.reunion * 0.05 + state.afterglow * 0.06 + state.surge * 0.02;

    afterimagePass.uniforms.damp.value =
      0.904 -
      state.veil * 0.01 -
      state.fracture * 0.022 -
      state.afterglow * 0.003 -
      state.fireworksBurst * 0.012 -
      state.glyphReveal * 0.04 -
      state.glyphHold * 0.08 -
      state.reunion * 0.001 -
      loopDrift * 0.054 -
      state.release * 0.02;

    if (backdrop) {
      backdrop.update(state);
    }
    if (skyStreaks) {
      skyStreaks.update(state);
    }
    if (starBackdrop) {
      starBackdrop.update(state);
    }
    storyHalo.update(state);
    heartField.update(state);
    heartStarfield.update(state);
    energyBase.update(state);
    flowRibbons.update(state);
    fractureVeil.update(state);
    if (nameFireworks) {
      nameFireworks.group.visible =
        state.fireworksPresence > 0.01 ||
        state.glyphRain > 0.01 ||
        state.glyphReveal > 0.01 ||
        state.glyphFade > 0.01;
      nameFireworks.update(state);
    }
  }

  if (isPrototypeMode && !isShapeDebugMode) {
    if (backdrop) {
      backdrop.update(state);
    }
    if (skyStreaks) {
      skyStreaks.update(state);
    }
    if (starBackdrop) {
      starBackdrop.update(state);
    }
  }

  if (!isPrototypeMode && nameFireworks && !nameFireworks.group.visible) {
    nameFireworks.update(state);
  }

  dreamPass.update(state);

  composer.render();
  requestAnimationFrame(animate);
}

onResize();
requestAnimationFrame(animate);
