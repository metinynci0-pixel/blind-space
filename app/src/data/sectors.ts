import type { SectorObject } from "../core/sector";

export const SECTOR_WORLD_SIZE = 10_000;

export const A2_SECTOR_OBJECTS = [
  {
    id: "a2-return-gate",
    kind: "gate",
    x: 5_000,
    y: 3_500,
    label: "Limana dönüş kapısı",
  },
  {
    id: "a2-ferrit-01",
    kind: "ferrit",
    x: 6_500,
    y: 5_000,
    label: "Ferrit",
  },
] as const;

export const A2_STARFIELD: SectorObject[] = Array.from(
  { length: 28 },
  (_, index) => ({
    id: `a2-star-${index + 1}`,
    kind: "star" as const,
    x: 250 + ((index * 3_713 + 1_129) % 9_500),
    y: 250 + ((index * 6_217 + 2_083) % 9_500),
    label: `Yıldız ${index + 1}`,
  }),
);

export const A2_MAP_OBJECTS: SectorObject[] = [
  ...A2_STARFIELD,
  ...A2_SECTOR_OBJECTS,
];

export const sectors = [
  {
    id: "A-2",
    name: "A-2",
    faction: "Aster",
    worldSize: SECTOR_WORLD_SIZE,
    objects: A2_SECTOR_OBJECTS,
  },
] as const;
