let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  audioCtx ??= new AudioContext();
  return audioCtx;
}

function tone(
  ctx: AudioContext,
  start: number,
  frequency: number,
  duration: number,
  peak: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playCompleteSound() {
  try {
    const ctx = getContext();
    if (!ctx) return;
    void ctx.resume();
    const t = ctx.currentTime;
    tone(ctx, t, 1318.5, 0.16, 0.1);
    tone(ctx, t + 0.08, 1760, 0.28, 0.12);
  } catch {
    // Ignore autoplay / audio device errors.
  }
}
