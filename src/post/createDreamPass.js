import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const shader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uFracture: { value: 0 },
    uPresence: { value: 1 },
    uShock: { value: 0 },
    uYearning: { value: 0 },
    uVeil: { value: 0 },
    uAfterglow: { value: 0 },
    uWitness: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uFracture;
    uniform float uPresence;
    uniform float uShock;
    uniform float uYearning;
    uniform float uVeil;
    uniform float uAfterglow;
    uniform float uWitness;

    varying vec2 vUv;

    float hash(vec2 value) {
      return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      float aspect = uResolution.x / max(uResolution.y, 1.0);
      vec2 centered = vUv - 0.5;
      float radius = length(centered);
      vec2 aberration = centered * (0.0018 + uFracture * 0.005) * (0.16 + radius * 1.4);

      vec3 color;
      color.r = texture2D(tDiffuse, vUv + aberration).r;
      color.g = texture2D(tDiffuse, vUv).g;
      color.b = texture2D(tDiffuse, vUv - aberration).b;

      float grain = hash(vUv * uResolution.xy + uTime * 53.0) - 0.5;
      float scanline = sin(vUv.y * uResolution.y * 0.82 + uTime * 4.0) * 0.0004;
      float vignette = smoothstep(1.18, 0.14, radius);
      float glow = smoothstep(0.92, 0.03, radius);
      float heartGlow = smoothstep(0.52, 0.0, length((vUv - vec2(0.5, 0.56)) * vec2(aspect, 1.0)));
      float flare = smoothstep(0.68, 0.0, length((vUv - vec2(0.53, 0.58)) * vec2(aspect * 1.05, 1.32)));
      float romanceHalo = smoothstep(0.78, 0.04, length((vUv - vec2(0.5, 0.54)) * vec2(aspect * 0.92, 1.0)));
      float vowHalo = smoothstep(0.66, 0.0, length((vUv - vec2(0.5, 0.51)) * vec2(aspect * 0.86, 1.16)));
      float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
      float highlightMask = smoothstep(0.38, 1.06, luma);
      float shadowMask = 1.0 - smoothstep(0.06, 0.42, luma);

      color += vec3(0.026, 0.04, 0.065) * glow * (0.18 + uPresence * 0.12);
      color += vec3(0.07, 0.1, 0.16) * heartGlow * (0.14 + uPresence * 0.18 + uShock * 0.14 + uYearning * 0.08);
      color += vec3(0.06, 0.08, 0.14) * flare * (0.12 + highlightMask * 0.18 + uWitness * 0.08);
      color += vec3(0.08, 0.12, 0.2) * romanceHalo * (uYearning * 0.12 + uPresence * 0.06);
      color += vec3(0.16, 0.1, 0.16) * vowHalo * (uAfterglow * 0.015 + uShock * 0.012);
      color += grain * (0.012 + uFracture * 0.018);
      color += scanline * 0.08;
      color *= mix(0.9, 1.02, vignette);
      color -= vec3(0.01, 0.012, 0.024) * (1.0 - vignette) * (0.34 + uVeil * 0.12);
      color -= vec3(0.004, 0.005, 0.012) * shadowMask * (0.12 + (1.0 - heartGlow) * 0.08 + uVeil * 0.06);
      color = max(color, vec3(0.0));
      color = mix(vec3(luma), color, 1.06 + uPresence * 0.1 + uAfterglow * 0.008);
      color += highlightMask * highlightMask * vec3(0.05, 0.07, 0.1) * (0.1 + uPresence * 0.12 + uShock * 0.14 + uAfterglow * 0.016);

      gl_FragColor = vec4(color, 1.0);
    }
  `
};

export function createDreamPass() {
  const pass = new ShaderPass(shader);

  return {
    pass,
    setSize(width, height) {
      pass.uniforms.uResolution.value.set(width, height);
    },
    update(state) {
      pass.uniforms.uTime.value = state.elapsed;
      pass.uniforms.uFracture.value = state.fracture;
      pass.uniforms.uPresence.value = state.heartPresence;
      pass.uniforms.uShock.value = state.shock;
      pass.uniforms.uYearning.value = state.yearning;
      pass.uniforms.uVeil.value = state.veil;
      pass.uniforms.uAfterglow.value = state.afterglow;
      pass.uniforms.uWitness.value = state.witness;
    }
  };
}
