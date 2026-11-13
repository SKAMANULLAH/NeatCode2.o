let audioCtx = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(freq, duration = 0.12, type = "sine", gainVal = 0.08, delay = 0) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  } catch {
    // Ignore audio context errors silently
  }
}

export function playXpGain(enabled = true) {
  if (!enabled) return;
  playTone(587.33, 0.09, "triangle", 0.07, 0);
  playTone(880, 0.14, "sine", 0.07, 0.06);
}

export function playShieldDamage(enabled = true) {
  if (!enabled) return;
  playTone(210, 0.16, "sawtooth", 0.05, 0);
  playTone(145, 0.22, "sawtooth", 0.05, 0.09);
}

export function playChestOpen(enabled = true) {
  if (!enabled) return;
  playTone(523.25, 0.1, "triangle", 0.07, 0);
  playTone(659.25, 0.1, "triangle", 0.07, 0.07);
  playTone(783.99, 0.12, "triangle", 0.08, 0.14);
  playTone(1046.5, 0.26, "sine", 0.09, 0.21);
}

export function playBossVictory(enabled = true) {
  if (!enabled) return;
  playTone(440, 0.1, "triangle", 0.08, 0);
  playTone(554.37, 0.1, "triangle", 0.08, 0.08);
  playTone(659.25, 0.12, "triangle", 0.08, 0.16);
  playTone(880, 0.3, "sine", 0.1, 0.25);
}

export function playLevelUp(enabled = true) {
  if (!enabled) return;
  playTone(523.25, 0.12, "triangle", 0.08, 0);
  playTone(659.25, 0.12, "triangle", 0.08, 0.09);
  playTone(783.99, 0.12, "triangle", 0.08, 0.18);
  playTone(1046.5, 0.18, "triangle", 0.09, 0.27);
  playTone(1318.5, 0.36, "sine", 0.09, 0.37);
}
