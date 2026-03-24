import * as THREE from 'three';

function cubicBezier(start, controlA, controlB, end, t) {
  const inverse = 1 - t;
  const a = inverse * inverse * inverse;
  const b = 3 * inverse * inverse * t;
  const c = 3 * inverse * t * t;
  const d = t * t * t;

  return new THREE.Vector3(
    start.x * a + controlA.x * b + controlB.x * c + end.x * d,
    start.y * a + controlA.y * b + controlB.y * c + end.y * d,
    start.z * a + controlA.z * b + controlB.z * c + end.z * d
  );
}

function heartAnchor(angle, lift) {
  const x = 16 * Math.pow(Math.sin(angle), 3) * 0.077;
  const y =
    (
      13 * Math.cos(angle) -
      5 * Math.cos(2 * angle) -
      2 * Math.cos(3 * angle) -
      Math.cos(4 * angle)
    ) * 0.078 +
    0.38 +
    lift;

  return new THREE.Vector3(x, y, Math.cos(angle * 2.0) * 0.09);
}

export function createFlowRibbons() {
  const group = new THREE.Group();
  const ribbons = [];
  const segments = 64;
  const coolColor = new THREE.Color(0x79eaff);
  const warmColor = new THREE.Color(0xffa6c6);

  for (let index = 0; index < 14; index += 1) {
    const points = Array.from({ length: segments }, () => new THREE.Vector3());
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(index % 3 === 0 ? 0x99b6ff : 0x79eaff),
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const line = new THREE.Line(geometry, material);
    group.add(line);

    ribbons.push({
      geometry,
      line,
      seed: index * 0.37 + Math.random() * 0.18,
      sway: 0.55 + Math.random() * 0.6,
      radius: 0.3 + index * 0.04
    });
  }

  return {
    group,
    update(state) {
      ribbons.forEach((ribbon, ribbonIndex) => {
        const angle =
          state.elapsed * (0.34 + state.ribbonFury * 0.38) +
          ribbon.seed * 7.0 +
          state.spinAngle * state.spinCarry * 0.34;
        const fracturePush = state.fracture * (0.15 + ribbonIndex * 0.014);
        const yearningLift = state.yearning * (0.08 + ribbonIndex * 0.004);
        const reunionLift = state.reunion * 0.14 + state.afterglow * 0.1;
        const start = new THREE.Vector3(
          Math.cos(angle) * (ribbon.radius + fracturePush),
          -1.88 + state.invocation * 0.08 + yearningLift + reunionLift,
          Math.sin(angle * 0.78) * (0.14 + state.fracture * 0.14)
        );
        start.x *= 1 - state.surge * 0.26;
        start.z *= 1 - state.surge * 0.34;
        start.y += state.surgeProgress * state.surge * 0.18 - state.veil * 0.06;
        const end = heartAnchor(
          angle + ribbon.seed * 2.6,
          Math.sin(state.elapsed * 1.5 + ribbon.seed) * 0.1 +
            state.fracture * 0.14 +
            state.refracture * 0.18 +
            state.yearning * 0.1 +
            state.reunion * 0.16 +
            state.afterglow * 0.1
        );
        const controlA = start.clone().add(
          new THREE.Vector3(
            Math.sin(state.elapsed * 1.6 + ribbon.seed) * (0.36 + state.fracture * 0.22) * (1 - state.surge * 0.18),
            1.0 + ribbon.sway + state.ribbonFury * 0.28 + state.surge * 0.52 + state.yearning * 0.44 + state.afterglow * 0.22,
            Math.cos(state.elapsed * 1.2 + ribbon.seed) * (0.22 + state.fracture * 0.16) * (1 - state.surge * 0.22)
          )
        );
        const controlB = end.clone().add(
          new THREE.Vector3(
            Math.cos(state.elapsed * 1.9 + ribbon.seed * 2.0) * (0.42 + state.fracture * 0.18),
            -0.52 + state.ribbonFury * 0.18 + state.pursuit * 0.12 + state.reunion * 0.24,
            Math.sin(state.elapsed * 1.25 + ribbon.seed * 1.6) * (0.18 + state.fracture * 0.16)
          )
        );

        const positions = ribbon.geometry.attributes.position.array;

        for (let index = 0; index < segments; index += 1) {
          const t = index / (segments - 1);
          const point = cubicBezier(start, controlA, controlB, end, t);
          const noiseAmp = 0.01 + state.ribbonFury * 0.032;
          point.x += Math.sin(t * 18 - state.elapsed * (4 + state.ribbonFury * 3) + ribbon.seed * 7) * noiseAmp * (1 - t);
          point.y += Math.cos(t * 13 - state.elapsed * 3.2 + ribbon.seed * 5) * noiseAmp * 0.35;
          point.z += Math.cos(t * 14 - state.elapsed * (3 + state.ribbonFury * 2) + ribbon.seed * 5) * noiseAmp * (1 - t);

          positions[index * 3] = point.x;
          positions[index * 3 + 1] = point.y;
          positions[index * 3 + 2] = point.z;
        }

        ribbon.geometry.attributes.position.needsUpdate = true;
        ribbon.line.material.color.lerpColors(
          coolColor,
          warmColor,
          state.reunion * 0.34 + state.afterglow * 0.72
        );
        ribbon.line.material.opacity =
          0.01 +
          state.serenity * 0.018 +
          state.yearning * 0.028 +
          state.ribbonFury * 0.072 +
          state.afterglow * 0.032 +
          state.surge * 0.024 +
          (Math.sin(state.elapsed * 2.6 + ribbon.seed * 9.0) * 0.5 + 0.5) * 0.015;
      });
    }
  };
}
