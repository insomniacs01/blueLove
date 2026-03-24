import * as THREE from 'three';

const pointVertexShader = `
  attribute float size;
  attribute float seed;
  attribute float tone;
  attribute float trail;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uIntensity;
  uniform float uBloom;

  varying float vAlpha;
  varying vec3 vColor;
  varying float vTrail;

  void main() {
    float twinkle = sin(uTime * (1.1 + tone * 1.2) + seed * 29.0 + trail * 8.0) * 0.5 + 0.5;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * uPixelRatio * (30.0 / -mvPosition.z) * uIntensity * (0.94 + twinkle * 0.18);
    gl_Position = projectionMatrix * mvPosition;

    vec3 blue = vec3(0.62, 0.84, 1.0);
    vec3 violet = vec3(0.92, 0.88, 1.0);
    vec3 white = vec3(1.0, 0.995, 1.0);
    vColor = mix(violet, blue, tone);
    vColor = mix(vColor, white, 0.42 + twinkle * 0.26 + uBloom * 0.18);
    float skyMask = smoothstep(1.0, 4.6, position.y);
    vAlpha = (0.18 + twinkle * 0.12) * uIntensity * skyMask;
    vTrail = trail;
  }
`;

const pointFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  varying float vTrail;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    float glow = smoothstep(0.5, 0.0, dist);
    float core = smoothstep(0.18, 0.0, dist);
    float haze = smoothstep(0.58, 0.0, dist);
    float trailFade = 1.0 - vTrail;
    float alpha = haze * (0.16 + trailFade * 0.14) + glow * (0.18 + trailFade * 0.18) + core * 0.14;

    if (alpha < 0.02) {
      discard;
    }

    gl_FragColor = vec4(vColor, alpha * vAlpha);
  }
`;

const starVertexShader = `
  attribute float size;
  attribute float seed;
  attribute float tone;
  attribute float brightness;
  attribute float flare;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uIntensity;

  varying float vAlpha;
  varying vec3 vColor;
  varying float vFlare;

  void main() {
    float twinkle = sin(uTime * (0.16 + brightness * 0.72) + seed * 61.0) * 0.5 + 0.5;
    float burst = smoothstep(
      0.82,
      1.0,
      sin(uTime * (0.28 + flare * 0.9) + seed * 83.0) * 0.5 + 0.5
    ) * flare;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize =
      size *
      uPixelRatio *
      (29.0 / -mvPosition.z) *
      (0.78 + brightness * 1.08 + twinkle * 0.2 + burst * 0.36);
    gl_Position = projectionMatrix * mvPosition;

    vec3 blue = vec3(0.64, 0.86, 1.0);
    vec3 lilac = vec3(0.88, 0.84, 1.0);
    vec3 white = vec3(1.0, 0.995, 1.0);
    vColor = mix(blue, lilac, tone);
    vColor = mix(vColor, white, 0.34 + brightness * 0.46 + twinkle * 0.16 + burst * 0.2);
    vAlpha = uIntensity * (0.1 + brightness * 0.56 + twinkle * 0.08 + burst * 0.14);
    vFlare = flare * (0.35 + brightness * 0.65);
  }
`;

const starFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  varying float vFlare;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    float glow = smoothstep(0.52, 0.0, dist);
    float core = smoothstep(0.14, 0.0, dist);
    float vertical = smoothstep(0.045, 0.0, abs(uv.x)) * smoothstep(0.5, 0.02, abs(uv.y));
    float horizontal = smoothstep(0.045, 0.0, abs(uv.y)) * smoothstep(0.5, 0.02, abs(uv.x));
    float flare = max(vertical, horizontal) * vFlare;
    float alpha = glow * 0.26 + core * 0.5 + flare * 0.22;

    if (alpha < 0.012) {
      discard;
    }

    vec3 color = vColor * (0.58 + core * 0.92 + flare * 0.48);
    gl_FragColor = vec4(color, alpha * vAlpha);
  }
`;

function createMeteorDescriptor(hero, index, count) {
  const driftZ = THREE.MathUtils.randFloat(-0.05, 0.05);
  const direction = new THREE.Vector3(
    -1.0,
    THREE.MathUtils.randFloat(hero ? -0.19 : -0.18, hero ? -0.13 : -0.12),
    driftZ
  ).normalize();
  const phase = (((index + Math.random() * 0.35) / count) % 1 + 1) % 1;

  const tone = Math.random();
  const color = new THREE.Color().setRGB(
    THREE.MathUtils.lerp(0.78, 1.0, tone),
    THREE.MathUtils.lerp(0.82, 0.98, tone),
    1.0
  );

  return {
    hero,
    origin: new THREE.Vector3(
      THREE.MathUtils.randFloat(hero ? 7.2 : 6.1, hero ? 11.6 : 10.0),
      THREE.MathUtils.randFloat(hero ? 2.8 : 2.2, hero ? 5.0 : 4.3),
      THREE.MathUtils.randFloat(hero ? -1.8 : -3.0, hero ? -0.5 : -1.0)
    ),
    direction,
    span: THREE.MathUtils.randFloat(hero ? 11.5 : 9.2, hero ? 16.5 : 13.2),
    length: THREE.MathUtils.randFloat(hero ? 4.2 : 2.6, hero ? 6.8 : 4.6),
    speed: THREE.MathUtils.randFloat(hero ? 0.1 : 0.13, hero ? 0.16 : 0.21),
    arc: THREE.MathUtils.randFloat(hero ? 0.04 : 0.02, hero ? 0.11 : 0.07),
    depthWave: THREE.MathUtils.randFloat(hero ? 0.012 : 0.006, hero ? 0.04 : 0.024),
    width: THREE.MathUtils.randFloat(hero ? 0.08 : 0.045, hero ? 0.15 : 0.09),
    bloom: THREE.MathUtils.randFloat(hero ? 0.65 : 0.35, hero ? 1.0 : 0.6),
    headSize: THREE.MathUtils.randFloat(hero ? 2.8 : 1.7, hero ? 4.5 : 2.7),
    tailSize: THREE.MathUtils.randFloat(hero ? 1.7 : 1.0, hero ? 2.6 : 1.7),
    color,
    tone,
    phase,
    seed: Math.random()
  };
}

function createTrailLayer({
  count,
  hero,
  samples,
  coreIntensity,
  hazeIntensity,
  headIntensity
}) {
  const meteors = Array.from({ length: count }, (_, index) =>
    createMeteorDescriptor(hero, index, count)
  );
  const particleCount = count * samples;

  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const seeds = new Float32Array(particleCount);
  const tones = new Float32Array(particleCount);
  const trails = new Float32Array(particleCount);
  const spreads = new Float32Array(particleCount);

  const hazePositions = new Float32Array(particleCount * 3);
  const hazeSizes = new Float32Array(particleCount);
  const hazeSeeds = new Float32Array(particleCount);
  const hazeTones = new Float32Array(particleCount);
  const hazeTrails = new Float32Array(particleCount);

  const headPositions = new Float32Array(count * 3);
  const headSizes = new Float32Array(count);
  const headSeeds = new Float32Array(count);
  const headTones = new Float32Array(count);

  for (let meteorIndex = 0; meteorIndex < count; meteorIndex += 1) {
    const meteor = meteors[meteorIndex];
    headSizes[meteorIndex] = meteor.headSize;
    headSeeds[meteorIndex] = meteor.seed;
    headTones[meteorIndex] = meteor.tone;

    for (let sampleIndex = 0; sampleIndex < samples; sampleIndex += 1) {
      const index = meteorIndex * samples + sampleIndex;
      const trail = sampleIndex / (samples - 1);
      const sizeFade = 1.0 - trail;

      sizes[index] = THREE.MathUtils.lerp(meteor.headSize, meteor.tailSize, trail);
      seeds[index] = meteor.seed + sampleIndex * 0.037;
      tones[index] = meteor.tone;
      trails[index] = trail;
      spreads[index] = (0.18 + trail * 0.82) * meteor.width;

      hazeSizes[index] = sizes[index] * THREE.MathUtils.lerp(2.0, 3.4, trail);
      hazeSeeds[index] = seeds[index] + 0.23;
      hazeTones[index] = meteor.tone;
      hazeTrails[index] = trail;

      if (sizeFade < 0) {
        sizes[index] = meteor.tailSize;
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  positionAttribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('tone', new THREE.BufferAttribute(tones, 1));
  geometry.setAttribute('trail', new THREE.BufferAttribute(trails, 1));

  const hazeGeometry = new THREE.BufferGeometry();
  const hazePositionAttribute = new THREE.BufferAttribute(hazePositions, 3);
  hazePositionAttribute.setUsage(THREE.DynamicDrawUsage);
  hazeGeometry.setAttribute('position', hazePositionAttribute);
  hazeGeometry.setAttribute('size', new THREE.BufferAttribute(hazeSizes, 1));
  hazeGeometry.setAttribute('seed', new THREE.BufferAttribute(hazeSeeds, 1));
  hazeGeometry.setAttribute('tone', new THREE.BufferAttribute(hazeTones, 1));
  hazeGeometry.setAttribute('trail', new THREE.BufferAttribute(hazeTrails, 1));

  const headGeometry = new THREE.BufferGeometry();
  const headPositionAttribute = new THREE.BufferAttribute(headPositions, 3);
  headPositionAttribute.setUsage(THREE.DynamicDrawUsage);
  headGeometry.setAttribute('position', headPositionAttribute);
  headGeometry.setAttribute('size', new THREE.BufferAttribute(headSizes, 1));
  headGeometry.setAttribute('seed', new THREE.BufferAttribute(headSeeds, 1));
  headGeometry.setAttribute('tone', new THREE.BufferAttribute(headTones, 1));
  headGeometry.setAttribute('trail', new THREE.BufferAttribute(new Float32Array(count), 1));

  const coreMaterial = new THREE.ShaderMaterial({
    vertexShader: pointVertexShader,
    fragmentShader: pointFragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uIntensity: { value: coreIntensity },
      uBloom: { value: hero ? 0.72 : 0.32 }
    }
  });

  const hazeMaterial = new THREE.ShaderMaterial({
    vertexShader: pointVertexShader,
    fragmentShader: pointFragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uIntensity: { value: hazeIntensity },
      uBloom: { value: hero ? 0.96 : 0.5 }
    }
  });

  const headMaterial = new THREE.ShaderMaterial({
    vertexShader: pointVertexShader,
    fragmentShader: pointFragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uIntensity: { value: headIntensity },
      uBloom: { value: hero ? 1.0 : 0.62 }
    }
  });

  return {
    meteors,
    samples,
    spreads,
    positions,
    hazePositions,
    headPositions,
    positionAttribute,
    hazePositionAttribute,
    headPositionAttribute,
    core: new THREE.Points(geometry, coreMaterial),
    haze: new THREE.Points(hazeGeometry, hazeMaterial),
    heads: new THREE.Points(headGeometry, headMaterial),
    coreMaterial,
    hazeMaterial,
    headMaterial
  };
}

function createDiscreteStarLayer({
  count,
  intensity,
  sizeMin,
  sizeMax,
  brightChance,
  yMin,
  yMax,
  zMin,
  zMax
}) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);
  const tones = new Float32Array(count);
  const brightness = new Float32Array(count);
  const flare = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    while (true) {
      const x = THREE.MathUtils.randFloat(-11.6, 11.6);
      const y = THREE.MathUtils.randFloat(yMin, yMax);
      const z = THREE.MathUtils.randFloat(zMin, zMax);
      const brightnessValue = Math.pow(Math.random(), 2.35);
      const centralKeepout =
        Math.pow(x / 3.3, 2.0) + Math.pow((y - 3.05) / 2.4, 2.0) < 1.0;
      const keepHeartReadable =
        (centralKeepout && Math.random() < 0.92) ||
        (Math.abs(x) < 2.1 &&
          y > 1.0 &&
          y < 4.5 &&
          brightnessValue > 0.7 &&
          Math.random() < 0.9);

      if (keepHeartReadable) {
        continue;
      }

      positions[index * 3] = x;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = z;
      brightness[index] = THREE.MathUtils.lerp(0.04, 1.0, brightnessValue);
      sizes[index] =
        THREE.MathUtils.lerp(sizeMin, sizeMax, Math.pow(Math.random(), 0.34)) *
        THREE.MathUtils.lerp(0.84, 1.3, brightness[index]);
      seeds[index] = Math.random();
      tones[index] = Math.random();
      flare[index] =
        Math.random() < brightChance
          ? THREE.MathUtils.lerp(0.34, 1.0, Math.random())
          : 0.0;
      break;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('tone', new THREE.BufferAttribute(tones, 1));
  geometry.setAttribute('brightness', new THREE.BufferAttribute(brightness, 1));
  geometry.setAttribute('flare', new THREE.BufferAttribute(flare, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uIntensity: { value: intensity }
    }
  });

  return {
    points: new THREE.Points(geometry, material),
    material
  };
}

function updateTrailLayer(layer, state) {
  const side = new THREE.Vector3();
  const up = new THREE.Vector3();
  const head = new THREE.Vector3();
  const center = new THREE.Vector3();
  const offset = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0, 1, 0);

  for (let meteorIndex = 0; meteorIndex < layer.meteors.length; meteorIndex += 1) {
    const meteor = layer.meteors[meteorIndex];
    const progress = (state.elapsed * meteor.speed + meteor.phase) % 1;
    const arcWave = Math.sin(progress * Math.PI) * meteor.arc;

    head.copy(meteor.origin).addScaledVector(meteor.direction, meteor.span * progress);
    head.y += arcWave;
    head.z += Math.sin(progress * Math.PI * 2 + meteor.seed * 16.0) * meteor.depthWave;

    side.crossVectors(meteor.direction, worldUp);
    if (side.lengthSq() < 1e-5) {
      side.set(0, 0, 1);
    } else {
      side.normalize();
    }
    up.crossVectors(side, meteor.direction).normalize();

    const headOffset = meteorIndex * 3;
    layer.headPositions[headOffset] = head.x;
    layer.headPositions[headOffset + 1] = head.y;
    layer.headPositions[headOffset + 2] = head.z;

    for (let sampleIndex = 0; sampleIndex < layer.samples; sampleIndex += 1) {
      const trail = sampleIndex / (layer.samples - 1);
      const index = meteorIndex * layer.samples + sampleIndex;
      const positionIndex = index * 3;

      center.copy(head).addScaledVector(meteor.direction, -meteor.length * trail);

      const wobble = Math.sin(state.elapsed * (1.1 + meteor.seed) + trail * 8.0 + meteor.seed * 12.0);
      const shimmer = Math.cos(state.elapsed * (0.9 + meteor.seed * 0.7) + trail * 11.0 + meteor.seed * 7.0);
      const spread = layer.spreads[index];

      offset.copy(side).multiplyScalar(wobble * spread);
      offset.addScaledVector(up, shimmer * spread * 0.42);

      layer.positions[positionIndex] = center.x + offset.x * 0.42;
      layer.positions[positionIndex + 1] = center.y + offset.y * 0.42;
      layer.positions[positionIndex + 2] = center.z + offset.z * 0.42;

      layer.hazePositions[positionIndex] = center.x + offset.x;
      layer.hazePositions[positionIndex + 1] = center.y + offset.y;
      layer.hazePositions[positionIndex + 2] = center.z + offset.z;
    }
  }

  layer.positionAttribute.needsUpdate = true;
  layer.hazePositionAttribute.needsUpdate = true;
  layer.headPositionAttribute.needsUpdate = true;

  layer.coreMaterial.uniforms.uTime.value = state.elapsed;
  layer.hazeMaterial.uniforms.uTime.value = state.elapsed;
  layer.headMaterial.uniforms.uTime.value = state.elapsed;
}

export function createSkyStreaks() {
  const group = new THREE.Group();

  const heroLayer = createTrailLayer({
    count: 22,
    hero: true,
    samples: 52,
    coreIntensity: 0.82,
    hazeIntensity: 1.22,
    headIntensity: 1.34
  });

  const farLayer = createTrailLayer({
    count: 68,
    hero: false,
    samples: 38,
    coreIntensity: 0.46,
    hazeIntensity: 0.72,
    headIntensity: 0.84
  });

  const deepStars = createDiscreteStarLayer({
    count: 980,
    intensity: 0.58,
    sizeMin: 0.18,
    sizeMax: 0.62,
    brightChance: 0.16,
    yMin: 0.4,
    yMax: 6.8,
    zMin: -10.2,
    zMax: -5.6
  });
  const brightStars = createDiscreteStarLayer({
    count: 240,
    intensity: 0.9,
    sizeMin: 0.34,
    sizeMax: 1.18,
    brightChance: 0.42,
    yMin: 0.2,
    yMax: 6.1,
    zMin: -6.8,
    zMax: -4.0
  });

  farLayer.haze.renderOrder = 2;
  farLayer.core.renderOrder = 3;
  farLayer.heads.renderOrder = 4;
  heroLayer.haze.renderOrder = 5;
  heroLayer.core.renderOrder = 6;
  heroLayer.heads.renderOrder = 7;
  deepStars.points.renderOrder = 8;
  brightStars.points.renderOrder = 9;

  group.add(deepStars.points);
  group.add(brightStars.points);
  group.add(farLayer.haze);
  group.add(farLayer.core);
  group.add(farLayer.heads);
  group.add(heroLayer.haze);
  group.add(heroLayer.core);
  group.add(heroLayer.heads);

  deepStars.points.frustumCulled = false;
  brightStars.points.frustumCulled = false;
  farLayer.haze.frustumCulled = false;
  farLayer.core.frustumCulled = false;
  farLayer.heads.frustumCulled = false;
  heroLayer.haze.frustumCulled = false;
  heroLayer.core.frustumCulled = false;
  heroLayer.heads.frustumCulled = false;

  return {
    group,
    setPixelRatio(pixelRatio) {
      heroLayer.coreMaterial.uniforms.uPixelRatio.value = pixelRatio;
      heroLayer.hazeMaterial.uniforms.uPixelRatio.value = pixelRatio;
      heroLayer.headMaterial.uniforms.uPixelRatio.value = pixelRatio;
      farLayer.coreMaterial.uniforms.uPixelRatio.value = pixelRatio;
      farLayer.hazeMaterial.uniforms.uPixelRatio.value = pixelRatio;
      farLayer.headMaterial.uniforms.uPixelRatio.value = pixelRatio;
      deepStars.material.uniforms.uPixelRatio.value = pixelRatio;
      brightStars.material.uniforms.uPixelRatio.value = pixelRatio;
    },
    update(state) {
      updateTrailLayer(heroLayer, state);
      updateTrailLayer(farLayer, state);

      heroLayer.coreMaterial.uniforms.uIntensity.value =
        0.72 + state.yearning * 0.08 + state.fracture * 0.1 + state.afterglow * 0.06;
      heroLayer.hazeMaterial.uniforms.uIntensity.value =
        1.08 + state.yearning * 0.08 + state.fracture * 0.12 + state.afterglow * 0.06;
      heroLayer.headMaterial.uniforms.uIntensity.value =
        1.18 + state.yearning * 0.1 + state.fracture * 0.14 + state.afterglow * 0.08;

      farLayer.coreMaterial.uniforms.uIntensity.value =
        0.4 + state.witness * 0.08 + state.fracture * 0.08;
      farLayer.hazeMaterial.uniforms.uIntensity.value =
        0.62 + state.witness * 0.08 + state.fracture * 0.1;
      farLayer.headMaterial.uniforms.uIntensity.value =
        0.76 + state.witness * 0.08 + state.fracture * 0.1;

      deepStars.material.uniforms.uTime.value = state.elapsed;
      brightStars.material.uniforms.uTime.value = state.elapsed;
      deepStars.material.uniforms.uIntensity.value =
        0.52 + state.serenity * 0.1 + state.witness * 0.08 - state.veil * 0.04;
      brightStars.material.uniforms.uIntensity.value =
        0.82 + state.serenity * 0.12 + state.witness * 0.1 + state.fracture * 0.05 + state.afterglow * 0.08;

      group.position.x = Math.sin(state.elapsed * 0.03) * 0.12 + state.fracture * 0.08 - state.reunion * 0.04;
      group.position.y = Math.cos(state.elapsed * 0.025) * 0.04 + state.yearning * 0.03 - state.veil * 0.06 + state.afterglow * 0.05;
      group.rotation.z = Math.sin(state.elapsed * 0.014) * 0.01 - state.veil * 0.014 + state.afterglow * 0.012;
    }
  };
}
