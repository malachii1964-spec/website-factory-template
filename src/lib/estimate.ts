import { type Town, unitDist } from "./towns";

// PLACEHOLDER rates — clearly a ballpark, NOT a quote. pricing-strategist swaps
// these for real numbers once the owner provides vehicle/cost inputs. The UI
// always labels the output "ballpark — your locked price comes after we talk."
export const RATES = {
  dispatchMin: 12, // flat minimum per run ($)
  perMile: 1.15, // $ per road mile
  perMinute: 0.4, // $ per minute of service time
  perStop: 5, // $ per extra stop
  milesPerUnit: 0.08, // map-unit → mile scale (abstract map, ballpark only)
  roadFactor: 1.3, // roads aren't straight lines
} as const;

export type EstPart = { label: string; amount: number };
export type Estimate = {
  miles: number;
  minutes: number;
  parts: EstPart[];
  subtotal: number;
  low: number;
  high: number;
};

/** Total road miles across an ordered list of stops (pickup → … → dropoff). */
export function routeMiles(points: Town[]): number {
  let units = 0;
  for (let i = 1; i < points.length; i++) units += unitDist(points[i - 1], points[i]);
  return units * RATES.milesPerUnit * RATES.roadFactor;
}

export function estimateRun(pickup: Town, dropoff: Town, stops: Town[] = []): Estimate {
  const miles = routeMiles([pickup, ...stops, dropoff]);
  const minutes = Math.round(10 + miles * 1.2 + stops.length * 8);
  // Round each displayed part so the line items always sum to the shown total.
  const parts: EstPart[] = [
    { label: "Dispatch minimum", amount: RATES.dispatchMin },
    { label: `Route mileage · ~${Math.round(miles)} mi`, amount: Math.round(miles * RATES.perMile) },
    { label: `Service time · ~${minutes} min`, amount: Math.round(minutes * RATES.perMinute) },
    { label: `Extra stops · ${stops.length}`, amount: stops.length * RATES.perStop },
  ];
  const subtotal = parts.reduce((sum, p) => sum + p.amount, 0);
  return {
    miles,
    minutes,
    parts,
    subtotal,
    low: Math.round(subtotal * 0.9),
    high: Math.round(subtotal * 1.1),
  };
}

export function usd(n: number): string {
  return `$${Math.round(n)}`;
}
