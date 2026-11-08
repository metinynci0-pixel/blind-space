import { describe, expect, it } from "vitest";
import { getSpatialAudioProfile } from "./spatialAudio";

describe("spatial audio profile", () => {
  it("silences objects beyond 2,000 units", () => {
    const profile = getSpatialAudioProfile(2_001, 90);
    expect(profile.band).toBe("silent");
    expect(profile.audible).toBe(false);
    expect(profile.gain).toBe(0);
  });

  it("increases cue frequency and level as an object gets closer", () => {
    const far = getSpatialAudioProfile(1_500, 0);
    const near = getSpatialAudioProfile(300, 0);
    expect(far.band).toBe("far");
    expect(near.band).toBe("near");
    expect(near.cueIntervalMs).toBeLessThan(far.cueIntervalMs);
    expect(near.gain).toBeGreaterThan(far.gain);
  });

  it("pans right and muffles objects behind the ship", () => {
    const right = getSpatialAudioProfile(500, 90);
    const behind = getSpatialAudioProfile(500, 180);
    const left = getSpatialAudioProfile(500, 270);

    expect(right.pan).toBeCloseTo(1);
    expect(left.pan).toBeCloseTo(-1);
    expect(behind.behind).toBe(true);
    expect(behind.lowPassFrequencyHz).toBeLessThan(right.lowPassFrequencyHz);
  });
});
