import * as THREE from 'three';

const baseVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const baseFragmentShader = `
  uniform float uTime;
  uniform float uShock;
  uniform float uPresence;
  uniform float uFracture;
  uniform float uSurge;
  uniform float uYearning;
  uniform float uVeil;
  uniform float uAfterglow;

  varying vec2 vUv;

  void main() {
    vec2 centered = vUv - 0.5;
    centered.x *= 1.34;
    centered.y *= 0.88;
    float radius = length(centered) * 2.0;
    float angle = atan(centered.y, centered.x);

    float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
    float ringWarp = sin(angle * 10.0 - uTime * 3.0) * 0.028;
    vec2 sweepDir = normalize(vec2(cos(-0.72 + uTime * 0.3), sin(-0.72 + uTime * 0.3)));
    float sweep = dot(normalize(centered + vec2(0.0001)), sweepDir) * 0.5 + 0.5;
    float ring = smoothstep(0.08, 0.0, abs(radius - (0.56 + ringWarp)));
    float basin = smoothstep(1.08, 0.16, radius);
    float centerGlow = smoothstep(0.62, 0.0, radius) * (0.55 + pulse * 0.12);
    float ripples = smoothstep(0.16, 0.0, abs(fract(radius * 2.8 - uTime * 0.88 + sweep * 0.12) - 0.5));
    float rays = pow(max(0.0, cos(angle - 0.72 + sin(uTime * 0.24) * 0.2)), 10.0) * smoothstep(1.05, 0.14, radius);
    float crescent = smoothstep(0.52, 0.98, sweep) * smoothstep(0.96, 0.28, radius);
    float shockRing = smoothstep(0.06, 0.0, abs(radius - (0.28 + uShock * 0.74)));
    float haze = smoothstep(1.2, 0.0, radius);
    float shadowMask = smoothstep(0.18, 0.94, radius) * (0.32 + (1.0 - crescent) * 0.28);
    float surgeHalo = smoothstep(0.66, 0.0, radius) * smoothstep(0.18, 0.96, sweep);
    float vowRing = smoothstep(0.05, 0.0, abs(radius - (0.34 - uAfterglow * 0.08)));
    float yearningMist = smoothstep(0.88, 0.0, radius) * smoothstep(0.18, 0.76, sweep);
    float lightMask =
      centerGlow * 0.34 +
      ring * 0.68 +
      crescent * 0.82 +
      rays * 0.34 +
      shockRing * uShock * 0.88 +
      surgeHalo * uSurge * 0.58 +
      vowRing * uAfterglow * 0.72 +
      yearningMist * uYearning * 0.32;

    float alpha =
      basin * (0.12 + uPresence * 0.06) +
      ring * 0.26 +
      centerGlow * 0.08 +
      crescent * 0.22 +
      ripples * 0.028 +
      rays * 0.1 +
      shockRing * uShock * 0.28 +
      haze * uFracture * 0.05 +
      surgeHalo * uSurge * 0.1 +
      vowRing * uAfterglow * 0.14 +
      yearningMist * uYearning * 0.08;

    if (alpha < 0.01) {
      discard;
    }

    vec3 deep = vec3(0.015, 0.022, 0.06);
    vec3 shadow = mix(vec3(0.05, 0.03, 0.1), vec3(0.02, 0.08, 0.14), crescent * 0.4 + sweep * 0.12 + 0.5);
    vec3 indigo = vec3(0.18, 0.25, 0.62);
    vec3 cyan = vec3(0.5, 0.94, 1.0);
    vec3 blush = vec3(1.0, 0.72, 0.84);
    vec3 white = vec3(0.93, 0.98, 1.0);
    vec3 color = mix(deep, shadow, basin);
    color = mix(color, mix(indigo, cyan, clamp(centerGlow * 0.4 + ring * 0.7 + crescent * 0.5 + pulse * 0.12, 0.0, 1.0)), clamp(lightMask, 0.0, 1.0));
    color = mix(color, vec3(0.42, 0.84, 1.0), yearningMist * uYearning * 0.16);
    color = mix(color, blush, crescent * 0.2 + shockRing * uShock * 0.28 + surgeHalo * uSurge * 0.18);
    color = mix(color, white, centerGlow * 0.2 + shockRing * uShock * 0.56 + ring * 0.16 + crescent * 0.18 + surgeHalo * uSurge * 0.34 + vowRing * uAfterglow * 0.42);
    color = max(color - vec3(shadowMask * 0.06), vec3(0.0));
    color = max(color - vec3(uVeil * 0.03), vec3(0.0));
    gl_FragColor = vec4(color * (1.0 + pulse * 0.1 + uShock * 0.18 + uSurge * 0.12 + uAfterglow * 0.16), alpha);
  }
`;

const sparkVertexShader = `
  attribute float angle;
  attribute float radius;
  attribute float speed;
  attribute float offset;
  attribute float size;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uFracture;
  uniform float uPresence;
  uniform float uSurge;
  uniform float uSurgeProgress;

  varying float vAlpha;
  varying vec3 vColor;
  varying float vHeat;

  void main() {
    float life = fract(uTime * speed + offset);
    float spiral = angle + life * (8.0 + uFracture * 7.0) + offset * 6.28318530718;
    float reach = mix(radius * 0.45, radius * (1.15 + uFracture * 0.7), 1.0 - life);

    vec3 position = vec3(
      cos(spiral) * reach,
      -1.96 + life * (1.15 + uFracture * 0.7),
      sin(spiral * 0.9) * reach * 0.72
    );

    position.x += sin(life * 18.0 + offset * 19.0) * 0.08 * (1.0 - life);
    position.z += cos(life * 16.0 + offset * 21.0) * 0.12 * (1.0 - life);
    float surgeWave = smoothstep(0.0, 0.2, uSurgeProgress - offset * 0.46 + 0.08);
    float plume = surgeWave * uSurge * exp(-radius * 1.15);
    position.x *= 1.0 - plume * 0.82;
    position.z *= 1.0 - plume * 0.9;
    position.y += plume * (1.2 + (1.0 - life) * 1.4 + radius * 0.25);
    position.x += sin(life * 13.0 + offset * 17.0) * 0.12 * plume;
    position.z += cos(life * 11.0 + offset * 15.0) * 0.14 * plume;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * uPixelRatio * (20.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    float riseFade = 1.0 - smoothstep(0.34, 0.72 + uFracture * 0.18, life);
    float frontness = clamp(position.z / 1.2 + 0.5, 0.0, 1.0);
    float heat = pow(1.0 - life, 1.8) * (0.34 + uFracture * 0.62) * (sin(uTime * 8.0 + offset * 31.0) * 0.5 + 0.5);
    float surgeHeat = plume * (0.48 + (1.0 - life) * 0.72);
    vAlpha =
      smoothstep(1.0, 0.08, life) *
      riseFade *
      (0.48 + uPresence * 0.3 + uFracture * 0.24 + frontness * 0.12 + heat * 0.3 + surgeHeat * 0.82);
    vColor = mix(vec3(0.14, 0.18, 0.46), vec3(0.68, 0.96, 1.0), life);
    vColor = mix(vColor, vec3(1.0, 0.74, 0.84), heat * 0.32 + surgeHeat * 0.24);
    vColor = mix(vColor, vec3(0.96, 0.99, 1.0), heat * 0.26 + frontness * 0.1 + surgeHeat * 0.22);
    vHeat = max(heat, surgeHeat);
  }
`;

const sparkFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  varying float vHeat;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    float glow = smoothstep(0.52, 0.0, dist);
    float core = smoothstep(0.18, 0.0, dist);
    float alpha = glow * (0.74 + vHeat * 0.18) * vAlpha + core * vHeat * 0.2 * vAlpha;

    if (alpha < 0.01) {
      discard;
    }

    gl_FragColor = vec4(vColor * (0.82 + core * 0.44 + vHeat * 0.36), alpha);
  }
`;

const surgeVertexShader = `
  attribute float angle;
  attribute float radius;
  attribute float lift;
  attribute float lag;
  attribute float size;
  attribute float seed;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSurge;
  uniform float uSurgeProgress;
  uniform float uRefracture;
  uniform float uLayer;

  varying float vAlpha;
  varying vec3 vColor;
  varying float vSpark;

  void main() {
    float wave = clamp((uSurgeProgress - lag) / max(0.001, 1.0 - lag), 0.0, 1.0);
    float plume = smoothstep(0.08, 0.22, wave) * (1.0 - smoothstep(0.72, 0.98, wave));
    float veil = smoothstep(0.0, 1.0, uLayer);
    float spiral = angle + wave * (3.8 + lift * 1.6) + uTime * 0.28 + seed * 5.0;
    float beamCenterX = mix(-0.08, 0.12, smoothstep(0.06, 0.92, wave));
    float beamCenterZ = sin(wave * 4.6 + seed * 7.0) * mix(0.08, 0.02, wave);
    float width =
      mix(
        radius * mix(1.0, 1.34, veil),
        radius * mix(0.038, 0.1, veil),
        wave
      );

    vec3 position = vec3(
      beamCenterX + cos(spiral) * width,
      -1.98 + wave * lift,
      beamCenterZ + sin(spiral * 0.88) * width * mix(0.84, 1.22, veil)
    );

    position.x += sin(uTime * 5.0 + seed * 17.0) * mix(0.04, 0.08, veil) * (1.0 - wave * 0.55);
    position.z += cos(uTime * 4.2 + seed * 13.0) * mix(0.05, 0.08, veil) * (1.0 - wave * 0.42);
    position.y += sin(wave * 10.0 + seed * 7.0) * mix(0.06, 0.1, veil) * plume;
    position.x += sin(wave * 7.4 + angle * 1.6 + seed * 9.0) * plume * mix(0.03, 0.09, veil);
    position.z += cos(wave * 6.6 + angle * 1.1 + seed * 11.0) * plume * mix(0.02, 0.06, veil);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize =
      size *
      uPixelRatio *
      (24.0 / -mvPosition.z) *
      (0.92 + plume * mix(0.42, 0.5, veil) + uRefracture * mix(0.14, 0.08, veil)) *
      mix(0.92, 1.18, veil);
    gl_Position = projectionMatrix * mvPosition;

    float intensity = plume * uSurge * mix(0.28 + uRefracture * 0.24, 0.09 + uRefracture * 0.08, veil);
    float pulse = sin(uTime * (2.4 + seed * 1.8) + seed * 29.0) * 0.5 + 0.5;
    vAlpha = intensity * (0.46 + pulse * 0.24 + smoothstep(0.0, 0.56, wave) * mix(0.42, 0.32, veil));
    vAlpha *= mix(0.92, 0.34, veil);

    vec3 cyan = vec3(0.62, 0.95, 1.0);
    vec3 blush = vec3(1.0, 0.74, 0.86);
    vec3 white = vec3(0.97, 0.99, 1.0);
    vColor = mix(cyan, blush, wave * (0.24 + veil * 0.16) + pulse * 0.12);
    vColor = mix(vColor, white, plume * mix(0.42, 0.24, veil) + uRefracture * mix(0.14, 0.08, veil));
    vSpark = plume;
  }
`;

const surgeFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  varying float vSpark;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    float glow = smoothstep(0.54, 0.0, dist);
    float core = smoothstep(0.16, 0.0, dist);
    float streak = smoothstep(0.08, 0.0, abs(uv.x)) * smoothstep(0.5, 0.0, abs(uv.y));
    float alpha = glow * (0.58 + vSpark * 0.22) * vAlpha + core * 0.28 * vAlpha + streak * vSpark * 0.24 * vAlpha;

    if (alpha < 0.01) {
      discard;
    }

    gl_FragColor = vec4(vColor * (0.78 + core * 0.5 + streak * 0.22), alpha);
  }
`;

export function createEnergyBase() {
  const group = new THREE.Group();

  const baseMaterial = new THREE.ShaderMaterial({
    vertexShader: baseVertexShader,
    fragmentShader: baseFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uShock: { value: 0 },
      uPresence: { value: 1 },
      uFracture: { value: 0 },
      uSurge: { value: 0 },
      uYearning: { value: 0 },
      uVeil: { value: 0 },
      uAfterglow: { value: 0 }
    }
  });

  const base = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 3.4, 1, 1), baseMaterial);
  base.rotation.x = -Math.PI / 2;
  base.position.y = -1.92;
  group.add(base);

  const sparkCount = 1600;
  const sparkGeometry = new THREE.BufferGeometry();
  const angle = new Float32Array(sparkCount);
  const radius = new Float32Array(sparkCount);
  const speed = new Float32Array(sparkCount);
  const offset = new Float32Array(sparkCount);
  const size = new Float32Array(sparkCount);
  const placeholder = new Float32Array(sparkCount * 3);

  for (let index = 0; index < sparkCount; index += 1) {
    angle[index] = Math.random() * Math.PI * 2;
    radius[index] = 0.28 + Math.random() * 1.38;
    speed[index] = 0.14 + Math.random() * 0.34;
    offset[index] = Math.random();
    size[index] = 0.45 + Math.random() * 1.35;
  }

  sparkGeometry.setAttribute('position', new THREE.BufferAttribute(placeholder, 3));
  sparkGeometry.setAttribute('angle', new THREE.BufferAttribute(angle, 1));
  sparkGeometry.setAttribute('radius', new THREE.BufferAttribute(radius, 1));
  sparkGeometry.setAttribute('speed', new THREE.BufferAttribute(speed, 1));
  sparkGeometry.setAttribute('offset', new THREE.BufferAttribute(offset, 1));
  sparkGeometry.setAttribute('size', new THREE.BufferAttribute(size, 1));

  const sparkMaterial = new THREE.ShaderMaterial({
    vertexShader: sparkVertexShader,
    fragmentShader: sparkFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uFracture: { value: 0 },
      uPresence: { value: 1 },
      uSurge: { value: 0 },
      uSurgeProgress: { value: 0 }
    }
  });

  const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
  group.add(sparks);

  const surgeCount = 560;
  const surgeGeometry = new THREE.BufferGeometry();
  const surgeAngle = new Float32Array(surgeCount);
  const surgeRadius = new Float32Array(surgeCount);
  const surgeLift = new Float32Array(surgeCount);
  const surgeLag = new Float32Array(surgeCount);
  const surgeSize = new Float32Array(surgeCount);
  const surgeSeed = new Float32Array(surgeCount);
  const surgePlaceholder = new Float32Array(surgeCount * 3);

  for (let index = 0; index < surgeCount; index += 1) {
    surgeAngle[index] = Math.random() * Math.PI * 2;
    surgeRadius[index] = 0.06 + Math.random() * 0.54;
    surgeLift[index] = 2.7 + Math.random() * 2.3;
    surgeLag[index] = Math.pow(Math.random(), 1.35) * 0.72;
    surgeSize[index] = 0.62 + Math.random() * 1.85;
    surgeSeed[index] = Math.random();
  }

  surgeGeometry.setAttribute('position', new THREE.BufferAttribute(surgePlaceholder, 3));
  surgeGeometry.setAttribute('angle', new THREE.BufferAttribute(surgeAngle, 1));
  surgeGeometry.setAttribute('radius', new THREE.BufferAttribute(surgeRadius, 1));
  surgeGeometry.setAttribute('lift', new THREE.BufferAttribute(surgeLift, 1));
  surgeGeometry.setAttribute('lag', new THREE.BufferAttribute(surgeLag, 1));
  surgeGeometry.setAttribute('size', new THREE.BufferAttribute(surgeSize, 1));
  surgeGeometry.setAttribute('seed', new THREE.BufferAttribute(surgeSeed, 1));

  const surgeMaterial = new THREE.ShaderMaterial({
    vertexShader: surgeVertexShader,
    fragmentShader: surgeFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uSurge: { value: 0 },
      uSurgeProgress: { value: 0 },
      uRefracture: { value: 0 },
      uLayer: { value: 0 }
    }
  });

  const surgeVeilMaterial = new THREE.ShaderMaterial({
    vertexShader: surgeVertexShader,
    fragmentShader: surgeFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uSurge: { value: 0 },
      uSurgeProgress: { value: 0 },
      uRefracture: { value: 0 },
      uLayer: { value: 1 }
    }
  });

  const surgeVeilPoints = new THREE.Points(surgeGeometry, surgeVeilMaterial);
  surgeVeilPoints.frustumCulled = false;
  surgeVeilPoints.renderOrder = 3;
  group.add(surgeVeilPoints);

  const surgePoints = new THREE.Points(surgeGeometry, surgeMaterial);
  surgePoints.frustumCulled = false;
  surgePoints.renderOrder = 4;
  group.add(surgePoints);

  return {
    group,
    setPixelRatio(pixelRatio) {
      sparkMaterial.uniforms.uPixelRatio.value = pixelRatio;
      surgeMaterial.uniforms.uPixelRatio.value = pixelRatio;
      surgeVeilMaterial.uniforms.uPixelRatio.value = pixelRatio;
    },
    update(state) {
      baseMaterial.uniforms.uTime.value = state.elapsed;
      baseMaterial.uniforms.uShock.value = state.shock;
      baseMaterial.uniforms.uPresence.value = state.heartPresence;
      baseMaterial.uniforms.uFracture.value = state.fracture;
      baseMaterial.uniforms.uSurge.value = state.surge;
      baseMaterial.uniforms.uYearning.value = state.yearning;
      baseMaterial.uniforms.uVeil.value = state.veil;
      baseMaterial.uniforms.uAfterglow.value = state.afterglow;

      sparkMaterial.uniforms.uTime.value = state.elapsed;
      sparkMaterial.uniforms.uFracture.value = state.fracture;
      sparkMaterial.uniforms.uPresence.value = state.heartPresence;
      sparkMaterial.uniforms.uSurge.value = state.surge;
      sparkMaterial.uniforms.uSurgeProgress.value = state.surgeProgress;

      surgeMaterial.uniforms.uTime.value = state.elapsed;
      surgeMaterial.uniforms.uSurge.value = state.surge;
      surgeMaterial.uniforms.uSurgeProgress.value = state.surgeProgress;
      surgeMaterial.uniforms.uRefracture.value = state.refracture;

      surgeVeilMaterial.uniforms.uTime.value = state.elapsed;
      surgeVeilMaterial.uniforms.uSurge.value = state.surge;
      surgeVeilMaterial.uniforms.uSurgeProgress.value = state.surgeProgress;
      surgeVeilMaterial.uniforms.uRefracture.value = state.refracture;

      base.scale.setScalar(
        1 +
        Math.sin(state.elapsed * 1.9) * 0.018 +
        state.yearning * 0.022 +
        state.shock * 0.04 +
        state.surge * 0.06 +
        state.afterglow * 0.01
      );
      group.position.y = state.invocation * 0.02 - state.veil * 0.04 + state.afterglow * 0.006;
    }
  };
}
