/**
 * Grow journals — the schedule side, kept pure and testable.
 *
 * A journal stores only the grower's inputs (method, pot size, plants, the
 * day they potted up) and which events they have ticked off. The schedule is
 * derived from the method module every time it is read, so when a method's
 * data is corrected or refined, every existing journal picks the change up
 * instead of being frozen at whatever the numbers said the day it started.
 *
 * Nothing here touches the database or the session — see grow-journals.ts for
 * that. Keeping the two apart is what makes this file unit-testable.
 */

import {
  addDays,
  type Dose,
  doseSchedule,
  METHOD_EVENTS,
} from "@/lib/canucks-method";

export type MethodDefinition = {
  slug: string;
  /** Grower page this method belongs to. */
  growerSlug: string;
  name: string;
  /** Short line shown on the journal. */
  summary: string;
  schedule: (potGallons: number, plants: number) => Dose[];
  /** Weeks from pot-up to the last event — used for the progress read-out. */
  totalWeeks: number;
};

/**
 * Methods that can seed a journal. Only Mr. Canucks Grow is modelled in
 * enough detail so far; the shape is here so adding the next one is data.
 */
export const METHODS: MethodDefinition[] = [
  {
    slug: "mr-canucks-grow",
    growerSlug: "mr-canucks-grow",
    name: "Mr. Canucks Grow",
    summary:
      "Dry amendments, plain pH'd water, one top-dress every three weeks with the ratio ramping toward bloom.",
    schedule: doseSchedule,
    totalWeeks: METHOD_EVENTS[METHOD_EVENTS.length - 1].week,
  },
];

export function getMethod(slug: string): MethodDefinition | undefined {
  return METHODS.find((m) => m.slug === slug);
}

export const POT_SIZES = [1, 3, 5, 7, 10, 15] as const;
export const MAX_PLANTS = 24;

/* --------------------------------------------------------------- state --- */

export type TaskState = "done" | "due" | "upcoming";

export type JournalTask = Dose & {
  date: Date;
  done: boolean;
  state: TaskState;
};

/**
 * Merge a method's schedule with the grower's completions and today's date.
 *
 * "due" means the date has arrived and it is not ticked — that is the only
 * thing the grower needs to act on. Everything before it is either done or
 * overdue (still "due", deliberately: an overdue top-dress does not stop
 * being something you must do).
 */
export function buildTasks(
  method: MethodDefinition,
  opts: {
    potGallons: number;
    plants: number;
    startedOn: Date;
    doneEventIds: Iterable<string>;
    today?: Date;
  },
): JournalTask[] {
  const done = new Set(opts.doneEventIds);
  const now = opts.today ?? new Date();
  // Compare by calendar day: a task dated today is due from midnight, not
  // from whatever time of day the row happens to carry.
  const todayStart = startOfDay(now);

  return method.schedule(opts.potGallons, opts.plants).map((dose) => {
    const date = addDays(opts.startedOn, dose.dayOffset);
    const isDone = done.has(dose.event.id);
    return {
      ...dose,
      date,
      done: isDone,
      state: isDone
        ? "done"
        : startOfDay(date) <= todayStart
          ? "due"
          : "upcoming",
    };
  });
}

function startOfDay(d: Date): Date {
  const x = new Date(d.getTime());
  x.setHours(0, 0, 0, 0);
  return x;
}

/** The single thing to show at the top of a journal: what to do next. */
export function nextAction(tasks: JournalTask[]): JournalTask | null {
  return tasks.find((t) => t.state === "due") ?? tasks.find((t) => !t.done) ?? null;
}

export function progress(tasks: JournalTask[]): {
  done: number;
  total: number;
  pct: number;
} {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/** Whole days from pot-up to today, floored at 0 (a future start is day 0). */
export function dayOfGrow(startedOn: Date, today = new Date()): number {
  const ms = startOfDay(today).getTime() - startOfDay(startedOn).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

/* ---------------------------------------------------------- validation --- */

export function normalisePotGallons(n: number): number {
  const allowed = POT_SIZES as readonly number[];
  return allowed.includes(n) ? n : 5;
}

export function normalisePlants(n: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_PLANTS, Math.max(1, Math.round(n)));
}

/** A default journal name that reads like something a person wrote. */
export function defaultGrowName(method: MethodDefinition, startedOn: Date): string {
  const month = startedOn.toLocaleDateString("en-US", { month: "long" });
  return `${month} grow — ${method.name} method`;
}
