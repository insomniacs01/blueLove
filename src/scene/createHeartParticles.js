import * as THREE from 'three';

const vertexShader = `
  attribute vec3 home;
  attribute vec3 vortex;
  attribute vec3 shatter;
  attribute vec3 flow;
  attribute float size;
  attribute float seed;
  attribute float tone;
  attribute float shell;
  attribute float rim;
  attribute float depthBand;
  attribute float glowBias;
  attribute float accentBias;
  attribute float cavity;

  uniform float uTime;
  uniform float uAssemble;
  uniform float uFracture;
  uniform float uReturn;
  uniform float uChaos;
  uniform float uPulse;
  uniform float uSpinAngle;
  uniform float uSpinCarry;
  uniform float uSurge;
  uniform float uSurgeProgress;
  uniform float uRefracture;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vHighlight;
  varying float vLighting;
  varying float vBodyGlow;

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
    float shimmer = sin(uTime * 3.8 + phase * 12.0) * 0.5 + 0.5;
    float contour = clamp(mix(pow(1.0 - shell, 0.84), 0.9, rim * 0.56), 0.0, 1.0);
    float volumeLight = 1.0 - depthBand;
    float beamAxis = mix(-0.08, 0.1, smoothstep(0.06, 0.9, uSurgeProgress));
    float beamLift = mix(-0.56, 0.36, smoothstep(0.0, 1.0, uSurgeProgress));

    vec3 normalSource = vec3(home.x * 0.96, (home.y - 0.18) * 0.84, home.z * 1.36);
    vec3 normalDir = normalize(normalSource + vec3(0.001, 0.002, 0.001));
    vec3 flowAxis = normalize(flow + vec3(0.0001, 0.0002, 0.0001));
    vec3 orbitAxis = normalize(cross(normalDir, flowAxis) + vec3(0.0001, 0.0002, 0.0001));
    float impactColumn =
      exp(-pow((home.x - beamAxis) / 0.28, 2.0)) *
      exp(-pow((home.y - beamLift) / 0.36, 2.0));
    float leftWing = smoothstep(-0.72, -0.04, home.x) * smoothstep(-0.16, 1.0, home.y);
    float rightWing = smoothstep(0.0, 0.78, home.x) * smoothstep(-0.16, 1.0, home.y);
    float splitBias = rightWing - leftWing * 0.72;
    float surgePass = smoothstep(0.0, 0.14, uSurgeProgress) * uSurge;
    float stability = smoothstep(0.72, 1.0, uAssemble) * (1.0 - uFracture * 0.82);
    float flowPresence = clamp(stability * mix(0.22, 0.5, contour) + contour * 0.06 + volumeLight * 0.08 + glowBias * 0.12 + uReturn * 0.22, 0.0, 1.0);
    float flowRadius = mix(0.0012, 0.013, contour) * mix(0.7, 0.96, rim) * mix(0.74, 0.98, volumeLight) * (0.88 + tone * 0.1);
    float flowSpin = uTime * (1.08 + contour * 1.28 + tone * 0.18) + phase * 9.4;
    float flowGlow = (sin(flowSpin * 1.02 + tone * 4.2) * 0.5 + 0.5) * flowPresence * (0.24 + contour * 0.58);

    vec3 assembled = home * uPulse;
    assembled += flowAxis * sin(flowSpin) * flowRadius * flowPresence;
    assembled += orbitAxis * cos(flowSpin * 1.05 + contour * 3.2) * flowRadius * mix(0.4, 0.78, contour) * flowPresence;
    assembled += normalDir * sin(flowSpin * 0.62 + phase * 4.0) * flowRadius * mix(0.1, 0.22, rim) * flowPresence;
    assembled += normalDir * (0.012 + shell * 0.02 + rim * 0.024 + volumeLight * 0.012) * shimmer;
    assembled += normalDir * glowBias * (0.016 + volumeLight * 0.02) * (0.45 + shimmer * 0.55);
    assembled += normalDir * impactColumn * surgePass * (0.05 + volumeLight * 0.06 + rim * 0.04);
    assembled.y += impactColumn * surgePass * (0.08 + contour * 0.06);
    assembled +=
      vec3(splitBias * 0.06, (0.02 + rightWing * 0.02) * sign(splitBias + 0.0001), splitBias * 0.04) *
      surgePass *
      (0.14 + impactColumn * 0.42);
    assembled.y += sin(uTime * 1.8 + phase * 6.0) * mix(0.012, 0.026, shell + rim * 0.16 + volumeLight * 0.12);
    assembled = rotateY(
      assembled,
      uSpinAngle * uSpinCarry * (0.12 + uFracture * 0.24 + uReturn * 0.68)
    );

    vec3 spiral = vortex;
    float spiralRadius = length(vortex.xz) * mix(1.25, 0.56, uAssemble);
    float spin = uTime * (1.1 + shell * 1.6 + uChaos * 1.2) + phase * 14.0;
    spiral.x = cos(spin) * spiralRadius;
    spiral.z = sin(spin) * spiralRadius * (0.72 + shell * 0.15);
    spiral.y += sin(uTime * 2.2 + phase * 7.0) * 0.16 * (1.0 - uAssemble);
    spiral = rotateY(spiral, sin(uTime * 0.7 + phase * 3.0) * uChaos * 0.5);
    spiral = rotateY(spiral, uSpinAngle * uSpinCarry * 0.22);

    float fractureEnergy = uFracture + uRefracture * (0.42 + impactColumn * 0.58);
    vec3 broken = home + shatter * (0.28 + fractureEnergy * (1.05 + shell * 1.9));
    broken += normalDir * sin(uTime * 6.5 + phase * 18.0) * mix(0.035, 0.08, contour) * uFracture;
    broken +=
      vec3(home.x * 0.22, 0.42 + volumeLight * 0.34 + shell * 0.18, home.z * 0.28) *
      uRefracture *
      uSurgeProgress *
      (0.34 + impactColumn * 1.12);
    broken +=
      vec3(
        -0.18 * leftWing + 0.24 * rightWing,
        0.08 * leftWing + 0.2 * rightWing,
        -0.12 * leftWing + 0.16 * rightWing
      ) *
      uRefracture *
      uSurgeProgress *
      (0.18 + impactColumn * 0.96);
    broken += normalDir * uRefracture * (0.08 + impactColumn * 0.18 + contour * 0.05);
    broken += flowAxis * splitBias * uRefracture * (0.04 + impactColumn * 0.08);
    broken = rotateY(
      broken,
      (uTime * 0.85 + phase * 3.0) *
      clamp(uFracture + uRefracture * 0.74, 0.0, 1.0) *
      (0.22 + shell * 0.28)
    );
    broken = rotateY(
      broken,
      uSpinAngle * uSpinCarry * (0.42 + uFracture * 0.86 + uReturn * 0.54)
    );

    vec3 position = mix(spiral, assembled, uAssemble);
    float fractureMix = clamp(
      uFracture * 0.68 + uRefracture * (0.24 + impactColumn * 0.54 + rightWing * 0.14 + leftWing * 0.06),
      0.0,
      1.0
    );
    float returnGrip = clamp(uReturn * (1.0 - uRefracture * (0.74 + rightWing * 0.12)), 0.0, 1.0);
    position = mix(position, broken, fractureMix);
    position = mix(position, assembled, returnGrip);
    position.y += (1.0 - uAssemble) * smoothstep(-2.3, 0.45, spiral.y) * 0.85;
    float frontness = clamp(position.z / 0.72 + 0.5, 0.0, 1.0);
    float depthShade = mix(0.64, 1.08, frontness);
    float frontBloom = smoothstep(0.58, 1.0, frontness);
    float accentPulse = sin(uTime * (1.2 + accentBias * 0.8) + phase * 15.0) * 0.5 + 0.5;
    float accentGlow = accentBias * mix(0.34, 1.0, smoothstep(0.22, 0.96, accentPulse));
    float highlight = clamp(glowBias * 0.46 + accentGlow * 0.92, 0.0, 1.0);
    vec3 keyLightDir = normalize(vec3(0.34 + sin(uTime * 0.21) * 0.12, 0.4 + cos(uTime * 0.17) * 0.05, 1.0));
    vec3 fillLightDir = normalize(vec3(-0.88, 0.06, 0.68));
    vec3 rimLightDir = normalize(vec3(-0.58, 0.26, -0.8));
    vec3 viewDir = normalize(vec3(0.0, 0.08, 1.0));
    float keyDiffuse = max(dot(normalDir, keyLightDir), 0.0);
    float fillDiffuse = max(dot(normalDir, fillLightDir), 0.0);
    float rimLight = pow(1.0 - clamp(dot(normalDir, viewDir), 0.0, 1.0), 2.6);
    float backRim = max(dot(normalDir, rimLightDir), 0.0) * rimLight;
    float halfVector = max(dot(normalDir, normalize(keyLightDir + viewDir)), 0.0);
    float specular = pow(halfVector, mix(8.0, 18.0, contour)) * (0.2 + contour * 0.4 + glowBias * 0.24);
    float lightSpace = dot(position, normalize(vec3(-0.58, 0.14, 0.82)));
    float castShadow = smoothstep(0.38, -0.72, lightSpace);
    float cavityShadow = cavity * (0.34 + castShadow * 0.44 + (1.0 - keyDiffuse) * 0.26);
    float rearShadow = (1.0 - frontness) * (0.22 + depthBand * 0.32);
    float leftCurtain =
      exp(-pow((home.x + 0.36) / 0.26, 2.0)) *
      exp(-pow((home.y - 0.18) / 0.8, 2.0)) *
      (0.42 + frontness * 0.16);
    float coreMist =
      exp(-pow(home.x / 0.42, 2.0)) *
      exp(-pow((home.y - 0.04) / 0.74, 2.0)) *
      (0.12 + volumeLight * 0.08);
    float crownGlow = exp(-pow(home.x / 0.18, 2.0)) * exp(-pow((home.y - 1.0) / 0.16, 2.0)) * 0.12;
    float lowerLift = exp(-pow(home.x / 0.28, 2.0)) * exp(-pow((home.y + 0.54) / 0.22, 2.0)) * 0.08;
    float bodyGlow = clamp(
      (leftCurtain * 0.34 + coreMist * 0.16 + crownGlow + lowerLift) * stability +
        impactColumn * surgePass * 0.32,
      0.0,
      0.68
    );
    float lighting =
      0.24 +
      keyDiffuse * 0.88 +
      fillDiffuse * 0.42 +
      rimLight * (0.08 + contour * 0.12) +
      backRim * (0.24 + uFracture * 0.12) +
      bodyGlow * 0.24 +
      specular * (0.24 + highlight * 0.54) -
      cavityShadow * 0.16 -
      rearShadow * 0.04;
    lighting = clamp(lighting, 0.2, 1.95);
    float glowEdge = rimLight * (0.14 + rim * 0.3 + glowBias * 0.18);
    float keyMask = clamp(keyDiffuse * 0.76 + fillDiffuse * 0.44 + frontness * 0.16 + bodyGlow * 0.22, 0.0, 1.0);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize =
      size *
      uPixelRatio *
      (29.0 / -mvPosition.z) *
      1.08 *
      mix(0.94, 1.16, frontness) *
      mix(0.96, 1.28, glowBias) *
      mix(0.94, 1.24, keyMask) *
      mix(1.0, 1.08, bodyGlow) *
      mix(1.0, 1.34, highlight + specular * 0.5);
    gl_Position = projectionMatrix * mvPosition;

    vec3 shadowPlum = vec3(0.17, 0.11, 0.28);
    vec3 shadowBlue = vec3(0.16, 0.22, 0.46);
    vec3 blue = vec3(0.54, 0.93, 1.0);
    vec3 cyan = vec3(0.7, 0.96, 1.0);
    vec3 lilac = vec3(0.86, 0.82, 1.0);
    vec3 blush = vec3(1.0, 0.74, 0.86);
    vec3 white = vec3(0.98, 0.99, 1.0);
    vec3 shadowBase = mix(shadowPlum, shadowBlue, tone * (0.72 + volumeLight * 0.28));
    vec3 litBase = mix(vec3(0.46, 0.54, 1.0), blue, tone * (0.78 + volumeLight * 0.22));
    vColor = mix(shadowBase, litBase, keyMask);
    vColor = mix(vColor, lilac, leftCurtain * 0.28 + bodyGlow * 0.1);
    vColor = mix(vColor, cyan, shimmer * 0.04 + contour * 0.04 + rim * 0.06 + volumeLight * 0.1 + flowGlow * (0.08 + contour * 0.12) + frontBloom * 0.08);
    vColor = mix(vColor, blush, backRim * 0.18 + accentGlow * 0.1 + impactColumn * surgePass * 0.18);
    vColor = mix(vColor, white, bodyGlow * 0.06 + specular * (0.24 + highlight * 0.52) + glowEdge * 0.34 + accentGlow * (0.16 + frontBloom * 0.16) + impactColumn * surgePass * 0.2);
    vColor *= lighting * depthShade * 1.02;
    vAlpha = mix(0.14, 0.68, uAssemble) * (0.78 + shimmer * 0.14 + rim * 0.14 + volumeLight * 0.38 + uFracture * 0.2 + flowGlow * (0.08 + contour * 0.12));
    vAlpha *= mix(1.0, 0.86, shell * uFracture);
    vAlpha *= mix(0.46, 1.12, frontness) * mix(0.56, 1.18, lighting);
    vAlpha *= mix(1.0, 0.9, cavity * 0.24);
    vAlpha += contour * uAssemble * 0.03 + rim * uAssemble * 0.06 + volumeLight * uAssemble * 0.1 + flowGlow * contour * 0.08 + frontBloom * stability * 0.08 + glowBias * (0.06 + frontBloom * 0.05) + accentGlow * (0.12 + frontBloom * 0.1) + glowEdge * 0.1 + specular * 0.14 + bodyGlow * 0.08 + impactColumn * surgePass * 0.14;
    vHighlight = clamp(specular + glowEdge * 0.56 + accentGlow * 0.42, 0.0, 1.0);
    vLighting = lighting;
    vBodyGlow = clamp(bodyGlow, 0.0, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vHighlight;
  varying float vLighting;
  varying float vBodyGlow;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    float glow = smoothstep(0.56, 0.0, dist);
    float core = smoothstep(0.2, 0.0, dist);
    float hotspot = smoothstep(0.24, 0.0, length(uv - vec2(-0.08, 0.08)));
    float softHalo = smoothstep(0.72, 0.0, dist);
    float alpha =
      glow * mix(0.22, 0.36, clamp(vLighting * 0.7, 0.0, 1.0)) +
      core * 0.3 +
      hotspot * vHighlight * 0.22 +
      softHalo * vBodyGlow * 0.06;

    if (alpha < 0.025) {
      discard;
    }

    vec3 color = vColor * (0.5 + core * 0.9 + softHalo * vBodyGlow * 0.06 + hotspot * (0.18 + vHighlight * 0.46));
    gl_FragColor = vec4(color, alpha * vAlpha);
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

function randomUnitVector() {
  const vector = new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(2),
    THREE.MathUtils.randFloatSpread(2),
    THREE.MathUtils.randFloatSpread(2)
  );

  return vector.normalize();
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

function sampleDepthOffset(radius, shellBias = 0.3) {
  const sign = Math.random() < 0.5 ? -1 : 1;
  const coreFill = Math.pow(Math.random(), 1.38);
  const surfaceWrap = Math.pow(Math.random(), 0.62);
  const layered = THREE.MathUtils.lerp(coreFill, surfaceWrap, shellBias);
  return sign * radius * layered;
}

function sampleHeartVolumePoint() {
  while (true) {
    const x = THREE.MathUtils.randFloat(HEART_BOUNDS.minX, HEART_BOUNDS.maxX);
    const y = THREE.MathUtils.randFloat(HEART_BOUNDS.minY, HEART_BOUNDS.maxY);

    if (!pointInPolygon(x, y, HEART_OUTLINE)) {
      continue;
    }

    const normalizedX = (x - HEART_CENTER.x) / HEART_EXTENTS.x;
    const normalizedY = (y - HEART_CENTER.y) / HEART_EXTENTS.y;
    const edgeFactor = Math.min(1, Math.hypot(normalizedX * 0.94, normalizedY));
    const lobeFill = gaussian(Math.abs(normalizedX), 0.4, 0.3) * gaussian(normalizedY, 0.44, 0.3);
    const chestFill = gaussian(normalizedX, 0.0, 0.46) * gaussian(normalizedY, 0.02, 0.48);
    const centerMass = Math.pow(Math.max(0, 1 - edgeFactor), 0.72);
    const volumeBias =
      0.18 +
      centerMass * 0.14 +
      lobeFill * 0.24 +
      chestFill * 0.12 +
      Math.pow(edgeFactor, 1.08) * 0.18;
    if (Math.random() > volumeBias) {
      continue;
    }

    if (normalizedY > 0.5 && Math.abs(normalizedX) < 0.16 && Math.random() < 0.58) {
      continue;
    }

    const depthRadius = computeHeartDepthRadius(normalizedX, normalizedY, edgeFactor);
    const z = sampleDepthOffset(depthRadius, THREE.MathUtils.lerp(0.18, 0.34, edgeFactor));

    return new THREE.Vector3(x, y, z);
  }
}

function sampleOutlineHeartPoint() {
  const angle = Math.random() * Math.PI * 2;
  const point = heartPointAtAngle(angle);
  const tangentLead = heartPointAtAngle(angle + 0.018);
  const tangentTrail = heartPointAtAngle(angle - 0.018);
  const tangent = tangentLead.sub(tangentTrail).normalize();
  const normal = new THREE.Vector2(-tangent.y, tangent.x).normalize();

  if (normal.dot(HEART_CENTER.clone().sub(point)) < 0) {
    normal.multiplyScalar(-1);
  }

  const radialFactor = THREE.MathUtils.lerp(0.95, 1.0, Math.pow(Math.random(), 0.42));
  const tangentDrift = THREE.MathUtils.randFloatSpread(0.032);
  const normalDrift = THREE.MathUtils.randFloat(-0.006, 0.026);
  const lifted = point.clone().sub(HEART_CENTER).multiplyScalar(radialFactor).add(HEART_CENTER);
  const final2D = lifted.add(tangent.multiplyScalar(tangentDrift)).add(normal.multiplyScalar(normalDrift));
  const localX = (final2D.x - HEART_CENTER.x) / HEART_EXTENTS.x;
  const localY = (final2D.y - HEART_CENTER.y) / HEART_EXTENTS.y;
  const edgeFactor = Math.min(1, Math.hypot(localX * 0.94, localY));
  const outlineDepth = computeHeartDepthRadius(localX, localY, edgeFactor) * THREE.MathUtils.lerp(0.18, 0.32, Math.random());

  return new THREE.Vector3(
    final2D.x,
    final2D.y,
    sampleDepthOffset(outlineDepth, 0.72)
  );
}

export function createHeartParticles() {
  const count = 26000;
  const shellCount = 9600;
  const volumeCount = 13600;
  const positions = new Float32Array(count * 3);
  const home = new Float32Array(count * 3);
  const vortex = new Float32Array(count * 3);
  const shatter = new Float32Array(count * 3);
  const flow = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);
  const tone = new Float32Array(count);
  const shell = new Float32Array(count);
  const rim = new Float32Array(count);
  const depthBand = new Float32Array(count);
  const glowBias = new Float32Array(count);
  const accentBias = new Float32Array(count);
  const cavity = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const isShell = index < shellCount;
    const isVolume = index >= shellCount && index < shellCount + volumeCount;
    const point = isShell ? sampleOutlineHeartPoint() : sampleHeartVolumePoint();
    const localX = (point.x - HEART_CENTER.x) / HEART_EXTENTS.x;
    const localY = (point.y - HEART_CENTER.y) / HEART_EXTENTS.y;
    const edgeFactor = Math.min(1, Math.hypot(localX * 0.94, localY));
    const centerFactor = 1 - edgeFactor;
    const thicknessNorm = THREE.MathUtils.clamp(Math.abs(point.z) / MAX_HEART_DEPTH, 0, 1);
    const shellFactor = THREE.MathUtils.clamp(1.0 - (edgeFactor * 0.68 + thicknessNorm * 0.38), 0, 1);
    const rimFactor = isShell ? THREE.MathUtils.lerp(0.44, 0.68, Math.random()) : Math.pow(edgeFactor, 1.02) * 0.26 + thicknessNorm * 0.14;
    const depthFactor = isShell ? THREE.MathUtils.lerp(0.42, 0.66, Math.random()) : isVolume ? THREE.MathUtils.lerp(0.1, 0.52, Math.random()) : THREE.MathUtils.lerp(0.02, 0.24, Math.random());
    const coreGlow = gaussian(localX, 0.0, 0.28) * gaussian(localY, 0.04, 0.34) * (1 - thicknessNorm * 0.35);
    const lobeGlow = gaussian(Math.abs(localX), 0.26, 0.16) * gaussian(localY, 0.4, 0.2);
    const tipGlow = gaussian(localX, 0.0, 0.15) * gaussian(localY, -0.78, 0.18);
    const sparkleMix = THREE.MathUtils.lerp(0.42, 1.0, Math.pow(Math.random(), isShell ? 2.2 : 1.85));
    const glowFactor = THREE.MathUtils.clamp(
      (coreGlow * 0.46 + lobeGlow * 0.4 + tipGlow * 0.24 + centerFactor * 0.04) * sparkleMix,
      0,
      1
    );
    const innerRibbon =
      gaussian(localX + localY * 0.18, -0.02, 0.17) *
      gaussian(localY, -0.02, 0.44) *
      (1 - edgeFactor * 0.72);
    const leftPocket = gaussian(localX, -0.18, 0.14) * gaussian(localY, 0.18, 0.18);
    const rightPocket = gaussian(localX, 0.16, 0.18) * gaussian(localY, -0.16, 0.24);
    const notchAura = gaussian(localX, 0.0, 0.1) * gaussian(localY, 0.58, 0.1);
    const notchShadow = gaussian(localX, 0.0, 0.12) * gaussian(localY, 0.56, 0.12);
    const cleftShadow = gaussian(localX, 0.0, 0.18) * gaussian(localY, 0.42, 0.18);
    const chestShadow = gaussian(localX, 0.0, 0.26) * gaussian(localY, 0.08, 0.3) * (1 - edgeFactor * 0.7);
    const flankPocket = gaussian(Math.abs(localX), 0.34, 0.12) * gaussian(localY, 0.08, 0.24) * (1 - thicknessNorm * 0.25);
    const accentFactor = THREE.MathUtils.clamp(
      (innerRibbon * 0.62 + leftPocket * 0.3 + rightPocket * 0.18 + notchAura * 0.2) *
        THREE.MathUtils.lerp(0.34, 1.0, Math.pow(Math.random(), isShell ? 2.4 : 1.6)) *
        (isShell ? 0.26 : 0.82),
      0,
      1
    );
    const cavityFactor = THREE.MathUtils.clamp(
      notchShadow * 0.9 + cleftShadow * 0.48 + chestShadow * 0.34 + flankPocket * 0.18 + thicknessNorm * 0.16,
      0,
      1
    );

    const spiralRadius = 0.18 + Math.random() * 2.1;
    const spiralAngle = Math.random() * Math.PI * 2;
    const spiralHeight = -2.4 + Math.random() * 4.8;
    const outward = new THREE.Vector3(localX, localY * 0.92, point.z * 0.45).normalize();
    const scatterVector = outward.multiplyScalar((isShell ? 0.86 : 0.62) + Math.random() * (isShell ? 1.7 : 1.35));
    const flowVector = new THREE.Vector3(
      localY * 1.15 + Math.sin(localY * Math.PI * 1.4) * 0.12,
      -localX * 1.24 + Math.cos(localX * Math.PI * 1.2) * 0.08,
      point.z * 0.72 + Math.sin(localX * Math.PI * 1.7) * 0.26 + localY * 0.14
    );

    if (flowVector.lengthSq() < 1e-5) {
      flowVector.set(0.0, -1.0, 0.12);
    } else {
      flowVector.normalize();
    }

    scatterVector.add(randomUnitVector().multiplyScalar((isShell ? 0.18 : 0.1) + Math.random() * (isShell ? 0.5 : 0.34)));
    scatterVector.y += THREE.MathUtils.randFloat(-0.08, isShell ? 0.48 : 0.34) + edgeFactor * 0.04;

    positions[index * 3] = point.x;
    positions[index * 3 + 1] = point.y;
    positions[index * 3 + 2] = point.z;

    home[index * 3] = point.x;
    home[index * 3 + 1] = point.y;
    home[index * 3 + 2] = point.z;

    vortex[index * 3] = Math.cos(spiralAngle) * spiralRadius;
    vortex[index * 3 + 1] = spiralHeight;
    vortex[index * 3 + 2] = Math.sin(spiralAngle) * spiralRadius * 0.7;

    shatter[index * 3] = scatterVector.x;
    shatter[index * 3 + 1] = scatterVector.y;
    shatter[index * 3 + 2] = scatterVector.z;

    flow[index * 3] = flowVector.x;
    flow[index * 3 + 1] = flowVector.y;
    flow[index * 3 + 2] = flowVector.z;

    size[index] =
      (isShell ? 0.24 : isVolume ? 0.2 : 0.15) +
      Math.pow(Math.random(), isShell ? 0.68 : 0.82) * (isShell ? 0.74 : isVolume ? 0.56 : 0.32) +
      depthFactor * (isShell ? 0.16 : isVolume ? 0.12 : 0.08) +
      glowFactor * (isShell ? 0.04 : isVolume ? 0.06 : 0.04) +
      accentFactor * (isShell ? 0.02 : isVolume ? 0.06 : 0.04);
    seed[index] = Math.random();
    tone[index] = THREE.MathUtils.clamp(0.44 + localX * 0.08 + centerFactor * 0.1 + depthFactor * 0.14 + glowFactor * 0.08 + accentFactor * 0.06 + Math.random() * 0.12, 0, 1);
    shell[index] = shellFactor;
    rim[index] = rimFactor;
    depthBand[index] = depthFactor;
    glowBias[index] = glowFactor;
    accentBias[index] = accentFactor;
    cavity[index] = cavityFactor;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('home', new THREE.BufferAttribute(home, 3));
  geometry.setAttribute('vortex', new THREE.BufferAttribute(vortex, 3));
  geometry.setAttribute('shatter', new THREE.BufferAttribute(shatter, 3));
  geometry.setAttribute('flow', new THREE.BufferAttribute(flow, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(size, 1));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  geometry.setAttribute('tone', new THREE.BufferAttribute(tone, 1));
  geometry.setAttribute('shell', new THREE.BufferAttribute(shell, 1));
  geometry.setAttribute('rim', new THREE.BufferAttribute(rim, 1));
  geometry.setAttribute('depthBand', new THREE.BufferAttribute(depthBand, 1));
  geometry.setAttribute('glowBias', new THREE.BufferAttribute(glowBias, 1));
  geometry.setAttribute('accentBias', new THREE.BufferAttribute(accentBias, 1));
  geometry.setAttribute('cavity', new THREE.BufferAttribute(cavity, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uAssemble: { value: 0 },
      uFracture: { value: 0 },
      uReturn: { value: 0 },
      uChaos: { value: 0 },
      uPulse: { value: 1 },
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
      material.uniforms.uAssemble.value = state.birth;
      material.uniforms.uFracture.value = state.fracture;
      material.uniforms.uReturn.value = state.repair;
      material.uniforms.uChaos.value = state.swirl;
      material.uniforms.uPulse.value =
        1 +
        Math.sin(state.elapsed * 2.2) * (0.024 + state.heartbeat * 0.018) +
        Math.sin(state.elapsed * 4.6 + 0.8) * 0.016 +
        state.yearning * 0.012 +
        state.afterglow * 0.02;
      material.uniforms.uSpinAngle.value = state.spinAngle;
      material.uniforms.uSpinCarry.value = state.spinCarry;
      material.uniforms.uSurge.value = state.surge;
      material.uniforms.uSurgeProgress.value = state.surgeProgress;
      material.uniforms.uRefracture.value = state.refracture;

      points.rotation.y =
        Math.sin(state.elapsed * 0.16) * (0.02 + state.yearning * 0.014) +
        state.fracture * 0.16 +
        state.refracture * 0.1 -
        state.reunion * 0.025;
      points.rotation.z = Math.sin(state.elapsed * 0.08) * 0.012 - state.veil * 0.008 + state.afterglow * 0.01;
    }
  };
}
