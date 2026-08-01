// The real Chautauqua County towns the courier serves, positioned on the map
// canvas (viewBox 0 0 420 320). Single source of truth for the Dispatch Board.
export type Town = { name: string; x: number; y: number; base?: boolean };

export const MAP_W = 420;
export const MAP_H = 320;

export const TOWNS: Town[] = [
  { name: "Dunkirk", x: 150, y: 66 },
  { name: "Fredonia", x: 186, y: 92 },
  { name: "Westfield", x: 78, y: 150, base: true },
  { name: "Sinclairville", x: 244, y: 120 },
  { name: "Mayville", x: 176, y: 166 },
  { name: "Cassadaga", x: 300, y: 128 },
  { name: "Bemus Point", x: 262, y: 196 },
  { name: "Falconer", x: 356, y: 210 },
  { name: "Jamestown", x: 330, y: 250 },
];

export function townByName(name?: string | null): Town | null {
  if (!name) return null;
  return TOWNS.find((t) => t.name === name) ?? null;
}

export function unitDist(a: Town, b: Town): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
