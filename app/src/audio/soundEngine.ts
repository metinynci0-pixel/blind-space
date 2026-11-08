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
  const basePath = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${basePath}sounds/ses_${String(soundId).padStart(3, "0")}.ogg`;
}

function connectToEar(
  context: AudioContext,
  gain: GainNode,
  ear: "left" | "right",
): void {
  if (typeof context.createStereoPanner === "function") {
    const panner = context.createStereoPanner();
    panner.pan.setValueAtTime(ear === "left" ? -1 : 1, context.currentTime);
    gain.connect(panner);
    panner.connect(context.destination);
    return;
  }

  const channelMerger = context.createChannelMerger(2);
  gain.connect(channelMerger, 0, ear === "left" ? 0 : 1);
  channelMerger.connect(context.destination);
}

function playTemporaryEarTestTone(
  context: AudioContext,
  soundId: EarTestSoundId,
  volume: number,
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const ear = soundId === 227 ? "left" : "right";
  const startTime = context.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.value = ear === "left" ? 440 : 660;
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.35 * volume, startTime + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);

  oscillator.connect(gain);
  connectToEar(context, gain, ear);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.34);
}

function resumeAudioContext(context: AudioContext): Promise<void> {
  if (context.state === "running") {
    return Promise.resolve();
  }

  return context.resume().then(() => {
    if (context.state !== "running") {
      throw new Error("Ses motoru başlatılamadı.");
    }
  });
}

async function loadSound(
  context: AudioContext,
  soundId: number,
): Promise<AudioBuffer> {
  const response = await fetch(soundFilePath(soundId));

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
export async function playSound(soundId: number, volume = 1): Promise<void> {
  if (
    !Number.isInteger(soundId) ||
    soundId < MIN_SOUND_ID ||
    soundId > MAX_SOUND_ID
  ) {
    throw new RangeError(
      `Ses numarası ${MIN_SOUND_ID}-${MAX_SOUND_ID} arasında olmalıdır.`,
    );
  }

  const normalizedVolume = Number.isFinite(volume)
    ? Math.max(0, Math.min(1, volume))
    : 1;
  const context = getAudioContext();
  // Call resume synchronously from the button gesture, before the first await.
  const audioReady = resumeAudioContext(context);

  if (soundId === 227 || soundId === 228) {
    await audioReady;
    if (normalizedVolume > 0) {
      playTemporaryEarTestTone(
        context,
        soundId as EarTestSoundId,
        normalizedVolume,
      );
    }
    return;
  }

  await audioReady;
  if (normalizedVolume === 0) {
    return;
  }

  let buffer = decodedBuffers.get(soundId);
  if (!buffer) {
    buffer = await loadSound(context, soundId);
    decodedBuffers.set(soundId, buffer);
  }

  const source = context.createBufferSource();
  const gain = context.createGain();
  const panner = context.createStereoPanner();
  source.buffer = buffer;
  gain.gain.value = normalizedVolume;
  source.connect(gain);
  gain.connect(panner);
  panner.connect(context.destination);
  source.start();
}
