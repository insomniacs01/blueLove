import * as THREE from 'three';

const vertexShader = `
  attribute vec3 anchor;
  attribute vec3 direction;
  attribute float size;
  attribute float seed;
  attribute float tone;
  attribute float speed;
  attribute float reach;

  uniform float uTime;
  uniform float uPresence;
  uniform float uFracture;
  uniform float uReturn;
  uniform float uSpinAngle;
  uniform float uSpinCarry;
  uniform float uPixelRatio;

  varying float vAlpha;
  varying vec3 vColor;

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
    float life = fract(uTime * speed + seed);
    float fadeIn = smoothstep(0.0, 0.08, life);
    float fadeOut = 1.0 - smoothstep(0.36, 1.0, life);
    float release = smoothstep(0.0, 0.7, uPresence);
    float intensity = 0.02 + release * 0.14 + uFracture * 0.14 + uReturn * 0.05;

    vec3 position = anchor;
    position += direction * (life * reach * intensity);
    position.x += sin(life * 11.0 + seed * 21.0 + uTime * 2.4) * 0.018 * intensity;
    position.y += life * life * (0.08 + reach * 0.28) + sin(life * 7.0 + seed * 14.0) * 0.01 * intensity;
    position.z += cos(life * 9.0 + seed * 17.0 + uTime * 2.0) * 0.024 * intensity;
    position = rotateY(position, uSpinAngle * uSpinCarry * (0.04 + uReturn * 0.08 + uFracture * 0.03));

    float twinkle = sin(uTime * (2.0 + tone * 1.5) + seed * 31.0) * 0.5 + 0.5;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * uPixelRatio * (22.0 / -mvPosition.z) * (0.9 + twinkle * 0.36);
    gl_Position = projectionMatrix * mvPosition;

    vec3 cyan = vec3(0.62, 0.92, 1.0);
    vec3 pink = vec3(1.0, 0.72, 0.86);
    vec3 white = vec3(0.99, 0.99, 1.0);
    vColor = mix(pink, cyan, tone);
    vColor = mix(vColor, white, 0.34 + twinkle * 0.4);
    vAlpha = fadeIn * fadeOut * (0.005 + release * 0.05 + uFracture * 0.08 + uReturn * 0.035) * (0.48 + twinkle * 0.18);
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    float glow = smoothstep(0.5, 0.0, dist);
    float vertical = smoothstep(0.08, 0.0, abs(uv.x)) * smoothstep(0.5, 0.04, abs(uv.y));
    float horizontal = smoothstep(0.08, 0.0, abs(uv.y)) * smoothstep(0.5, 0.04, abs(uv.x));
    float alpha = glow * 0.26 + max(vertical, horizontal) * 0.22;

    if (alpha < 0.02) {
      discard;
    }

    gl_FragColor = vec4(vColor, alpha * vAlpha);
  }
`;

function heartPointAtAngle(angle) {
  const x = 16 * Math.pow(Math.sin(angle), 3) * 0.11;
  const y =
    (
      13 * Math.cos(angle) -
      5 * Math.cos(2 * angle) -
      2 * Math.cos(3 * angle) -
      Math.cos(4 * angle)
    ) * 0.105 +
    0.56;

  return new THREE.Vector2(x, y);
}

function createHeartOutline() {
  return Array.from({ length: 360 }, (_, index) => heartPointAtAngle((index / 360) * Math.PI * 2));
}

function pointInPolygon(x, y, polygon) {
  let inside = false;

  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
    const xi = polygon[current].x;
    const yi = polygon[current].y;
    const xj = polygon[previous].x;
    const yj = polygon[previous].y;

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

const HEART_OUTLINE = createHeartOutline();
const HEART_BOUNDS = HEART_OUTLINE.reduce(
  (bounds, point) => ({
    minX: Math.min(bounds.minX, point.x),
    maxX: Math.max(bounds.maxX, point.x),
    minY: Math.min(bounds.minY, point.y),
    maxY: Math.max(bounds.maxY, point.y)
  }),
  {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity
  }
);

const HEART_CENTER = new THREE.Vector2(
  (HEART_BOUNDS.minX + HEART_BOUNDS.maxX) * 0.5,
  (HEART_BOUNDS.minY + HEART_BOUNDS.maxY) * 0.5
);

const HEART_EXTENTS = new THREE.Vector2(
  (HEART_BOUNDS.maxX - HEART_BOUNDS.minX) * 0.5,
  (HEART_BOUNDS.maxY - HEART_BOUNDS.minY) * 0.5
);

const MAX_HEART_DEPTH = 0.48;

function gaussian(value, center, width) {
  return Math.exp(-Math.pow((value - center) / width, 2));
}

function computeHeartDepthRadius(localX, localY, edgeFactor) {
  const absX = Math.abs(localX);
  const core = Math.pow(Math.max(0, 1 - edgeFactor), 0.58);
  const edgeWrap = Math.pow(Math.max(0, 1 - edgeFactor * 0.92), 1.16);
  const lobeLift = gaussian(absX, 0.42, 0.24) * gaussian(localY, 0.48, 0.26);
  const chestLift = gaussian(localX, 0.0, 0.42) * gaussian(localY, 0.04, 0.42);
  const lowerLift = gaussian(localX, 0.0, 0.24) * gaussian(localY, -0.34, 0.34);
  const notchCut = gaussian(localX, 0.0, 0.16) * gaussian(localY, 0.62, 0.16);
  const upperCapTrim = gaussian(localX, 0.0, 0.24) * gaussian(localY, 0.82, 0.18);
  const tipFade = THREE.MathUtils.smoothstep(-0.18, -0.96, localY);
  const sideFade = THREE.MathUtils.smoothstep(0.72, 1.0, absX);

  let radius =
    0.048 +
    core * 0.2 +
    edgeWrap * 0.092 +
    lobeLift * 0.13 +
    chestLift * 0.112 +
    lowerLift * 0.032 -
    notchCut * 0.118 -
    upperCapTrim * 0.078;

  radius *= 1 - tipFade * 0.24;
  radius *= 1 - sideFade * 0.14;

  return THREE.MathUtils.clamp(radius, 0.026, MAX_HEART_DEPTH);
}

function sampleEmitterAnchor() {
  const useOutline = Math.random() < 0.38;

  if (useOutline) {
    const angle = Math.random() * Math.PI * 2;
    const point = heartPointAtAngle(angle);
    const tangentLead = heartPointAtAngle(angle + 0.018);
    const tangentTrail = heartPointAtAngle(angle - 0.018);
    const tangent = tangentLead.sub(tangentTrail).normalize();
    const normal = new THREE.Vector2(-tangent.y, tangent.x).normalize();

    if (normal.dot(HEART_CENTER.clone().sub(point)) < 0) {
      normal.multiplyScalar(-1);
    }

    const lifted = point
      .clone()
      .sub(HEART_CENTER)
      .multiplyScalar(THREE.MathUtils.lerp(0.9, 1.0, Math.pow(Math.random(), 0.3)))
      .add(HEART_CENTER)
      .add(tangent.multiplyScalar(THREE.MathUtils.randFloatSpread(0.026)))
      .add(normal.multiplyScalar(THREE.MathUtils.randFloat(-0.004, 0.024)));
    const localX = (lifted.x - HEART_CENTER.x) / HEART_EXTENTS.x;
    const localY = (lifted.y - HEART_CENTER.y) / HEART_EXTENTS.y;
    const edgeFactor = Math.min(1, Math.hypot(localX * 0.94, localY));
    const depthRadius = computeHeartDepthRadius(localX, localY, edgeFactor);

    return new THREE.Vector3(
      lifted.x,
      lifted.y,
      (Math.random() < 0.5 ? -1 : 1) * depthRadius * THREE.MathUtils.lerp(0.64, 0.98, Math.random())
    );
  }

  while (true) {
    const x = THREE.MathUtils.randFloat(HEART_BOUNDS.minX, HEART_BOUNDS.maxX);
    const y = THREE.MathUtils.randFloat(HEART_BOUNDS.minY, HEART_BOUNDS.maxY);

    if (!pointInPolygon(x, y, HEART_OUTLINE)) {
      continue;
    }

    const normalizedX = (x - HEART_CENTER.x) / HEART_EXTENTS.x;
    const normalizedY = (y - HEART_CENTER.y) / HEART_EXTENTS.y;
    const edgeFactor = Math.min(1, Math.hypot(normalizedX * 0.94, normalizedY));
    const volumeBias =
      0.2 +
      Math.pow(Math.max(0, 1 - edgeFactor), 0.65) * 0.26 +
      gaussian(Math.abs(normalizedX), 0.36, 0.28) * gaussian(normalizedY, 0.42, 0.28) * 0.2 +
      gaussian(normalizedX, 0.0, 0.42) * gaussian(normalizedY, 0.02, 0.42) * 0.16;

    if (Math.random() > volumeBias) {
      continue;
    }

    const depthRadius = computeHeartDepthRadius(normalizedX, normalizedY, edgeFactor);
    return new THREE.Vector3(
      x,
      y,
      (Math.random() < 0.5 ? -1 : 1) * depthRadius * Math.pow(Math.random(), 0.42)
    );
  }
}

export function createHeartStarfield() {
  const count = 220;
  const geometry = new THREE.BufferGeometry();
  const position = new Float32Array(count * 3);
  const anchor = new Float32Array(count * 3);
  const direction = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);
  const tone = new Float32Array(count);
  const speed = new Float32Array(count);
  const reach = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const point = sampleEmitterAnchor();
    const localX = (point.x - HEART_CENTER.x) / HEART_EXTENTS.x;
    const localY = (point.y - HEART_CENTER.y) / HEART_EXTENTS.y;
    const outward = new THREE.Vector3(
      localX * 0.92 + THREE.MathUtils.randFloatSpread(0.16),
      localY * 0.72 + 0.52 + Math.random() * 0.38,
      point.z * 1.45 + THREE.MathUtils.randFloatSpread(0.18)
    ).normalize();

    position[index * 3] = point.x;
    position[index * 3 + 1] = point.y;
    position[index * 3 + 2] = point.z;

    anchor[index * 3] = point.x;
    anchor[index * 3 + 1] = point.y;
    anchor[index * 3 + 2] = point.z;

    direction[index * 3] = outward.x;
    direction[index * 3 + 1] = outward.y;
    direction[index * 3 + 2] = outward.z;

    size[index] = 0.24 + Math.random() * 0.74;
    seed[index] = Math.random();
    tone[index] = Math.random();
    speed[index] = THREE.MathUtils.randFloat(0.16, 0.36);
    reach[index] = THREE.MathUtils.randFloat(0.08, 0.38);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('anchor', new THREE.BufferAttribute(anchor, 3));
  geometry.setAttribute('direction', new THREE.BufferAttribute(direction, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(size, 1));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  geometry.setAttribute('tone', new THREE.BufferAttribute(tone, 1));
  geometry.setAttribute('speed', new THREE.BufferAttribute(speed, 1));
  geometry.setAttribute('reach', new THREE.BufferAttribute(reach, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPresence: { value: 0 },
      uFracture: { value: 0 },
      uReturn: { value: 0 },
      uSpinAngle: { value: 0 },
      uSpinCarry: { value: 0 },
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
      material.uniforms.uPresence.value = state.heartPresence + state.yearning * 0.08 + state.afterglow * 0.14;
      material.uniforms.uFracture.value = state.fracture;
      material.uniforms.uReturn.value = state.repair;
      material.uniforms.uSpinAngle.value = state.spinAngle;
      material.uniforms.uSpinCarry.value = state.spinCarry;

      const pulse =
        1 +
        Math.sin(state.elapsed * 2.0) * 0.018 +
        state.repair * 0.016 +
        state.afterglow * 0.024;
      points.scale.setScalar(pulse);
      points.rotation.z = Math.sin(state.elapsed * 0.12) * 0.02 - state.veil * 0.01 + state.afterglow * 0.012;
    }
  };
}
