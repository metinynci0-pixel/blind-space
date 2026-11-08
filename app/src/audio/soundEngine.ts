const MIN_SOUND_ID = 1;
const MAX_SOUND_ID = 255;

type EarTestSoundId = 227 | 228;

let audioContext: AudioContext | undefined;
const decodedBuffers = new Map<number, AudioBuffer>();

function getAudioContext(): AudioContext {
  if (typeof window === "undefined") {
    throw new Error("Ses motoru yalnızca tarayıcıda kullanılabilir.");
  }

  const AudioContextConstructor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextConstructor) {
    throw new Error("Bu cihaz Web Audio ses motorunu desteklemiyor.");
  }

  audioContext ??= new AudioContextConstructor();
  return audioContext;
}

function soundFilePath(soundId: number): string {
  return `/sounds/ses_${String(soundId).padStart(3, "0")}.ogg`;
}

function playTemporaryEarTestTone(
  context: AudioContext,
  soundId: EarTestSoundId,
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const panner = context.createStereoPanner();
  const isLeftEar = soundId === 227;
  const startTime = context.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.value = isLeftEar ? 440 : 660;
  panner.pan.value = isLeftEar ? -1 : 1;
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.16, startTime + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);

  oscillator.connect(gain);
  gain.connect(panner);
  panner.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.34);
}

async function loadSound(
  context: AudioContext,
  soundId: number,
): Promise<AudioBuffer | null> {
  const response = await fetch(soundFilePath(soundId));

  if (response.status === 404 && (soundId === 227 || soundId === 228)) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Ses ${soundId} yüklenemedi: HTTP ${response.status}.`,
    );
  }

  const audioData = await response.arrayBuffer();
  return context.decodeAudioData(audioData);
}

/**
 * Plays a sound by its stable number from the design document.
 * Sounds 227 and 228 use temporary one-ear tones until their OGG files exist.
 */
export async function playSound(soundId: number): Promise<void> {
  if (
    !Number.isInteger(soundId) ||
    soundId < MIN_SOUND_ID ||
    soundId > MAX_SOUND_ID
  ) {
    throw new RangeError(
      `Ses numarası ${MIN_SOUND_ID}-${MAX_SOUND_ID} arasında olmalıdır.`,
    );
  }

  const context = getAudioContext();
  if (context.state === "suspended") {
    await context.resume();
  }

  let buffer = decodedBuffers.get(soundId);
  if (!buffer) {
    buffer = (await loadSound(context, soundId)) ?? undefined;
    if (!buffer) {
      playTemporaryEarTestTone(context, soundId as EarTestSoundId);
      return;
    }
    decodedBuffers.set(soundId, buffer);
  }

  const source = context.createBufferSource();
  const panner = context.createStereoPanner();
  source.buffer = buffer;
  panner.pan.value = soundId === 227 ? -1 : soundId === 228 ? 1 : 0;
  source.connect(panner);
  panner.connect(context.destination);
  source.start();
}
