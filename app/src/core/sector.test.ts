import { describe, expect, it } from "vitest";
import {
  DEFAULT_MOVEMENT_DISTANCE,
  moveShip,
  normalizeDegrees,
  turnShip,
} from "./sector";

describe("sector movement", () => {
  it("moves north by the Scout's speed for one tap", () => {
    const result = moveShip(
      { x: 5_000, y: 5_000, headingDegrees: 0 },
      DEFAULT_MOVEMENT_DISTANCE,
    );

    expect(result.pose).toEqual({
      x: 5_000,
      y: 4_700,
      headingDegrees: 0,
    });
    expect(result.reachedBoundary).toBe(false);
  });

  it("clamps movement at the sector boundary", () => {
    const result = moveShip(
      { x: 500, y: 0, headingDegrees: 0 },
      300,
    );

    expect(result.pose.y).toBe(0);
    expect(result.reachedBoundary).toBe(true);
    expect(result.boundaryBearingDegrees).toBe(0);
  });

  it("turns clockwise and counterclockwise in 30-degree steps", () => {
    const pose = { x: 1, y: 2, headingDegrees: 0 };
    expect(turnShip(pose, "right").headingDegrees).toBe(30);
    expect(turnShip(pose, "left").headingDegrees).toBe(330);
  });

  it("normalizes negative and over-360 headings", () => {
    expect(normalizeDegrees(-30)).toBe(330);
    expect(normalizeDegrees(390)).toBe(30);
  });
});
