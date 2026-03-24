import * as THREE from 'three';

function createRadialTexture(stops) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(256, 256, 18, 256, 256, 256);

  stops.forEach(([offset, color]) => {
    gradient.addColorStop(offset, color);
  });

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createStoryHalo() {
  const group = new THREE.Group();

  const witnessHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createRadialTexture([
        [0.0, 'rgba(255,255,255,0.38)'],
        [0.18, 'rgba(167,222,255,0.22)'],
        [0.48, 'rgba(82,145,255,0.08)'],
        [1.0, 'rgba(0,0,0,0)']
      ]),
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  witnessHalo.position.set(0, 0.08, -1.85);
  witnessHalo.scale.set(4.8, 4.2, 1);
  group.add(witnessHalo);

  const eclipseVeil = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createRadialTexture([
        [0.0, 'rgba(12,20,42,0.0)'],
        [0.22, 'rgba(42,64,120,0.04)'],
        [0.56, 'rgba(42,56,132,0.1)'],
        [0.78, 'rgba(255,150,198,0.04)'],
        [1.0, 'rgba(2,4,12,0.0)']
      ]),
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.NormalBlending
    })
  );
  eclipseVeil.position.set(0, 0.1, -1.7);
  eclipseVeil.scale.set(5.2, 4.8, 1);
  group.add(eclipseVeil);

  const vowHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createRadialTexture([
        [0.0, 'rgba(255,255,255,0.4)'],
        [0.16, 'rgba(255,214,232,0.22)'],
        [0.44, 'rgba(255,135,182,0.12)'],
        [0.78, 'rgba(118,226,255,0.06)'],
        [1.0, 'rgba(0,0,0,0)']
      ]),
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  vowHalo.position.set(0, 0.18, -1.25);
  vowHalo.scale.set(3.2, 3.0, 1);
  group.add(vowHalo);

  return {
    group,
    update(state) {
      const drift = Math.sin(state.elapsed * 0.22) * 0.06;
      group.position.y = state.invocation * 0.05 + state.afterglow * 0.03 - state.veil * 0.04;

      witnessHalo.position.x = drift * 0.4;
      witnessHalo.position.y = 0.08 + state.yearning * 0.14 + state.afterglow * 0.04;
      witnessHalo.material.opacity =
        0.03 +
        state.invocation * 0.08 +
        state.yearning * 0.18 +
        state.afterglow * 0.02 -
        state.veil * 0.03;
      witnessHalo.scale.setScalar(4.4 + state.yearning * 1.0 + state.afterglow * 0.16);
      witnessHalo.scale.y *= 0.88;

      eclipseVeil.position.x = -drift * 0.3;
      eclipseVeil.position.y = 0.1 + state.fracture * 0.08;
      eclipseVeil.material.opacity = state.veil * 0.16 + state.fracture * 0.04;
      eclipseVeil.scale.set(5.2 + state.veil * 1.4, 4.8 + state.veil * 1.2, 1);

      vowHalo.position.x = drift * 0.2;
      vowHalo.position.y = 0.24 + state.reunion * 0.04 + state.afterglow * 0.02;
      vowHalo.material.opacity =
        state.reunion * 0.03 +
        state.afterglow * 0.025 +
        state.surge * 0.012;
      vowHalo.scale.set(
        1.72 + state.reunion * 0.2 + state.afterglow * 0.18 + state.surge * 0.08,
        1.08 + state.reunion * 0.12 + state.afterglow * 0.1 + state.surge * 0.05,
        1
      );
    }
  };
}
