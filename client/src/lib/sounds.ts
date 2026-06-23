let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  // Resume if suspended (browsers require user gesture before audio)
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  startAt: number,
  duration: number,
  gain = 0.18,
  type: OscillatorType = "sine",
  ramp = true
) {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g);
  g.connect(c.destination);
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + startAt);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + startAt + 0.01);
  if (ramp) g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startAt + duration);
  osc.start(c.currentTime + startAt);
  osc.stop(c.currentTime + startAt + duration + 0.05);
}

export const sounds = {
  // Habit checked — two ascending pings
  habitCheck: () => {
    tone(880, 0, 0.12, 0.14);
    tone(1320, 0.08, 0.18, 0.1);
  },

  // Habit unchecked — soft descending tone
  habitUncheck: () => {
    tone(500, 0, 0.1, 0.09);
    tone(350, 0.06, 0.1, 0.06);
  },

  // Task completed — satisfying ascending triad
  taskDone: () => {
    tone(523, 0, 0.1, 0.14);      // C5
    tone(659, 0.07, 0.1, 0.12);   // E5
    tone(784, 0.14, 0.18, 0.1);   // G5
  },

  // Task un-done — brief soft reverse
  taskUndone: () => {
    tone(440, 0, 0.08, 0.08);
  },

  // Create something (add task/habit/goal)
  add: () => {
    tone(660, 0, 0.06, 0.1);
    tone(880, 0.05, 0.08, 0.07);
  },

  // Delete
  del: () => {
    tone(300, 0, 0.06, 0.1, "sawtooth");
    tone(200, 0.05, 0.1, 0.07, "sawtooth");
  },

  // Timer started
  timerStart: () => {
    tone(440, 0, 0.08, 0.12);
  },

  // Timer ended — celebratory 4-note chime
  timerEnd: () => {
    tone(523, 0,    0.15, 0.15);
    tone(659, 0.15, 0.15, 0.15);
    tone(784, 0.30, 0.15, 0.15);
    tone(1047, 0.45, 0.35, 0.12);
  },

  // Break ended — gentle reminder
  breakEnd: () => {
    tone(659, 0,    0.12, 0.1);
    tone(523, 0.15, 0.15, 0.1);
  },
};
