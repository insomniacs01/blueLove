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
  const duration = 22.4;
  const mainDuration = 18;
  const cycleTime = ((elapsed % duration) + duration) % duration;
  const cycle = cycleTime / duration;
  const storyCycle = Math.min(cycleTime / mainDuration, 0.999999);
  const loopBridge = smoothRange(cycleTime, 21.48, duration);
  const release = smoothRange(storyCycle, 0.92, 1.0);
  const birth = smoothRange(storyCycle, 0.0, 0.16) * (1 - release);
  const rebirth = clamp01(birth + loopBridge * 0.16);
  const invocation = smoothPulse(storyCycle, 0.0, 0.18, 0.24, 0.42);
  const yearning = smoothPulse(storyCycle, 0.16, 0.4, 0.5, 0.66);
  const eclipse = smoothPulse(storyCycle, 0.36, 0.54, 0.66, 0.84);
  const primaryFracture = smoothPulse(storyCycle, 0.45, 0.58, 0.7, 0.84);
  const repairBase = smoothRange(storyCycle, 0.73, 0.92);
  const repair = repairBase * (1 - smoothRange(storyCycle, 0.94, 1.0));
  const pursuit = smoothPulse(storyCycle, 0.6, 0.76, 0.88, 0.98);
  const reunion = smoothPulse(storyCycle, 0.845, 0.89, 0.915, 0.955);
  const primaryShock = smoothPulse(storyCycle, 0.5, 0.56, 0.63, 0.72);
  const primaryRibbonFury = smoothPulse(storyCycle, 0.48, 0.6, 0.76, 0.9);
  const spinCarry = smoothPulse(storyCycle, 0.42, 0.56, 0.93, 1.0);
  const spinTurns =
    smoothRange(storyCycle, 0.42, 0.58) * 0.62 +
    smoothRange(storyCycle, 0.58, 0.92) * 0.58;
  const spinAngle = -spinTurns * Math.PI * 2;
  const surgeProgress = smoothRange(storyCycle, 0.84, 0.94);
  const surge =
    smoothPulse(storyCycle, 0.852, 0.894, 0.918, 0.948) *
    (0.18 + repairBase * 0.44);
  const refracture =
    smoothPulse(storyCycle, 0.9, 0.95, 0.975, 1.0) *
    (0.24 + repairBase * 0.76);
  const fracture = clamp01(primaryFracture + refracture * 0.86);
  const shock = clamp01(primaryShock + surge * 0.62 + refracture * 0.3);
  const ribbonFury = clamp01(primaryRibbonFury + surge * 0.26 + refracture * 0.08);
  const afterglowEnvelope = smoothPulse(storyCycle, 0.88, 0.91, 0.924, 0.958);
  const afterglow = clamp01(afterglowEnvelope * (0.08 + surge * 0.16 + reunion * 0.22));
  const heartbeat = clamp01(
    smoothPulse(storyCycle, 0.18, 0.3, 0.36, 0.48) +
      smoothPulse(storyCycle, 0.76, 0.86, 0.92, 1.0)
  );
  const gravity = clamp01(yearning * 0.74 + repair * 0.34 + surge * 0.24);
  const veil = clamp01(eclipse * 0.78 + fracture * 0.24 + refracture * 0.14);

  const heartPresence = clamp01(
    birth * (1 - fracture * 0.94) +
      repair * (0.46 - refracture * 0.22) +
      yearning * 0.08 +
      afterglow * 0.02 +
      loopBridge * 0.12
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
      loopBridge * 0.07 +
      0.1
  );
  const witness = clamp01(
    invocation * 0.34 +
      yearning * 0.76 +
      reunion * 0.46 +
      afterglow * 0.16 -
      fracture * 0.16
  );
  const spectacleFade = smoothPulse(cycleTime, 18.0, 18.75, 21.52, duration);
  const fireworksLaunch = smoothPulse(cycleTime, 18.02, 18.72, 19.3, 20.0);
  const fireworksBurst = smoothPulse(cycleTime, 18.24, 19.28, 20.28, 21.08);
  const glyphRain = smoothPulse(cycleTime, 18.42, 19.96, 21.18, 22.18);
  const glyphReveal =
    smoothRange(cycleTime, 18.76, 20.2) *
    (1 - smoothRange(cycleTime, 21.22, 22.16));
  const glyphHold = smoothPulse(cycleTime, 19.7, 20.52, 21.16, 21.96);
  const glyphFade = smoothRange(cycleTime, 21.24, 22.36);
  const fireworksPresence = clamp01(
    fireworksLaunch * 0.26 +
      fireworksBurst * 0.9 +
      glyphRain * 0.34 +
      glyphReveal * 0.78 +
      glyphHold * 0.9
  );
  const skyFocus = clamp01(
    smoothRange(cycleTime, 18.06, 19.0) +
      fireworksBurst * 0.28 +
      glyphReveal * 0.46 +
      glyphHold * 0.52
  ) * (1 - loopBridge * 0.96);
  const shimmer = 0.5 + Math.sin(elapsed * 1.9) * 0.5;

  return {
    elapsed,
    duration,
    cycle,
    cycleTime,
    storyCycle,
    birth,
    rebirth,
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
    loopBridge,
    spectacleFade,
    fireworksLaunch,
    fireworksBurst,
    fireworksPresence,
    glyphRain,
    glyphReveal,
    glyphHold,
    glyphFade,
    skyFocus,
    shimmer
  };
}
