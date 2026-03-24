import * as THREE from 'three';

const vertexShader = `
  attribute vec3 anchor;
  attribute vec3 vector;
  attribute float size;
  attribute float seed;
  attribute float tone;
  attribute float heat;
  attribute float depthBias;

  uniform float uTime;
  uniform float uFracture;
  uniform float uReturn;
  uniform float uChaos;
  uniform float uSpinAngle;
  uniform float uSpinCarry;
  uniform float uSurge;
  uniform float uSurgeProgress;
  uniform float uRefracture;
  uniform float uPixelRatio;

  varying float vAlpha;
  varying vec3 vColor;
  varying float vSpark;
  varying float vFront;

  vec3 rotateY(vec3 value, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(
      value.x * c - value.z * s,
      value.y,
      value.x * s + value.z * c
    );
  }

  void main() {
    float phase = seed * 6.28318530718;
    vec3 position = anchor;
    float beamAxis = mix(-0.08, 0.1, smoothstep(0.06, 0.9, uSurgeProgress));
    float beamLift = mix(-0.56, 0.36, smoothstep(0.0, 1.0, uSurgeProgress));
    float impactColumn =
      exp(-pow((anchor.x - beamAxis) / 0.3, 2.0)) *
      exp(-pow((anchor.y - beamLift) / 0.38, 2.0));
    float leftWing = smoothstep(-0.72, -0.04, anchor.x) * smoothstep(-0.16, 1.0, anchor.y);
    float rightWing = smoothstep(0.0, 0.78, anchor.x) * smoothstep(-0.16, 1.0, anchor.y);

    float fractureEnergy = uFracture + uRefracture * (0.46 + impactColumn * 0.54);
    vec3 blown = anchor + vector * (0.3 + fractureEnergy * (1.2 + tone * 0.9));
    blown +=
      vec3(anchor.x * 0.24, 0.5 + depthBias * 0.18, anchor.z * 0.22) *
      uRefracture *
      uSurgeProgress *
      (0.32 + impactColumn * 1.16);
    blown +=
      vec3(
        -0.12 * leftWing + 0.22 * rightWing,
        0.08 * leftWing + 0.18 * rightWing,
        -0.1 * leftWing + 0.14 * rightWing
      ) *
      uRefracture *
      uSurgeProgress *
      (0.16 + impactColumn * 0.88);
    blown = rotateY(blown, phase * 2.0 + uTime * (0.4 + tone * 0.6) * uChaos);
    blown = rotateY(blown, uSpinAngle * uSpinCarry * (0.46 + uFracture * 0.72 + uReturn * 0.36));
    blown.y += sin(uTime * 7.0 + phase * 9.0) * 0.09 * (uFracture + uRefracture * 0.64);

    vec3 returnAnchor = rotateY(anchor, uSpinAngle * uSpinCarry * (0.22 + uReturn * 0.48));
    float fractureMix = clamp(
      uFracture + uRefracture * (0.28 + impactColumn * 0.62 + rightWing * 0.12 + leftWing * 0.04),
      0.0,
      1.0
    );
    float returnGrip = clamp(uReturn * (1.0 - uRefracture * 0.8), 0.0, 1.0);
    position = mix(position, blown, fractureMix);
    position = mix(position, returnAnchor, returnGrip);
    float frontness = clamp(position.z / 1.2 + 0.5, 0.0, 1.0);
    vec3 motionDir = normalize(vector + vec3(0.001, 0.002, 0.001));
    vec3 keyLightDir = normalize(vec3(0.72, 0.28, 0.92));
    vec3 rimLightDir = normalize(vec3(-0.44, 0.18, -1.0));
    float diffuse = max(dot(motionDir, keyLightDir), 0.0);
    float backRim = max(dot(motionDir, rimLightDir), 0.0);
    float flash = heat * smoothstep(0.08, 0.64, uFracture + uRefracture * 0.68) * (0.45 + (sin(uTime * 10.0 + phase * 22.0) * 0.5 + 0.5) * 0.55);
    float coolShade = 0.18 + diffuse * 0.74 + frontness * 0.24 - (1.0 - frontness) * (0.18 + depthBias * 0.22) + impactColumn * uSurge * 0.14;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * uPixelRatio * (24.0 / -mvPosition.z) * mix(0.88, 1.36, heat * 0.7 + diffuse * 0.3 + frontness * 0.2);
    gl_Position = projectionMatrix * mvPosition;

    vec3 shadow = vec3(0.14, 0.18, 0.36);
    vec3 blue = vec3(0.54, 0.86, 1.0);
    vec3 violet = vec3(0.54, 0.42, 0.88);
    vec3 pink = vec3(1.0, 0.67, 0.82);
    vec3 white = vec3(0.95, 0.98, 1.0);
    vColor = mix(violet, blue, tone * (0.72 + frontness * 0.28));
    vColor = mix(shadow, vColor, clamp(coolShade, 0.0, 1.0));
    vColor = mix(vColor, pink, flash * 0.42 + backRim * 0.16 + impactColumn * uSurge * 0.18);
    vColor = mix(vColor, white, flash * 0.4 + diffuse * 0.16 + frontness * 0.12 + impactColumn * uSurge * 0.16);
    vAlpha = (0.012 + uFracture * (0.18 + tone * 0.26) + uRefracture * (0.08 + impactColumn * 0.16)) * (0.52 + diffuse * 0.34 + frontness * 0.26 + heat * 0.24);
    vAlpha *= mix(0.62, 1.2, smoothstep(0.1, 0.85, uFracture));
    vSpark = clamp(flash + diffuse * 0.24, 0.0, 1.0);
    vFront = frontness;
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  varying float vSpark;
  varying float vFront;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    float glow = smoothstep(0.5, 0.0, dist);
    float core = smoothstep(0.18, 0.0, dist);
    float streak = smoothstep(0.1, 0.0, abs(uv.x)) * smoothstep(0.5, 0.02, abs(uv.y));
    float alpha = glow * (0.22 + vFront * 0.16) * vAlpha + core * 0.16 * vAlpha + streak * vSpark * 0.18 * vAlpha;

    if (alpha < 0.01) {
      discard;
    }

    gl_FragColor = vec4(vColor * (0.68 + core * 0.72 + vSpark * 0.36), alpha);
  }
`;

function createHeartOutline() {
  return Array.from({ length: 360 }, (_, index) => {
    const angle = (index / 360) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(angle), 3) * 0.11;
    const y =
      (
        13 * Math.cos(angle) -
        5 * Math.cos(2 * angle) -
        2 * Math.cos(3 * angle) -
        Math.cos(4 * angle)
      ) * 0.105 +
      0.56;

    return new THREE.Vector3(x, y, 0);
  });
}

const HEART_OUTLINE = createHeartOutline();

function randomUnitVector() {
  const vector = new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(2),
    THREE.MathUtils.randFloatSpread(2),
    THREE.MathUtils.randFloatSpread(2)
  );

  return vector.normalize();
}

export function createFractureVeil() {
  const count = 5200;
  const geometry = new THREE.BufferGeometry();
  const position = new Float32Array(count * 3);
  const anchor = new Float32Array(count * 3);
  const vector = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);
  const tone = new Float32Array(count);
  const heat = new Float32Array(count);
  const depthBias = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const base = HEART_OUTLINE[Math.floor(Math.random() * HEART_OUTLINE.length)].clone();
    const inward = THREE.MathUtils.randFloat(0.92, 1.02);
    const jitter = randomUnitVector().multiplyScalar(0.02 + Math.random() * 0.06);
    const outward = base.clone().normalize().multiplyScalar(0.35 + Math.random() * 0.95);
    outward.add(randomUnitVector().multiplyScalar(0.12 + Math.random() * 0.35));
    outward.y += THREE.MathUtils.randFloat(-0.2, 0.44);

    base.multiplyScalar(inward).add(jitter);
    base.z = THREE.MathUtils.randFloatSpread(0.6);

    position[index * 3] = base.x;
    position[index * 3 + 1] = base.y;
    position[index * 3 + 2] = base.z;

    anchor[index * 3] = base.x;
    anchor[index * 3 + 1] = base.y;
    anchor[index * 3 + 2] = base.z;

    vector[index * 3] = outward.x;
    vector[index * 3 + 1] = outward.y;
    vector[index * 3 + 2] = outward.z;

    size[index] = 0.5 + Math.random() * 1.45;
    seed[index] = Math.random();
    tone[index] = Math.random();
    depthBias[index] = THREE.MathUtils.clamp((base.z + 0.3) / 0.6, 0, 1);
    heat[index] = THREE.MathUtils.clamp(Math.pow(Math.random(), 1.8) * 0.74 + depthBias[index] * 0.26, 0, 1);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('anchor', new THREE.BufferAttribute(anchor, 3));
  geometry.setAttribute('vector', new THREE.BufferAttribute(vector, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(size, 1));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  geometry.setAttribute('tone', new THREE.BufferAttribute(tone, 1));
  geometry.setAttribute('heat', new THREE.BufferAttribute(heat, 1));
  geometry.setAttribute('depthBias', new THREE.BufferAttribute(depthBias, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uFracture: { value: 0 },
      uReturn: { value: 0 },
      uChaos: { value: 0 },
      uSpinAngle: { value: 0 },
      uSpinCarry: { value: 0 },
      uSurge: { value: 0 },
      uSurgeProgress: { value: 0 },
      uRefracture: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
    }
  });

  const points = new THREE.Points(geometry, material);
  points.position.y = -0.35;

  return {
    group: points,
    setPixelRatio(pixelRatio) {
      material.uniforms.uPixelRatio.value = pixelRatio;
    },
    update(state) {
      material.uniforms.uTime.value = state.elapsed;
      material.uniforms.uFracture.value = state.fracture;
      material.uniforms.uReturn.value = state.repair;
      material.uniforms.uChaos.value = state.swirl;
      material.uniforms.uSpinAngle.value = state.spinAngle;
      material.uniforms.uSpinCarry.value = state.spinCarry;
      material.uniforms.uSurge.value = state.surge;
      material.uniforms.uSurgeProgress.value = state.surgeProgress;
      material.uniforms.uRefracture.value = state.refracture;

      points.rotation.y =
        state.elapsed * 0.05 +
        state.fracture * 0.12 +
        state.refracture * 0.16 +
        state.veil * 0.04 -
        state.afterglow * 0.02;
    }
  };
}
