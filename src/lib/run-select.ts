import { type Town } from "./towns";

// Pure selection state + invariants for the Dispatch Board, extracted so the
// rules are unit-testable (a pickup can't equal a dropoff, a town can't be both
// an endpoint and a stop, max 2 stops).
export type RunState = { pickup: Town | null; dropoff: Town | null; stops: Town[] };

export const EMPTY_RUN: RunState = { pickup: null, dropoff: null, stops: [] };

export const MAX_STOPS = 2;

export function setPickup(s: RunState, t: Town | null): RunState {
  if (!t) return { ...s, pickup: null };
  return {
    pickup: t,
    dropoff: s.dropoff === t ? null : s.dropoff, // can't pick up where you drop off
    stops: s.stops.filter((x) => x !== t), // a town can't be an endpoint and a stop
  };
}

export function setDropoff(s: RunState, t: Town | null): RunState {
  if (!t) return { ...s, dropoff: null };
  if (t === s.pickup) return s; // ignore: dropoff can't equal pickup
  return { ...s, dropoff: t, stops: s.stops.filter((x) => x !== t) };
}

export function addStop(s: RunState, t: Town): RunState {
  if (!s.pickup || !s.dropoff) return s;
  if (t === s.pickup || t === s.dropoff || s.stops.includes(t)) return s;
  if (s.stops.length >= MAX_STOPS) return s;
  return { ...s, stops: [...s.stops, t] };
}

export function removeStop(s: RunState, t: Town): RunState {
  return { ...s, stops: s.stops.filter((x) => x !== t) };
}

/** Tapping a town on the map: fill pickup, then dropoff, then stops. */
export function tapTown(s: RunState, t: Town): RunState {
  if (!s.pickup) return setPickup(s, t);
  if (!s.dropoff) return setDropoff(s, t);
  return addStop(s, t);
}

/** Ordered points for the route, or [] until both endpoints are set. */
export function runPoints(s: RunState): Town[] {
  if (s.pickup && s.dropoff) return [s.pickup, ...s.stops, s.dropoff];
  return [];
}
