import { describe, expect, it } from "vitest";
import {
  bearingDegrees,
  clockDirection,
  createRadarSummary,
  formatDirection,
  getNearbyReadings,
  relativeBearingDegrees,
} from "./radar";

const northFacingPose = { x: 5_000, y: 5_000, headingDegrees: 0 };

describe("radar bearings", () => {
  it("uses north as 0 and increases clockwise", () => {
    expect(bearingDegrees(northFacingPose, { x: 5_000, y: 4_000 })).toBe(0);
    expect(bearingDegrees(northFacingPose, { x: 6_000, y: 5_000 })).toBe(90);
    expect(bearingDegrees(northFacingPose, { x: 5_000, y: 6_000 })).toBe(180);
    expect(bearingDegrees(northFacingPose, { x: 4_000, y: 5_000 })).toBe(270);
  });

  it("calculates direction relative to the ship's heading", () => {
    expect(
      relativeBearingDegrees(
        { ...northFacingPose, headingDegrees: 90 },
        { x: 5_000, y: 4_000 },
      ),
    ).toBe(270);
  });

  it("rounds to the nearest clock hour and calls north twelve", () => {
    expect(clockDirection(0)).toBe(12);
    expect(clockDirection(30)).toBe(1);
    expect(clockDirection(345)).toBe(12);
  });

  it("formats clock, left-right, and degree directions", () => {
    expect(formatDirection(90, "clock")).toBe("saat 3");
    expect(formatDirection(135, "left-right")).toBe("sağ arka");
    expect(formatDirection(270, "degrees")).toBe("270 derece");
  });

  it("filters distant targets and sorts nearby targets by distance", () => {
    const readings = getNearbyReadings(northFacingPose, [
      { id: "far", label: "Uzak", kind: "gate", x: 8_000, y: 5_000 },
      { id: "near", label: "Yakın", kind: "ferrit", x: 5_000, y: 4_000 },
    ]);

    expect(readings.map((reading) => reading.object.id)).toEqual(["near"]);
  });

  it("summarizes nearby objects using the requested direction format", () => {
    const summary = createRadarSummary(
      northFacingPose,
      [
        { id: "gate", label: "Limana dönüş kapısı", kind: "gate", x: 5_000, y: 3_500 },
        { id: "ore", label: "Ferrit", kind: "ferrit", x: 6_500, y: 5_000 },
      ],
      "clock",
    );

    expect(summary).toContain("Limana dönüş kapısı, saat 12, 1.500 birim");
    expect(summary).toContain("Ferrit, saat 3, 1.500 birim");
  });
});
