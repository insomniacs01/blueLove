import * as THREE from 'three';

function createHeartShape() {
  const shape = new THREE.Shape();
  const scale = 0.095;

  shape.moveTo(0, 0.42);

  for (let index = 0; index <= 200; index += 1) {
    const angle = (index / 200) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(angle), 3) * scale;
    const y =
      (
        13 * Math.cos(angle) -
        5 * Math.cos(2 * angle) -
        2 * Math.cos(3 * angle) -
        Math.cos(4 * angle)
      ) * scale +
      0.42;

    if (index === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  shape.closePath();
  return shape;
}

export function createSolidHeart() {
  const group = new THREE.Group();

  const shape = createHeartShape();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1.15,
    bevelEnabled: true,
    bevelSegments: 10,
    steps: 1,
    bevelSize: 0.12,
    bevelThickness: 0.16,
    curveSegments: 48
  });

  geometry.center();

  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xff5f87,
    emissive: 0x41111e,
    emissiveIntensity: 0.8,
    roughness: 0.34,
    metalness: 0.02,
    clearcoat: 0.8,
    clearcoatRoughness: 0.32,
    sheen: 0.5,
    sheenColor: new THREE.Color(0xffc8d9)
  });

  const heart = new THREE.Mesh(geometry, coreMaterial);
  heart.scale.set(1.22, 1.22, 1.12);
  group.add(heart);

  const shell = new THREE.Mesh(
    geometry.clone(),
    new THREE.MeshBasicMaterial({
      color: 0xffa3be,
      transparent: true,
      opacity: 0.12
    })
  );
  shell.scale.set(1.28, 1.28, 1.2);
  group.add(shell);

  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      color: 0xff8fb2,
      transparent: true,
      opacity: 0.16,
      depthWrite: false
    })
  );
  halo.scale.set(5.6, 5.2, 1);
  halo.position.z = -0.7;
  group.add(halo);

  group.position.y = 0.2;

  return {
    group,
    update(state) {
      heart.rotation.y = -0.52 + Math.sin(state.elapsed * 0.46) * 0.34;
      heart.rotation.x = 0.2 + Math.cos(state.elapsed * 0.34) * 0.08;
      heart.rotation.z = Math.sin(state.elapsed * 0.3) * 0.05;

      shell.rotation.copy(heart.rotation);
      halo.material.opacity = 0.12 + Math.sin(state.elapsed * 1.6) * 0.02;

      const pulse = 1 + Math.sin(state.elapsed * 1.8) * 0.025;
      heart.scale.set(1.22 * pulse, 1.22 * pulse, 1.12 * pulse);
      shell.scale.set(1.28 * pulse, 1.28 * pulse, 1.2 * pulse);
    }
  };
}
