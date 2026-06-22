// Tiny synthesized UI sound effects via the Web Audio API.
//
// No audio files, no network requests — every sound here is a couple of
// oscillators with a short gain envelope. Keeps the bundle tiny and avoids
// shipping/licensing actual sound assets. Every call is wrapped so a failure
// (blocked autoplay, no AudioContext, etc.) never breaks the UI action it's
// attached to — sound is decoration, not a dependency.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (typeof window === "undefined") return null;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  freqStart: number,
  freqEnd: number,
  duration: number,
  opts: { type?: OscillatorType; gain?: number; delay?: number } = {},
) {
  try {
    const ac = getCtx();
    if (!ac) return;
    const { type = "sine", gain = 0.05, delay = 0 } = opts;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const env = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + duration);
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(env).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  } catch {
    // Sound is decoration — never let it throw into a click handler.
  }
}

/** Soft round "pop" — dialog/modal opening. */
export function playOpen() {
  tone(620, 740, 0.09, { type: "sine", gain: 0.045 });
}

/** Bright two-note chime — a positive confirm. */
export function playConfirm() {
  tone(660, 880, 0.1, { type: "triangle", gain: 0.05 });
  tone(880, 1040, 0.12, { type: "triangle", gain: 0.04, delay: 0.07 });
}

/** Low downward "thunk" — destructive confirms (delete). */
export function playDelete() {
  tone(360, 120, 0.16, { type: "sine", gain: 0.07 });
  tone(180, 60, 0.18, { type: "triangle", gain: 0.05, delay: 0.02 });
}

/** Tiny neutral tick — cancel/dismiss. */
export function playCancel() {
  tone(280, 220, 0.06, { type: "sine", gain: 0.03 });
}

/** Cheerful ascending run — success/celebration moments. */
export function playSuccess() {
  [523, 659, 784].forEach((f, i) => tone(f, f, 0.1, { type: "triangle", gain: 0.045, delay: i * 0.06 }));
}
