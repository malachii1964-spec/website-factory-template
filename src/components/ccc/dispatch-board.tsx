"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Phone, RotateCcw, ArrowRight, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { TOWNS, townByName, type Town } from "@/lib/towns";
import {
  EMPTY_RUN,
  MAX_STOPS,
  type RunState,
  tapTown,
  setPickup,
  setDropoff,
  addStop,
  removeStop,
  runPoints,
} from "@/lib/run-select";
import { estimateRun, usd } from "@/lib/estimate";
import { site, formatPhone, telHref } from "@/lib/site";

// Gently-arced path through the ordered stops (compositor-friendly draw).
function buildPath(points: Town[]): string {
  if (points.length < 2) return "";
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - 14;
    d += ` Q${mx} ${my} ${b.x} ${b.y}`;
  }
  return d;
}

function star(cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
}

const selectCls =
  "min-h-11 w-full rounded-md border border-border bg-background px-2.5 text-sm focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function DispatchBoard() {
  const [run, setRun] = useState<RunState>(EMPTY_RUN);
  const { pickup, dropoff, stops } = run;
  const pathRef = useRef<SVGPathElement | null>(null);
  const dotRef = useRef<SVGCircleElement | null>(null);

  const points = useMemo(() => runPoints(run), [run]);
  const routeD = useMemo(() => buildPath(points), [points]);
  const estimate = pickup && dropoff ? estimateRun(pickup, dropoff, stops) : null;

  function roleOf(t: Town) {
    if (t === pickup) return "pickup" as const;
    if (t === dropoff) return "dropoff" as const;
    if (stops.includes(t)) return "stop" as const;
    return null;
  }

  // Draw the route + run the courier marker on each change (WAAPI, reduced-motion
  // safe). Animations are cancelled on cleanup so they don't accumulate.
  useEffect(() => {
    const path = pathRef.current;
    const dot = dotRef.current;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const anims: Animation[] = [];

    if (path && routeD) {
      const len = path.getTotalLength();
      path.style.strokeDasharray = `${len}`;
      if (reduce) {
        path.style.strokeDashoffset = "0";
      } else {
        anims.push(
          path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
            duration: 620,
            easing: "cubic-bezier(.65,0,.35,1)",
            fill: "forwards",
          }),
        );
      }
    }
    if (dot && routeD) {
      dot.style.setProperty("offset-path", `path('${routeD}')`);
      dot.style.opacity = "1";
      if (reduce) {
        dot.style.setProperty("offset-distance", "100%");
      } else {
        anims.push(
          dot.animate([{ offsetDistance: "0%" }, { offsetDistance: "100%" }], {
            duration: 1500,
            easing: "cubic-bezier(.5,0,.5,1)",
            fill: "forwards",
          }),
        );
      }
    }
    if (dot && !routeD) dot.style.opacity = "0";

    return () => anims.forEach((a) => a.cancel());
  }, [routeD]);

  const instruction = !pickup
    ? "Tap the map — or use the menus — to set your pickup."
    : !dropoff
      ? "Now set where it's going."
      : stops.length < MAX_STOPS
        ? "Add a stop, or send your run."
        : "Looks good — send your run.";

  const sendHref = (() => {
    if (!pickup || !dropoff) return "/request";
    const via = stops.length ? ` via ${stops.map((s) => s.name).join(", ")}` : "";
    const ball = estimate ? ` Ballpark ${usd(estimate.low)}–${usd(estimate.high)}.` : "";
    const details = `Run from ${pickup.name} to ${dropoff.name}${via}.${ball}`;
    const type = stops.length ? "Multi-stop run" : "Delivery";
    const q = new URLSearchParams({ type, pickup: pickup.name, dropoff: dropoff.name, details });
    return `/request?${q.toString()}`;
  })();

  const stopOptions = TOWNS.filter(
    (t) => t !== pickup && t !== dropoff && !stops.includes(t),
  );

  return (
    <div>
      <div className="ticket p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow eyebrow-grape flex items-center gap-2">
            <span className="status-dot" aria-hidden /> Dispatch board
          </p>
          <button
            type="button"
            onClick={() => setRun(EMPTY_RUN)}
            className="readout inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        {/* Decorative + pointer-enhancement map. The menus below are the
            accessible, reliable input on every device. */}
        <svg viewBox="0 0 420 320" className="h-auto w-full" aria-hidden>
          <path d="M0 40 Q120 96 210 70 T420 20 L420 0 L0 0 Z" fill="var(--color-lake-tint)" />
          <path d="M0 40 Q120 96 210 70 T420 20" fill="none" stroke="var(--color-lake)" strokeWidth="1.5" strokeOpacity="0.55" />
          <text x="34" y="30" className="readout" fontSize="9" letterSpacing="3" fill="var(--color-lake)" opacity="0.8">LAKE ERIE</text>

          <path
            d="M40 96 Q150 60 250 92 T392 150 Q404 220 340 268 Q250 316 150 288 Q52 262 34 176 Q30 130 40 96 Z"
            fill="color-mix(in oklab, var(--color-grape) 7%, transparent)"
            stroke="color-mix(in oklab, var(--color-grape) 30%, transparent)"
            strokeWidth="1.5"
            strokeDasharray="2 5"
          />

          <path ref={pathRef} d={routeD} fill="none" stroke="var(--color-accent-hover)" strokeWidth="3.5" strokeLinecap="round" />
          <circle ref={dotRef} r="5" fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth="2" style={{ opacity: 0 }} />

          {TOWNS.map((t) => {
            const role = roleOf(t);
            const active = role !== null;
            const color =
              role === "pickup" ? "var(--color-accent)" : role === "dropoff" ? "var(--color-grape)" : role === "stop" ? "var(--color-lake)" : "var(--color-grape)";
            const badge = role === "pickup" ? "A" : role === "dropoff" ? "B" : role === "stop" ? "•" : null;
            return (
              <g key={t.name} className="dispatch-node" onClick={() => setRun((s) => tapTown(s, t))} style={{ cursor: "pointer" }}>
                {/* Enlarged transparent hit area for pointer/touch */}
                <circle cx={t.x} cy={t.y} r="16" fill="transparent" />
                {active && <circle cx={t.x} cy={t.y} r="11" fill={color} opacity="0.16" />}
                {t.base ? (
                  <path d={star(t.x, t.y, 6.5, 3)} fill="var(--color-accent)" stroke="var(--color-surface)" strokeWidth="1" />
                ) : (
                  <circle cx={t.x} cy={t.y} r={active ? 5.5 : 4} fill={color} stroke="var(--color-surface)" strokeWidth="1.5" />
                )}
                {badge && badge !== "•" && (
                  <text x={t.x} y={t.y - 12} textAnchor="middle" className="readout" fontSize="10" fontWeight="700" fill={color}>
                    {badge}
                  </text>
                )}
                <text
                  x={t.x > 288 ? t.x - 9 : t.x + 9}
                  y={t.y + 3.8}
                  textAnchor={t.x > 288 ? "end" : "start"}
                  className="readout"
                  fontSize="12"
                  fontWeight={active ? 700 : 500}
                  fill="var(--color-foreground)"
                  fillOpacity={active ? 1 : 0.72}
                  paintOrder="stroke"
                  stroke="var(--color-surface)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                >
                  {t.name}
                </text>
              </g>
            );
          })}
        </svg>

        <p className="readout mt-2 text-center text-xs text-muted-foreground" aria-live="polite">
          {instruction}
        </p>

        {/* The accessible, reliable controls */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="readout mb-1 block text-[0.7rem] text-muted-foreground">Pick up in</span>
            <select
              className={selectCls}
              value={pickup?.name ?? ""}
              onChange={(e) => setRun((s) => setPickup(s, townByName(e.target.value)))}
            >
              <option value="">Choose a town…</option>
              {TOWNS.map((t) => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="readout mb-1 block text-[0.7rem] text-muted-foreground">Drop off in</span>
            <select
              className={selectCls}
              value={dropoff?.name ?? ""}
              onChange={(e) => setRun((s) => setDropoff(s, townByName(e.target.value)))}
            >
              <option value="">Choose a town…</option>
              {TOWNS.filter((t) => t !== pickup).map((t) => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Add-a-stop control — keyboard/screen-reader path to multi-stop runs */}
        {pickup && dropoff && (
          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              {stops.map((s) => (
                <span key={s.name} className="readout inline-flex items-center gap-1 rounded-md bg-lake-tint px-2 py-1 text-xs text-lake">
                  {s.name}
                  <button
                    type="button"
                    aria-label={`Remove stop ${s.name}`}
                    onClick={() => setRun((st) => removeStop(st, s))}
                    className="rounded hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {stops.length < MAX_STOPS && stopOptions.length > 0 && (
                <label className="inline-flex items-center gap-2">
                  <span className="sr-only">Add a stop</span>
                  <select
                    className="min-h-9 rounded-md border border-dashed border-border-strong bg-transparent px-2 text-xs text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    value=""
                    onChange={(e) => {
                      const t = townByName(e.target.value);
                      if (t) setRun((s) => addStop(s, t));
                    }}
                  >
                    <option value="">+ Add a stop</option>
                    {stopOptions.map((t) => (
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>
        )}
      </div>

      {/* The manifest — assembles once a run is set. key replays the settle. */}
      {estimate && pickup && dropoff && (
        <div key={`${pickup.name}-${dropoff.name}-${stops.length}`} className="ticket ticket--perf fade-up mt-3 p-5 pt-7">
          <div className="flex items-center justify-between">
            <p className="readout text-xs text-muted-foreground">Run manifest</p>
            <p className="readout text-xs text-lake">Ballpark</p>
          </div>
          <p className="mt-1 font-display text-lg font-bold">
            {pickup.name} → {stops.map((s) => `${s.name} → `).join("")}{dropoff.name}
          </p>
          <dl className="mt-4 space-y-1.5">
            {estimate.parts.map((p) => (
              <div key={p.label} className="flex items-baseline justify-between text-sm">
                <dt className="text-muted-foreground">{p.label}</dt>
                <dd className="readout tabular-nums">{usd(p.amount)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
            <span className="font-semibold">Ballpark</span>
            <span className="font-display text-2xl font-bold text-grape">
              {usd(estimate.low)}<span className="text-muted-foreground">–</span>{usd(estimate.high)}
            </span>
          </div>
          <p className="readout mt-1 text-xs text-muted-foreground">
            Your locked price comes after we talk. No charge to ask.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link href={sendHref} className={buttonVariants({ size: "md" })}>
              Send this run <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={telHref(site.phoneDigits)} className={buttonVariants({ variant: "outline", size: "md" })}>
              <Phone className="h-4 w-4" /> Call {formatPhone(site.phoneDigits)}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
