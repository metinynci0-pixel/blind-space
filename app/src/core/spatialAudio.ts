import { normalizeDegrees } from "./sector";

export type SpatialDistanceBand =
  | "silent"
  | "far"
  | "medium"
  | "near"
  | "proximity";

export interface SpatialAudioProfile {
  band: SpatialDistanceBand;
  audible: boolean;
  pan: number;
  gain: number;
  behind: boolean;
  lowPassFrequencyHz: number;
  cueIntervalMs: number;
}

export function getSpatialAudioProfile(
  distance: number,
  relativeBearingDegrees: number,
): SpatialAudioProfile {
  if (!Number.isFinite(distance) || distance < 0) {
    throw new RangeError("Ses mesafesi negatif olmayan bir sayı olmalıdır.");
  }

  const bearing = normalizeDegrees(relativeBearingDegrees);
  const signedBearing = bearing > 180 ? bearing - 360 : bearing;
  const band: SpatialDistanceBand =
    distance > 2_000
      ? "silent"
      : distance >= 1_000
        ? "far"
        : distance >= 500
          ? "medium"
        : distance >= 150
            ? "near"
            : "proximity";

  const cueIntervalMs: Record<SpatialDistanceBand, number> = {
    silent: 0,
    far: 3_500,
    medium: 2_200,
    near: 1_200,
    proximity: 700,
  };

  return {
    band,
    audible: band !== "silent",
    pan: Math.sin((bearing * Math.PI) / 180),
    gain: band === "silent" ? 0 : Math.max(0.16, 1 - distance / 2_500),
    behind: Math.abs(signedBearing) > 90,
    lowPassFrequencyHz: Math.abs(signedBearing) > 90 ? 2_200 : 12_000,
    cueIntervalMs: cueIntervalMs[band],
  };
}
