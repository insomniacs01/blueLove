export function clamp01(value) {
  return Math.min(Math.max(value, 0), 1);
}

export function smoothRange(value, start, end) {
  if (start === end) {
    return value >= end ? 1 : 0;
  }

  return clamp01((value - start) / (end - start));
}

export function smoothPulse(value, attackStart, attackEnd, releaseStart, releaseEnd) {
  return smoothRange(value, attackStart, attackEnd) * (1 - smoothRange(value, releaseStart, releaseEnd));
}

export function computeSceneState(elapsed) {
  const duration = 18;
  const cycle = ((elapsed % duration) + duration) % duration / duration;
  const release = smoothRange(cycle, 0.92, 1.0);
  const birth = smoothRange(cycle, 0.0, 0.16) * (1 - release);
  const invocation = smoothPulse(cycle, 0.0, 0.18, 0.24, 0.42);
  const yearning = smoothPulse(cycle, 0.16, 0.4, 0.5, 0.66);
  const eclipse = smoothPulse(cycle, 0.36, 0.54, 0.66, 0.84);
  const primaryFracture = smoothPulse(cycle, 0.45, 0.58, 0.7, 0.84);
  const repairBase = smoothRange(cycle, 0.73, 0.92);
  const repair = repairBase * (1 - smoothRange(cycle, 0.94, 1.0));
  const pursuit = smoothPulse(cycle, 0.6, 0.76, 0.88, 0.98);
  const reunion = smoothPulse(cycle, 0.845, 0.89, 0.915, 0.955);
  const primaryShock = smoothPulse(cycle, 0.5, 0.56, 0.63, 0.72);
  const primaryRibbonFury = smoothPulse(cycle, 0.48, 0.6, 0.76, 0.9);
  const spinCarry = smoothPulse(cycle, 0.42, 0.56, 0.93, 1.0);
  const spinTurns =
    smoothRange(cycle, 0.42, 0.58) * 0.62 +
    smoothRange(cycle, 0.58, 0.92) * 0.58;
  const spinAngle = -spinTurns * Math.PI * 2;
  const surgeProgress = smoothRange(cycle, 0.84, 0.94);
  const surge =
    smoothPulse(cycle, 0.852, 0.894, 0.918, 0.948) *
    (0.18 + repairBase * 0.44);
  const refracture =
    smoothPulse(cycle, 0.9, 0.95, 0.975, 1.0) *
    (0.24 + repairBase * 0.76);
  const fracture = clamp01(primaryFracture + refracture * 0.86);
  const shock = clamp01(primaryShock + surge * 0.62 + refracture * 0.3);
  const ribbonFury = clamp01(primaryRibbonFury + surge * 0.26 + refracture * 0.08);
  const afterglowEnvelope = smoothPulse(cycle, 0.88, 0.91, 0.924, 0.958);
  const afterglow = clamp01(afterglowEnvelope * (0.08 + surge * 0.16 + reunion * 0.22));
  const heartbeat = clamp01(
    smoothPulse(cycle, 0.18, 0.3, 0.36, 0.48) +
      smoothPulse(cycle, 0.76, 0.86, 0.92, 1.0)
  );
  const gravity = clamp01(yearning * 0.74 + repair * 0.34 + surge * 0.24);
  const veil = clamp01(eclipse * 0.78 + fracture * 0.24 + refracture * 0.14);

  const heartPresence = clamp01(
    birth * (1 - fracture * 0.94) +
      repair * (0.46 - refracture * 0.22) +
      yearning * 0.08 +
      afterglow * 0.02
  );
  const swirl = clamp01(
    (1 - birth) * 1.15 +
    fracture * 0.75 +
    (1 - repair) * 0.24 +
    refracture * 0.14 +
    release * 0.22
  );
  const serenity = clamp01(
    heartPresence * 0.9 +
      yearning * 0.08 +
      afterglow * 0.05 -
      fracture * 0.28 -
      surge * 0.08 -
      release * 0.08 +
      0.1
  );
  const witness = clamp01(
    invocation * 0.34 +
      yearning * 0.76 +
      reunion * 0.46 +
      afterglow * 0.16 -
      fracture * 0.16
  );
  const shimmer = 0.5 + Math.sin(elapsed * 1.9) * 0.5;

  return {
    elapsed,
    duration,
    cycle,
    birth,
    invocation,
    yearning,
    eclipse,
    fracture,
    repair,
    pursuit,
    reunion,
    shock,
    ribbonFury,
    release,
    spinCarry,
    spinAngle,
    surge,
    surgeProgress,
    refracture,
    afterglow,
    heartbeat,
    gravity,
    veil,
    heartPresence,
    swirl,
    serenity,
    witness,
    shimmer
  };
}
