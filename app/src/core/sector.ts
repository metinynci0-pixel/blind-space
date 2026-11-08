export const DEFAULT_SECTOR_SIZE = 10_000;
export const DEFAULT_MOVEMENT_DISTANCE = 300;
export const TURN_STEP_DEGREES = 30;

export interface Position {
  x: number;
  y: number;
}

export interface ShipPose extends Position {
  /** Clockwise from north; north is zero degrees. */
  headingDegrees: number;
}

export interface SectorObject {
  id: string;
  kind: "star" | "ferrit" | "gate";
  x: number;
  y: number;
  label: string;
}

export interface MovementResult {
  pose: ShipPose;
  reachedBoundary: boolean;
  boundaryBearingDegrees: number;
}

export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function turnShip(
  pose: ShipPose,
  direction: "left" | "right",
  stepDegrees = TURN_STEP_DEGREES,
): ShipPose {
  const delta = direction === "left" ? -stepDegrees : stepDegrees;
  return {
    ...pose,
    headingDegrees: normalizeDegrees(pose.headingDegrees + delta),
  };
}

export function moveShip(
  pose: ShipPose,
  distance = DEFAULT_MOVEMENT_DISTANCE,
  worldSize = DEFAULT_SECTOR_SIZE,
): MovementResult {
  if (!Number.isFinite(distance) || distance < 0) {
    throw new RangeError("Hareket mesafesi negatif olmayan bir sayı olmalıdır.");
  }
  if (!Number.isFinite(worldSize) || worldSize <= 0) {
    throw new RangeError("Sektör boyutu pozitif bir sayı olmalıdır.");
  }

  const headingRadians = (normalizeDegrees(pose.headingDegrees) * Math.PI) / 180;
  const rawDeltaX = Math.sin(headingRadians) * distance;
  const rawDeltaY = -Math.cos(headingRadians) * distance;
  const deltaX = Math.abs(rawDeltaX) < 1e-10 ? 0 : rawDeltaX;
  const deltaY = Math.abs(rawDeltaY) < 1e-10 ? 0 : rawDeltaY;
  const attemptedX = pose.x + deltaX;
  const attemptedY = pose.y + deltaY;
  const reachedBoundary =
    (deltaX < 0 && attemptedX <= 0) ||
    (deltaX > 0 && attemptedX >= worldSize) ||
    (deltaY < 0 && attemptedY <= 0) ||
    (deltaY > 0 && attemptedY >= worldSize);
  const x = Math.min(worldSize, Math.max(0, attemptedX));
  const y = Math.min(worldSize, Math.max(0, attemptedY));

  return {
    pose: { x, y, headingDegrees: normalizeDegrees(pose.headingDegrees) },
    reachedBoundary,
    boundaryBearingDegrees: normalizeDegrees(
      (Math.atan2(deltaX, -deltaY) * 180) / Math.PI,
    ),
  };
}

export function distanceBetween(start: Position, end: Position): number {
  return Math.hypot(end.x - start.x, end.y - start.y);
}
