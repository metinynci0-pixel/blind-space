import type { DirectionAnnouncementFormat } from "../a11y/settings";
import type { Position, ShipPose } from "./sector";
import { distanceBetween, normalizeDegrees } from "./sector";

export interface RadarObject {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: "gate" | "ferrit";
}

export interface RadarReading {
  object: RadarObject;
  distance: number;
  relativeBearingDegrees: number;
}

export const RADAR_MAX_DISTANCE = 2_000;
export const RADAR_COOLDOWN_MS = 4_000;

export function bearingDegrees(
  start: Position,
  target: Position,
): number {
  const deltaX = target.x - start.x;
  const deltaY = target.y - start.y;
  if (deltaX === 0 && deltaY === 0) {
    return 0;
  }
  return normalizeDegrees((Math.atan2(deltaX, -deltaY) * 180) / Math.PI);
}

export function relativeBearingDegrees(
  pose: ShipPose,
  target: Position,
): number {
  return normalizeDegrees(bearingDegrees(pose, target) - pose.headingDegrees);
}

export function clockDirection(relativeDegrees: number): number {
  const hour = Math.round(normalizeDegrees(relativeDegrees) / 30) % 12;
  return hour === 0 ? 12 : hour;
}

export function leftRightDirection(relativeDegrees: number): string {
  const bearing = normalizeDegrees(relativeDegrees);
  if (bearing < 22.5 || bearing >= 337.5) return "ön";
  if (bearing < 67.5) return "sağ ön";
  if (bearing < 112.5) return "sağ";
  if (bearing < 157.5) return "sağ arka";
  if (bearing < 202.5) return "arka";
  if (bearing < 247.5) return "sol arka";
  if (bearing < 292.5) return "sol";
  return "sol ön";
}

export function formatDirection(
  relativeDegrees: number,
  format: DirectionAnnouncementFormat,
): string {
  const normalized = normalizeDegrees(relativeDegrees);
  if (format === "degrees") {
    return `${Math.round(normalized)} derece`;
  }
  if (format === "left-right") {
    return leftRightDirection(normalized);
  }
  return `saat ${clockDirection(normalized)}`;
}

export function getNearbyReadings(
  pose: ShipPose,
  objects: readonly RadarObject[],
  maxDistance = RADAR_MAX_DISTANCE,
): RadarReading[] {
  return objects
    .map((object) => ({
      object,
      distance: distanceBetween(pose, object),
      relativeBearingDegrees: relativeBearingDegrees(pose, object),
    }))
    .filter((reading) => reading.distance <= maxDistance)
    .sort((left, right) => left.distance - right.distance);
}

export function createRadarSummary(
  pose: ShipPose,
  objects: readonly RadarObject[],
  format: DirectionAnnouncementFormat,
): string {
  const readings = getNearbyReadings(pose, objects);
  if (readings.length === 0) {
    return `Radar özeti. ${RADAR_MAX_DISTANCE.toLocaleString("tr-TR")} birim içinde nesne yok.`;
  }

  const descriptions = readings.map(({ object, distance, relativeBearingDegrees }) => {
    const roundedDistance = Math.round(distance / 10) * 10;
    return `${object.label}, ${formatDirection(relativeBearingDegrees, format)}, ${roundedDistance.toLocaleString("tr-TR")} birim`;
  });
  return `Radar özeti. ${descriptions.join(". ")}.`;
}

