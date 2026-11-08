export const ships = [
  {
    id: "izci",
    name: "İzci",
    hull: 12_000,
    shield: 6_000,
    speed: 300,
    weaponSlots: 2,
    moduleSlots: 1,
    cargo: 100,
    specialAbility: "Kısa İtki",
  },
] as const;

export const INITIAL_SCOUT_POSE = {
  x: 5_000,
  y: 5_000,
  headingDegrees: 0,
} as const;
