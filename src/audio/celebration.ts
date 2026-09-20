type AudioContextConstructor = new () => AudioContext;

let cachedContext: AudioContext | null = null;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;

  const candidate =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;

  return typeof candidate === "function" ? (candidate as AudioContextConstructor) : null;
}

function getAudioContext(): AudioContext | null {
  if (cachedContext) return cachedContext;

  const Context = getAudioContextConstructor();
  if (!Context) return null;

  try {
    cachedContext = new Context();
    return cachedContext;
  } catch {
    return null;
  }
}

const celebrationNotes = [523.25, 659.25, 783.99];

export function playCelebration(): void {
  const context = getAudioContext();
  if (!context) return;

  try {
    void context.resume?.();

    const startTime = context.currentTime;

    celebrationNotes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const noteStart = startTime + index * 0.09;

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.16, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.28);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + 0.3);
    });
  } catch {
    // 庆祝音效是装饰性的，任何音频失败都不应影响完成流程。
  }
}

export function resetCelebrationAudio(): void {
  cachedContext = null;
}
