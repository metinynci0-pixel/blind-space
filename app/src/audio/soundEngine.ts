import { getSpatialAudioProfile } from "../core/spatialAudio";
import { SOUND_ID } from "../data/sounds";

const MIN_SOUND_ID = 1;
const MAX_SOUND_ID = 255;

type EarTestSoundId =
  | typeof SOUND_ID.leftEarTest
  | typeof SOUND_ID.rightEarTest;
type TemporarySoundId =
  | typeof SOUND_ID.engineCruise
  | typeof SOUND_ID.shipTurn
  | typeof SOUND_ID.sectorBoundary
  | typeof SOUND_ID.gateSignal
  | typeof SOUND_ID.radarScan
  | typeof SOUND_ID.ferritSignal;
type SpatialSoundId =
  | typeof SOUND_ID.engineCruise
  | typeof SOUND_ID.sectorBoundary
  | typeof SOUND_ID.gateSignal
  | typeof SOUND_ID.ferritSignal;

const TEMPORARY_SOUNDS: Record<
  TemporarySoundId,
  { frequency: number; duration: number; waveform: OscillatorType }
> = {
  [SOUND_ID.engineCruise]: {
    frequency: 92,
    duration: 0.2,
    waveform: "sawtooth",
  },
  [SOUND_ID.shipTurn]: { frequency: 480, duration: 0.12, waveform: "sine" },
  [SOUND_ID.sectorBoundary]: {
    frequency: 130,
    duration: 0.28,
    waveform: "triangle",
  },
  [SOUND_ID.gateSignal]: { frequency: 190, duration: 0.32, waveform: "sine" },
  [SOUND_ID.radarScan]: {
    frequency: 720,
    duration: 0.2,
    waveform: "triangle",
  },
  [SOUND_ID.ferritSignal]: {
    frequency: 580,
    duration: 0.24,
    waveform: "sine",
  },
};

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
  const ear = soundId === SOUND_ID.leftEarTest ? "left" : "right";
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

function playTemporarySound(
  context: AudioContext,
  soundId: TemporarySoundId,
  volume: number,
): void {
  const specification = TEMPORARY_SOUNDS[soundId];
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startTime = context.currentTime;
  oscillator.type = specification.waveform;
  oscillator.frequency.setValueAtTime(specification.frequency, startTime);
  if (soundId === SOUND_ID.radarScan) {
    oscillator.frequency.exponentialRampToValueAtTime(
      specification.frequency * 1.6,
      startTime + specification.duration,
    );
  }

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(
    Math.max(0.001, 0.24 * volume),
    startTime + 0.02,
  );
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + specification.duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + specification.duration + 0.01);
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

export function resumeAudioEngine(): Promise<void> {
  return resumeAudioContext(getAudioContext());
}

export async function playSpatialSound(
  soundId: SpatialSoundId,
  distance: number,
  relativeBearingDegrees: number,
  volume = 1,
): Promise<void> {
  const profile = getSpatialAudioProfile(distance, relativeBearingDegrees);
  if (!profile.audible) {
    return;
  }

  const normalizedVolume = Number.isFinite(volume)
    ? Math.max(0, Math.min(1, volume))
    : 1;
  if (normalizedVolume === 0) {
    return;
  }

  const context = getAudioContext();
  const audioReady = resumeAudioContext(context);
  await audioReady;

  const specification = TEMPORARY_SOUNDS[soundId];
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const startTime = context.currentTime;
  oscillator.type = specification.waveform;
  oscillator.frequency.setValueAtTime(specification.frequency, startTime);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(profile.lowPassFrequencyHz, startTime);
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(
    Math.max(0.001, 0.24 * normalizedVolume * profile.gain),
    startTime + 0.025,
  );
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + specification.duration);

  oscillator.connect(filter);
  filter.connect(gain);

  if (typeof context.createPanner === "function") {
    const panner = context.createPanner();
    const angle = (relativeBearingDegrees * Math.PI) / 180;
    panner.panningModel = "HRTF";
    panner.distanceModel = "linear";
    panner.refDistance = 1;
    panner.maxDistance = 1;
    panner.rolloffFactor = 0;
    panner.positionX.setValueAtTime(Math.sin(angle), startTime);
    panner.positionY.setValueAtTime(0, startTime);
    panner.positionZ.setValueAtTime(-Math.cos(angle), startTime);
    gain.connect(panner);
    panner.connect(context.destination);
  } else if (typeof context.createStereoPanner === "function") {
    const panner = context.createStereoPanner();
    panner.pan.setValueAtTime(profile.pan, startTime);
    gain.connect(panner);
    panner.connect(context.destination);
  } else {
    gain.connect(context.destination);
  }

  oscillator.start(startTime);
  oscillator.stop(startTime + specification.duration + 0.01);
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

  if (
    soundId === SOUND_ID.leftEarTest ||
    soundId === SOUND_ID.rightEarTest
  ) {
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

  if (soundId in TEMPORARY_SOUNDS) {
    await audioReady;
    if (normalizedVolume > 0) {
      playTemporarySound(
        context,
        soundId as TemporarySoundId,
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
