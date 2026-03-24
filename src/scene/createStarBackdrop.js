import * as THREE from 'three';

const vertexShader = `
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
    float twinkle = sin(uTime * (0.12 + brightness * 0.4) + seed * 71.0) * 0.5 + 0.5;
    float pulse = sin(uTime * (0.08 + flare * 0.22) + seed * 43.0 + tone * 9.0) * 0.5 + 0.5;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    gl_PointSize =
      size *
      uPixelRatio *
      (30.0 / -mvPosition.z) *
      (0.9 + twinkle * 0.18 + pulse * flare * 0.22);
    gl_Position = projectionMatrix * mvPosition;

    vec3 blue = vec3(0.62, 0.84, 1.0);
    vec3 lilac = vec3(0.9, 0.86, 1.0);
    vec3 white = vec3(1.0, 0.99, 1.0);
    vColor = mix(blue, lilac, tone);
    vColor = mix(vColor, white, 0.26 + brightness * 0.5 + twinkle * 0.12);
    vAlpha = uIntensity * (0.08 + brightness * 0.6 + twinkle * 0.08 + pulse * flare * 0.12);
    vFlare = flare * (0.28 + brightness * 0.72);
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  varying float vFlare;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    float glow = smoothstep(0.52, 0.0, dist);
    float core = smoothstep(0.14, 0.0, dist);
    float vertical = smoothstep(0.04, 0.0, abs(uv.x)) * smoothstep(0.5, 0.02, abs(uv.y));
    float horizontal = smoothstep(0.04, 0.0, abs(uv.y)) * smoothstep(0.5, 0.02, abs(uv.x));
    float flare = max(vertical, horizontal) * vFlare;
    float alpha = glow * 0.22 + core * 0.46 + flare * 0.2;

    if (alpha < 0.01) {
      discard;
    }

    vec3 color = vColor * (0.56 + core * 0.94 + flare * 0.56);
    gl_FragColor = vec4(color, alpha * vAlpha);
  }
`;

function createStarLayer({
  count,
  intensity,
  sizeMin,
  sizeMax,
  brightChance,
  xRange,
  yRange,
  zRange,
  keepoutScale
}) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);
  const tones = new Float32Array(count);
  const brightness = new Float32Array(count);
  const flare = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    while (true) {
      const x = THREE.MathUtils.randFloatSpread(xRange);
      const y = THREE.MathUtils.randFloat(yRange[0], yRange[1]);
      const z = THREE.MathUtils.randFloat(zRange[0], zRange[1]);
      const brightnessValue = Math.pow(Math.random(), 2.0);
      const centerKeepout =
        Math.pow(x / keepoutScale[0], 2.0) +
          Math.pow((y - keepoutScale[1]) / keepoutScale[2], 2.0) <
        1.0;
      const lowerKeepout = Math.abs(x) < 2.5 && y > -1.2 && y < 1.6;

      if ((centerKeepout && Math.random() < 0.92) || (lowerKeepout && Math.random() < 0.86)) {
        continue;
      }

      positions[index * 3] = x;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = z;
      brightness[index] = THREE.MathUtils.lerp(0.06, 1.0, brightnessValue);
      sizes[index] =
        THREE.MathUtils.lerp(sizeMin, sizeMax, Math.pow(Math.random(), 0.42)) *
        THREE.MathUtils.lerp(0.9, 1.32, brightness[index]);
      seeds[index] = Math.random();
      tones[index] = Math.random();
      flare[index] =
        Math.random() < brightChance
          ? THREE.MathUtils.lerp(0.2, 1.0, Math.random())
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
    vertexShader,
    fragmentShader,
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

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  return {
    points,
    material,
    baseIntensity: intensity
  };
}

export function createStarBackdrop() {
  const group = new THREE.Group();

  const deepLayer = createStarLayer({
    count: 1800,
    intensity: 0.8,
    sizeMin: 0.24,
    sizeMax: 0.82,
    brightChance: 0.1,
    xRange: 28,
    yRange: [-4.2, 9.2],
    zRange: [-14.5, -9.2],
    keepoutScale: [4.2, 1.8, 3.2]
  });

  const midLayer = createStarLayer({
    count: 760,
    intensity: 0.98,
    sizeMin: 0.34,
    sizeMax: 1.18,
    brightChance: 0.22,
    xRange: 24,
    yRange: [-3.6, 8.8],
    zRange: [-9.4, -6.2],
    keepoutScale: [3.7, 1.7, 2.9]
  });

  const heroLayer = createStarLayer({
    count: 120,
    intensity: 1.18,
    sizeMin: 0.8,
    sizeMax: 1.9,
    brightChance: 0.58,
    xRange: 22,
    yRange: [-3.2, 8.4],
    zRange: [-7.0, -5.2],
    keepoutScale: [3.4, 1.6, 2.7]
  });

  deepLayer.points.renderOrder = -24;
  midLayer.points.renderOrder = -23;
  heroLayer.points.renderOrder = -22;

  group.add(deepLayer.points);
  group.add(midLayer.points);
  group.add(heroLayer.points);

  return {
    group,
    setPixelRatio(pixelRatio) {
      deepLayer.material.uniforms.uPixelRatio.value = pixelRatio;
      midLayer.material.uniforms.uPixelRatio.value = pixelRatio;
      heroLayer.material.uniforms.uPixelRatio.value = pixelRatio;
    },
    update(state) {
      deepLayer.material.uniforms.uTime.value = state.elapsed;
      midLayer.material.uniforms.uTime.value = state.elapsed;
      heroLayer.material.uniforms.uTime.value = state.elapsed;

      deepLayer.material.uniforms.uIntensity.value =
        deepLayer.baseIntensity + state.serenity * 0.06 + state.yearning * 0.08 + state.afterglow * 0.12 - state.veil * 0.05;
      midLayer.material.uniforms.uIntensity.value =
        midLayer.baseIntensity + state.serenity * 0.08 + state.yearning * 0.06 + state.afterglow * 0.14 - state.veil * 0.04;
      heroLayer.material.uniforms.uIntensity.value =
        heroLayer.baseIntensity +
        state.serenity * 0.1 +
        state.fracture * 0.04 +
        state.witness * 0.12 +
        state.afterglow * 0.18;

      group.position.x = Math.sin(state.elapsed * 0.018) * 0.18 + state.fracture * 0.08;
      group.position.y = Math.cos(state.elapsed * 0.02) * 0.06 + state.yearning * 0.04 - state.veil * 0.08 + state.afterglow * 0.08;
      group.rotation.z = Math.sin(state.elapsed * 0.012) * 0.008 - state.veil * 0.016 + state.afterglow * 0.012;
    }
  };
}
