import * as THREE from 'three';

function createGlowTexture(colorStops) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(256, 256, 24, 256, 256, 256);

  colorStops.forEach(([offset, color]) => {
    gradient.addColorStop(offset, color);
  });

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBackdrop() {
  const group = new THREE.Group();

  const haze = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createGlowTexture([
        [0.0, 'rgba(196,226,255,0.22)'],
        [0.18, 'rgba(138,188,255,0.12)'],
        [0.52, 'rgba(84,126,255,0.035)'],
        [1.0, 'rgba(0,0,0,0)']
      ]),
      transparent: true,
      opacity: 0.095,
      depthWrite: false,
      depthTest: false
    })
  );
  haze.renderOrder = -40;
  haze.position.set(-0.16, 0.4, -15.2);
  haze.scale.set(21.6, 13.2, 1);
  group.add(haze);

  const roseHaze = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createGlowTexture([
        [0.0, 'rgba(255,226,238,0.16)'],
        [0.24, 'rgba(255,176,214,0.09)'],
        [0.6, 'rgba(255,136,194,0.03)'],
        [1.0, 'rgba(0,0,0,0)']
      ]),
      transparent: true,
      opacity: 0.052,
      depthWrite: false,
      depthTest: false
    })
  );
  roseHaze.renderOrder = -39;
  roseHaze.position.set(0.82, 0.94, -14.3);
  roseHaze.scale.set(18.8, 11.2, 1);
  group.add(roseHaze);

  const pearlHaze = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createGlowTexture([
        [0.0, 'rgba(255,246,255,0.12)'],
        [0.22, 'rgba(224,214,255,0.06)'],
        [0.62, 'rgba(150,176,255,0.02)'],
        [1.0, 'rgba(0,0,0,0)']
      ]),
      transparent: true,
      opacity: 0.032,
      depthWrite: false,
      depthTest: false
    })
  );
  pearlHaze.renderOrder = -38;
  pearlHaze.position.set(-1.02, -0.16, -15.8);
  pearlHaze.scale.set(16.4, 10.6, 1);
  group.add(pearlHaze);

  return {
    group,
    update(state) {
      haze.position.x =
        -0.16 +
        Math.sin(state.elapsed * 0.06) * 0.22 +
        state.fracture * 0.06 -
        state.reunion * 0.03;
      haze.position.y = 0.4 + state.yearning * 0.12 - state.veil * 0.08 + state.afterglow * 0.08;
      haze.position.z = -15.2 - state.veil * 0.2 + state.afterglow * 0.12;
      haze.material.rotation = Math.sin(state.elapsed * 0.05) * 0.06 + state.fracture * 0.035 - state.afterglow * 0.02;
      haze.scale.set(21.6, 13.2, 1);
      haze.scale.multiplyScalar(1 + state.yearning * 0.08 + state.afterglow * 0.1 + state.veil * 0.05);
      haze.material.opacity =
        0.062 +
        state.serenity * 0.035 +
        state.yearning * 0.03 +
        state.veil * 0.015 +
        state.afterglow * 0.04;

      roseHaze.position.x = 0.82 + Math.sin(state.elapsed * 0.045) * 0.18 - state.reunion * 0.06;
      roseHaze.position.y = 0.94 + state.afterglow * 0.12 + state.reunion * 0.06 - state.veil * 0.05;
      roseHaze.position.z = -14.3 + state.afterglow * 0.1;
      roseHaze.material.rotation = Math.cos(state.elapsed * 0.04) * 0.05 - state.afterglow * 0.015;
      roseHaze.material.opacity = 0.028 + state.afterglow * 0.028 + state.reunion * 0.016 + state.serenity * 0.012;
      roseHaze.scale.set(18.8, 11.2, 1);
      roseHaze.scale.multiplyScalar(1 + state.afterglow * 0.12 + state.yearning * 0.03 + state.reunion * 0.05);

      pearlHaze.position.x = -1.02 + Math.cos(state.elapsed * 0.05) * 0.16 - state.fracture * 0.04;
      pearlHaze.position.y = -0.16 + state.invocation * 0.05 + state.afterglow * 0.1 - state.veil * 0.06;
      pearlHaze.position.z = -15.8 - state.veil * 0.12 + state.afterglow * 0.08;
      pearlHaze.material.rotation = Math.sin(state.elapsed * 0.035) * 0.04 + state.yearning * 0.03;
      pearlHaze.material.opacity = 0.018 + state.serenity * 0.012 + state.afterglow * 0.018 + state.yearning * 0.01;
      pearlHaze.scale.set(16.4, 10.6, 1);
      pearlHaze.scale.multiplyScalar(1 + state.afterglow * 0.08 + state.yearning * 0.04);
    }
  };
}
