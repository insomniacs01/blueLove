import * as THREE from 'three';

const GLYPH_CHAR = '\u8881';
const GLYPH_MASK_FONT =
  '700 358px "Songti SC", "STSong", "Kaiti SC", "STKaiti", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Microsoft YaHei", serif';
const GLYPH_GUIDE_FONT =
  '600 344px "Songti SC", "STSong", "Kaiti SC", "STKaiti", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Microsoft YaHei", serif';

const burstVertexShader = `
  attribute vec3 origin;
  attribute vec3 center;
  attribute vec3 direction;
  attribute float spread;
  attribute float size;
  attribute float seed;
  attribute float tone;
  attribute float delay;
  attribute float lift;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uLaunch;
  uniform float uBurst;
  uniform float uFade;

  varying float vAlpha;
  varying vec3 vColor;
  varying float vSpark;

  void main() {
    float launch = clamp((uLaunch * 1.24 - delay * 0.32) / max(0.001, 1.0 - delay * 0.32), 0.0, 1.0);
    float burst = clamp((uBurst * 1.22 - delay * 0.56) / max(0.001, 1.0 - delay * 0.56), 0.0, 1.0);
    float burstEase = smoothstep(0.02, 0.42, burst);
    float burstArc = sin(burstEase * 3.14159265);

    vec3 ascent = mix(origin, center, smoothstep(0.0, 0.94, launch));
    ascent.x += sin(uTime * 4.2 + seed * 23.0) * 0.07 * (1.0 - launch);
    ascent.z += cos(uTime * 3.8 + seed * 17.0) * 0.08 * (1.0 - launch);

    vec3 exploded = center + direction * spread * burstEase;
    exploded.y += burstArc * lift - burstEase * burstEase * (0.58 + spread * 0.08);
    exploded.x += sin(uTime * 5.4 + seed * 31.0) * 0.06 * burstArc;
    exploded.z += cos(uTime * 4.8 + seed * 27.0) * 0.08 * burstArc;

    vec3 position = mix(ascent, exploded, burstEase);

    float twinkle = sin(uTime * (6.4 + tone * 2.2) + seed * 41.0) * 0.5 + 0.5;
    float launchGlow =
      smoothstep(0.02, 0.22, launch) *
      (1.0 - smoothstep(0.42, 0.9, launch)) *
      (0.06 + twinkle * 0.03);
    float burstGlow =
      burstArc *
      (1.0 - smoothstep(0.68, 1.0, burst)) *
      (0.56 + twinkle * 0.28);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize =
      size *
      uPixelRatio *
      (36.0 / -mvPosition.z) *
      (1.02 + burstGlow * 0.72 + twinkle * 0.22);
    gl_Position = projectionMatrix * mvPosition;

    vec3 cyan = vec3(0.58, 0.92, 1.0);
    vec3 blush = vec3(1.0, 0.72, 0.84);
    vec3 violet = vec3(0.82, 0.76, 1.0);
    vec3 white = vec3(1.0, 0.99, 1.0);
    vColor = mix(violet, cyan, tone);
    vColor = mix(vColor, blush, 0.18 + burstGlow * 0.34);
    vColor = mix(vColor, white, 0.28 + twinkle * 0.22 + burstGlow * 0.3);
    vSpark = clamp(burstGlow + launchGlow * 0.12, 0.0, 1.0);
    vAlpha = (launchGlow * 0.08 + burstGlow * 0.92) * (1.0 - uFade * 0.82) * (0.74 + tone * 0.2);
  }
`;

const burstFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  varying float vSpark;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    float glow = smoothstep(0.56, 0.0, dist);
    float core = smoothstep(0.18, 0.0, dist);
    float flareA = smoothstep(0.05, 0.0, abs(uv.x)) * smoothstep(0.52, 0.0, abs(uv.y));
    float flareB = smoothstep(0.05, 0.0, abs(uv.y)) * smoothstep(0.52, 0.0, abs(uv.x));
    float alpha = glow * (0.42 + vSpark * 0.26) * vAlpha + core * 0.36 * vAlpha + max(flareA, flareB) * vSpark * 0.24 * vAlpha;

    if (alpha < 0.01) {
      discard;
    }

    gl_FragColor = vec4(vColor * (0.76 + core * 0.58 + vSpark * 0.32), alpha);
  }
`;

const glyphVertexShader = `
  attribute vec3 target;
  attribute vec3 source;
  attribute vec3 drift;
  attribute float size;
  attribute float seed;
  attribute float tone;
  attribute float delay;
  attribute float flare;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uRain;
  uniform float uReveal;
  uniform float uHold;
  uniform float uFade;
  uniform float uLayer;

  varying float vAlpha;
  varying vec3 vColor;
  varying float vSpark;

  void main() {
    float rain = clamp((uRain * 1.16 - delay) / max(0.001, 1.0 - delay), 0.0, 1.0);
    float settle = smoothstep(0.02, 0.84, rain);
    float holdSpark = sin(uTime * (3.0 + flare * 1.4) + seed * 57.0) * 0.5 + 0.5;
    float layerMix = smoothstep(0.0, 1.0, uLayer);

    vec3 position = mix(source, target, settle);
    float driftLift = (1.0 - settle) * (1.45 + delay * 0.9);
    position.y += driftLift;
    position += drift * (1.0 - settle) * (0.76 + (1.0 - rain) * 0.22);
    position.x += sin(uTime * 2.7 + seed * 21.0) * (1.0 - settle) * (0.18 + abs(drift.x) * 0.12);
    position.z += cos(uTime * 3.1 + seed * 17.0) * (1.0 - settle) * (0.22 + abs(drift.z) * 0.14);
    position.x += sin(uTime * 1.8 + seed * 35.0) * uHold * (0.006 + flare * 0.006) * mix(0.14, 1.0, layerMix);
    position.y += cos(uTime * 1.5 + seed * 29.0) * uHold * (0.006 + flare * 0.005) * mix(0.12, 1.0, layerMix);
    position.y -= uFade * mix(0.1 + delay * 0.18, 0.28 + delay * 0.72 + layerMix * 0.16, layerMix);
    position.x += sin(seed * 43.0 + uTime * 2.0) * uFade * mix(0.018, 0.12 + layerMix * 0.06, layerMix);
    position.z += cos(seed * 37.0 + uTime * 1.8) * uFade * mix(0.024, 0.16 + layerMix * 0.08, layerMix);

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize =
      size *
      uPixelRatio *
      (28.0 / -mvPosition.z) *
      (0.96 + holdSpark * 0.16 + flare * 0.18) *
      mix(0.78, 1.8, layerMix);
    gl_Position = projectionMatrix * mvPosition;

    float arrival = smoothstep(0.02, 0.76, rain);
    float reveal = max(arrival * (0.92 + flare * 0.14), uReveal * (0.82 + flare * 0.16));
    float hold = uHold * (0.16 + holdSpark * 0.12 + flare * 0.05);
    vAlpha =
      (reveal * mix(0.98, 0.46, layerMix) + hold * mix(0.18, 0.12, layerMix)) *
      (1.0 - uFade * (0.92 - layerMix * 0.12));

    vec3 cyan = vec3(0.62, 0.94, 1.0);
    vec3 lilac = vec3(0.88, 0.82, 1.0);
    vec3 blush = vec3(1.0, 0.76, 0.88);
    vec3 white = vec3(1.0, 0.995, 1.0);
    vColor = mix(cyan, lilac, tone * mix(0.24, 1.0, layerMix));
    vColor = mix(vColor, blush, mix(0.08, 0.18, layerMix) + uHold * 0.12 + flare * 0.08);
    vColor = mix(vColor, white, 0.34 + holdSpark * 0.1 + uReveal * 0.18 + layerMix * 0.08);
    vSpark = clamp(flare * mix(0.18, 0.58, layerMix) + holdSpark * (0.08 + layerMix * 0.18), 0.0, 1.0);
  }
`;

const glyphFragmentShader = `
  varying float vAlpha;
  varying vec3 vColor;
  varying float vSpark;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    float glow = smoothstep(0.58, 0.0, dist);
    float core = smoothstep(0.16, 0.0, dist);
    float flareA = smoothstep(0.04, 0.0, abs(uv.x)) * smoothstep(0.5, 0.02, abs(uv.y));
    float flareB = smoothstep(0.04, 0.0, abs(uv.y)) * smoothstep(0.5, 0.02, abs(uv.x));
    float alpha = glow * (0.28 + vSpark * 0.2) * vAlpha + core * 0.64 * vAlpha + max(flareA, flareB) * vSpark * 0.16 * vAlpha;

    if (alpha < 0.01) {
      discard;
    }

    gl_FragColor = vec4(vColor * (0.72 + core * 0.68 + vSpark * 0.28), alpha);
  }
`;

function createRadialTexture(stops) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(256, 256, 20, 256, 256, 256);

  stops.forEach(([offset, color]) => {
    gradient.addColorStop(offset, color);
  });

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function paintGlyph(context, glyphConfig) {
  const {
    canvas,
    font,
    fillStyle,
    strokeStyle = null,
    lineWidth = 0,
    shadowColor = 'transparent',
    shadowBlur = 0,
    centerY = canvas.height * 0.53
  } = glyphConfig;

  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = font;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.shadowColor = shadowColor;
  context.shadowBlur = shadowBlur;
  context.fillStyle = fillStyle;
  context.fillText(GLYPH_CHAR, canvas.width * 0.5, centerY);

  if (strokeStyle && lineWidth > 0) {
    context.shadowBlur = shadowBlur * 0.5;
    context.lineWidth = lineWidth;
    context.strokeStyle = strokeStyle;
    context.strokeText(GLYPH_CHAR, canvas.width * 0.5, centerY);
  }

  context.restore();
}

function drawGlyphMaskCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 768;

  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  paintGlyph(context, {
    canvas,
    font: GLYPH_MASK_FONT,
    fillStyle: '#ffffff',
    strokeStyle: 'rgba(255,255,255,0.96)',
    lineWidth: 14,
    centerY: canvas.height * 0.535
  });

  return canvas;
}

function drawGlyphGuideCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;

  const context = canvas.getContext('2d');
  const pearlGradient = context.createLinearGradient(0, canvas.height * 0.18, 0, canvas.height * 0.84);
  pearlGradient.addColorStop(0.0, 'rgba(184,232,255,0.72)');
  pearlGradient.addColorStop(0.38, 'rgba(248,252,255,0.82)');
  pearlGradient.addColorStop(0.7, 'rgba(255,234,244,0.8)');
  pearlGradient.addColorStop(1.0, 'rgba(255,184,220,0.68)');

  context.clearRect(0, 0, canvas.width, canvas.height);
  paintGlyph(context, {
    canvas,
    font: GLYPH_GUIDE_FONT,
    fillStyle: 'rgba(196,232,255,0.24)',
    shadowColor: 'rgba(118,188,255,0.45)',
    shadowBlur: 96,
    centerY: canvas.height * 0.54
  });
  paintGlyph(context, {
    canvas,
    font: GLYPH_GUIDE_FONT,
    fillStyle: 'rgba(255,198,226,0.16)',
    shadowColor: 'rgba(255,176,214,0.34)',
    shadowBlur: 60,
    centerY: canvas.height * 0.54
  });
  paintGlyph(context, {
    canvas,
    font: GLYPH_GUIDE_FONT,
    fillStyle: pearlGradient,
    strokeStyle: 'rgba(255,255,255,0.68)',
    lineWidth: 8,
    shadowColor: 'rgba(214,240,255,0.5)',
    shadowBlur: 28,
    centerY: canvas.height * 0.54
  });
  paintGlyph(context, {
    canvas,
    font: GLYPH_GUIDE_FONT,
    fillStyle: 'rgba(255,255,255,0.24)',
    shadowColor: 'rgba(255,255,255,0.22)',
    shadowBlur: 12,
    centerY: canvas.height * 0.54
  });

  return canvas;
}

function extractGlyphPoints() {
  const canvas = drawGlyphMaskCanvas();
  const context = canvas.getContext('2d');
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha < 40) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  const points = [];
  const sampleStep = 4;
  const boundWidth = Math.max(1, maxX - minX);
  const boundHeight = Math.max(1, maxY - minY);
  const maxDimension = Math.max(boundWidth, boundHeight);

  for (let y = minY; y <= maxY; y += sampleStep) {
    for (let x = minX; x <= maxX; x += sampleStep) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha < 56) {
        continue;
      }

      let edgeNeighbors = 0;
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) {
            continue;
          }
          const sampleX = Math.min(width - 1, Math.max(0, x + offsetX * sampleStep));
          const sampleY = Math.min(height - 1, Math.max(0, y + offsetY * sampleStep));
          const neighborAlpha = data[(sampleY * width + sampleX) * 4 + 3];
          if (neighborAlpha < 36) {
            edgeNeighbors += 1;
          }
        }
      }

      const edgeFactor = THREE.MathUtils.clamp(edgeNeighbors / 8, 0, 1);
      const keepProbability =
        edgeFactor > 0
          ? THREE.MathUtils.lerp(0.82, 1.0, edgeFactor)
          : THREE.MathUtils.lerp(0.04, 0.16, alpha / 255);

      if (Math.random() > keepProbability) {
        continue;
      }

      const normalizedX = (x - (minX + maxX) * 0.5) / maxDimension;
      const normalizedY = (((minY + maxY) * 0.5) - y) / maxDimension;
      const widthFactor = (x - minX) / boundWidth;
      const heightFactor = 1 - (y - minY) / boundHeight;

      points.push({
        target: new THREE.Vector3(
          normalizedX * 4.32,
          normalizedY * 4.36,
          THREE.MathUtils.randFloatSpread(edgeFactor > 0 ? 0.04 : 0.1)
        ),
        widthFactor,
        heightFactor,
        brightness: alpha / 255,
        edgeFactor
      });
    }
  }

  while (points.length > 2600) {
    points.splice(Math.floor(Math.random() * points.length), 1);
  }

  return points;
}

function createBurstLayer() {
  const burstCenters = [
    new THREE.Vector3(-2.2, 1.76, -0.18),
    new THREE.Vector3(-0.54, 2.38, 0.08),
    new THREE.Vector3(0.94, 2.02, -0.06),
    new THREE.Vector3(2.32, 2.58, 0.14)
  ];
  const countPerBurst = 220;
  const count = burstCenters.length * countPerBurst;
  const geometry = new THREE.BufferGeometry();
  const position = new Float32Array(count * 3);
  const origin = new Float32Array(count * 3);
  const center = new Float32Array(count * 3);
  const direction = new Float32Array(count * 3);
  const spread = new Float32Array(count);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);
  const tone = new Float32Array(count);
  const delay = new Float32Array(count);
  const lift = new Float32Array(count);

  burstCenters.forEach((burstCenter, burstIndex) => {
    for (let index = 0; index < countPerBurst; index += 1) {
      const particleIndex = burstIndex * countPerBurst + index;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2) * 0.5);
      const directionVector = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      ).normalize();
      const baseIndex = particleIndex * 3;
      const shellOrigin = new THREE.Vector3(
        burstCenter.x * 0.12 + THREE.MathUtils.randFloatSpread(0.18),
        burstCenter.y - 0.96 + Math.random() * 0.18,
        burstCenter.z * 0.2 + THREE.MathUtils.randFloatSpread(0.22)
      );

      origin[baseIndex] = shellOrigin.x;
      origin[baseIndex + 1] = shellOrigin.y;
      origin[baseIndex + 2] = shellOrigin.z;
      center[baseIndex] = burstCenter.x;
      center[baseIndex + 1] = burstCenter.y;
      center[baseIndex + 2] = burstCenter.z;
      direction[baseIndex] = directionVector.x;
      direction[baseIndex + 1] = directionVector.y;
      direction[baseIndex + 2] = directionVector.z;

      spread[particleIndex] = 0.6 + Math.random() * 1.9;
      size[particleIndex] = 0.58 + Math.random() * 1.6;
      seed[particleIndex] = Math.random();
      tone[particleIndex] = THREE.MathUtils.clamp(
        burstIndex / Math.max(1, burstCenters.length - 1) * 0.6 + Math.random() * 0.4,
        0,
        1
      );
      delay[particleIndex] = Math.random() * 0.58;
      lift[particleIndex] = 0.22 + Math.random() * 0.74;
    }
  });

  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('origin', new THREE.BufferAttribute(origin, 3));
  geometry.setAttribute('center', new THREE.BufferAttribute(center, 3));
  geometry.setAttribute('direction', new THREE.BufferAttribute(direction, 3));
  geometry.setAttribute('spread', new THREE.BufferAttribute(spread, 1));
  geometry.setAttribute('size', new THREE.BufferAttribute(size, 1));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  geometry.setAttribute('tone', new THREE.BufferAttribute(tone, 1));
  geometry.setAttribute('delay', new THREE.BufferAttribute(delay, 1));
  geometry.setAttribute('lift', new THREE.BufferAttribute(lift, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: burstVertexShader,
    fragmentShader: burstFragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uLaunch: { value: 0 },
      uBurst: { value: 0 },
      uFade: { value: 0 }
    }
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 12;

  return { points, material };
}

function createGlyphLayer(glyphPoints, layer) {
  const pointsSource =
    layer === 0
      ? glyphPoints.filter(
          (point) =>
            point.edgeFactor > 0.08 ||
            point.brightness > 0.72 ||
            Math.random() <
              THREE.MathUtils.lerp(0.02, 0.18, point.brightness) *
                THREE.MathUtils.lerp(0.45, 1.0, point.edgeFactor + 0.1)
        )
      : glyphPoints;
  const count = pointsSource.length;
  const geometry = new THREE.BufferGeometry();
  const position = new Float32Array(count * 3);
  const target = new Float32Array(count * 3);
  const source = new Float32Array(count * 3);
  const drift = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);
  const tone = new Float32Array(count);
  const delay = new Float32Array(count);
  const flare = new Float32Array(count);
  const burstCenters = [
    new THREE.Vector3(-2.4, 1.2, -0.18),
    new THREE.Vector3(-0.72, 2.08, 0.12),
    new THREE.Vector3(0.84, 1.72, -0.1),
    new THREE.Vector3(2.48, 2.24, 0.1)
  ];

  pointsSource.forEach((point, index) => {
    const burstIndex = point.target.x < -0.8 ? 0 : point.target.x < 0.2 ? 1 : point.target.x < 1.4 ? 2 : 3;
    const sourceAnchor = burstCenters[burstIndex].clone();
    const baseIndex = index * 3;
    const fallDrift = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(layer === 0 ? 0.24 : 0.9),
      THREE.MathUtils.randFloat(layer === 0 ? -0.22 : -0.52, layer === 0 ? -0.5 : -1.12),
      THREE.MathUtils.randFloatSpread(layer === 0 ? 0.16 : 0.62)
    );
    const topLag = 1 - point.heightFactor;
    const rainDelay = THREE.MathUtils.clamp(topLag * 0.58 + Math.random() * 0.18, 0, 0.92);

    target[baseIndex] = point.target.x;
    target[baseIndex + 1] = point.target.y;
    target[baseIndex + 2] = point.target.z;

    source[baseIndex] = sourceAnchor.x + THREE.MathUtils.randFloatSpread(0.92);
    source[baseIndex + 1] = sourceAnchor.y + (layer === 0 ? 0.3 : 0.64) + Math.random() * (layer === 0 ? 0.72 : 1.46);
    source[baseIndex + 2] = sourceAnchor.z + THREE.MathUtils.randFloatSpread(0.72);

    drift[baseIndex] = fallDrift.x;
    drift[baseIndex + 1] = fallDrift.y;
    drift[baseIndex + 2] = fallDrift.z;

    size[index] =
      (layer === 0 ? 0.24 : 0.56) +
      point.brightness * (layer === 0 ? 0.42 : 0.88) +
      point.edgeFactor * (layer === 0 ? 0.28 : 0.2) +
      Math.random() * (layer === 0 ? 0.18 : 0.52);
    seed[index] = Math.random();
    tone[index] = THREE.MathUtils.clamp(
      point.widthFactor * 0.48 + point.heightFactor * 0.26 + Math.random() * 0.28,
      0,
      1
    );
    delay[index] = rainDelay;
    flare[index] = THREE.MathUtils.clamp(
      point.brightness * 0.72 + point.edgeFactor * 0.18 + Math.random() * 0.32,
      0,
      1
    );
  });

  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('target', new THREE.BufferAttribute(target, 3));
  geometry.setAttribute('source', new THREE.BufferAttribute(source, 3));
  geometry.setAttribute('drift', new THREE.BufferAttribute(drift, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(size, 1));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  geometry.setAttribute('tone', new THREE.BufferAttribute(tone, 1));
  geometry.setAttribute('delay', new THREE.BufferAttribute(delay, 1));
  geometry.setAttribute('flare', new THREE.BufferAttribute(flare, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: glyphVertexShader,
    fragmentShader: glyphFragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: layer === 0 ? THREE.NormalBlending : THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uRain: { value: 0 },
      uReveal: { value: 0 },
      uHold: { value: 0 },
      uFade: { value: 0 },
      uLayer: { value: layer }
    }
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = layer === 0 ? 14 : 13;

  return { points, material };
}

export function createGlyphFireworks() {
  const group = new THREE.Group();
  const burstLayer = createBurstLayer();
  const glyphPoints = extractGlyphPoints();
  const glyphCore = createGlyphLayer(glyphPoints, 0);
  const glyphVeil = createGlyphLayer(glyphPoints, 1);

  const rainHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createRadialTexture([
        [0.0, 'rgba(255,255,255,0.34)'],
        [0.12, 'rgba(194,235,255,0.22)'],
        [0.42, 'rgba(121,192,255,0.08)'],
        [1.0, 'rgba(0,0,0,0)']
      ]),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  rainHalo.position.set(0.02, 0.12, -1.45);
  rainHalo.scale.set(6.4, 4.6, 1);

  const blushHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createRadialTexture([
        [0.0, 'rgba(255,255,255,0.28)'],
        [0.16, 'rgba(255,206,228,0.2)'],
        [0.46, 'rgba(255,134,184,0.08)'],
        [1.0, 'rgba(0,0,0,0)']
      ]),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  blushHalo.position.set(-0.12, -0.14, -1.22);
  blushHalo.scale.set(5.4, 3.8, 1);

  group.add(rainHalo);
  group.add(blushHalo);
  group.add(glyphVeil.points);
  group.add(burstLayer.points);
  group.add(glyphCore.points);

  group.position.set(0, 1.42, -0.55);
  group.scale.setScalar(1);

  return {
    group,
    setPixelRatio(pixelRatio) {
      burstLayer.material.uniforms.uPixelRatio.value = pixelRatio;
      glyphCore.material.uniforms.uPixelRatio.value = pixelRatio;
      glyphVeil.material.uniforms.uPixelRatio.value = pixelRatio;
    },
    update(state) {
      burstLayer.material.uniforms.uTime.value = state.elapsed;
      burstLayer.material.uniforms.uLaunch.value = state.fireworksLaunch;
      burstLayer.material.uniforms.uBurst.value = state.fireworksBurst;
      burstLayer.material.uniforms.uFade.value = state.glyphFade;

      glyphCore.material.uniforms.uTime.value = state.elapsed;
      glyphCore.material.uniforms.uRain.value = state.glyphRain;
      glyphCore.material.uniforms.uReveal.value = state.glyphReveal;
      glyphCore.material.uniforms.uHold.value = state.glyphHold;
      glyphCore.material.uniforms.uFade.value = state.glyphFade;

      glyphVeil.material.uniforms.uTime.value = state.elapsed;
      glyphVeil.material.uniforms.uRain.value = state.glyphRain;
      glyphVeil.material.uniforms.uReveal.value = state.glyphReveal;
      glyphVeil.material.uniforms.uHold.value = state.glyphHold;
      glyphVeil.material.uniforms.uFade.value = state.glyphFade;
      burstLayer.points.visible = state.fireworksBurst > state.glyphReveal * 0.42;

      const holdGlow = state.glyphHold * 0.22 + state.glyphReveal * 0.12;
      rainHalo.material.opacity =
        state.glyphReveal * 0.05 + state.glyphHold * 0.04 - state.glyphFade * 0.05;
      rainHalo.scale.set(6.4 + holdGlow * 7.4, 4.6 + holdGlow * 5.1, 1);

      blushHalo.material.opacity =
        state.fireworksBurst * 0.03 + state.glyphHold * 0.034 - state.glyphFade * 0.05;
      blushHalo.scale.set(5.4 + holdGlow * 5.2, 3.8 + holdGlow * 3.8, 1);

      group.position.y = 1.42 + state.fireworksPresence * 0.08 + state.glyphHold * 0.05;
      group.rotation.z = Math.sin(state.elapsed * 0.12) * 0.01 - state.glyphFade * 0.02;
    }
  };
}
