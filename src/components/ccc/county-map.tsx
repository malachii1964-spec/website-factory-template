import { cn } from "@/lib/utils";

/**
 * The signature: a hand-built map of Chautauqua County with a courier route
 * that draws itself between the real towns, a marker running the route, and the
 * Westfield base as a star. Pure SVG + CSS (see globals.css). Reduced-motion
 * users get the route fully drawn and still.
 */

// The animated run: Westfield (base) → Mayville → Bemus Point → Jamestown.
const ROUTE = "M78 150 Q132 168 176 166 T262 196 Q300 214 330 250";

// All coverage nodes on the map (label + position + whether it's the base).
const STOPS: { name: string; x: number; y: number; base?: boolean; onRoute?: boolean }[] = [
  { name: "Dunkirk", x: 150, y: 66 },
  { name: "Fredonia", x: 186, y: 92 },
  { name: "Westfield", x: 78, y: 150, base: true, onRoute: true },
  { name: "Sinclairville", x: 244, y: 120 },
  { name: "Mayville", x: 176, y: 166, onRoute: true },
  { name: "Cassadaga", x: 300, y: 128 },
  { name: "Bemus Point", x: 262, y: 196, onRoute: true },
  { name: "Falconer", x: 356, y: 210 },
  { name: "Jamestown", x: 330, y: 250, onRoute: true },
];

export function CountyMap({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 320"
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label="Route map of Chautauqua County: Westfield, Mayville, Bemus Point, and Jamestown, with coverage across the county."
    >
      {/* Lake Erie edge — a calm teal band along the county's northwest shore */}
      <path
        d="M0 40 Q120 96 210 70 T420 20 L420 0 L0 0 Z"
        fill="var(--color-lake-tint)"
      />
      <path
        d="M0 40 Q120 96 210 70 T420 20"
        fill="none"
        stroke="var(--color-lake)"
        strokeWidth="1.5"
        strokeOpacity="0.55"
      />
      <text
        x="34"
        y="30"
        className="readout"
        fontSize="9"
        letterSpacing="3"
        fill="var(--color-lake)"
        opacity="0.8"
      >
        LAKE ERIE
      </text>

      {/* The county body — a soft hand-drawn blob, grape-tinted */}
      <path
        d="M40 96 Q150 60 250 92 T392 150 Q404 220 340 268 Q250 316 150 288 Q52 262 34 176 Q30 130 40 96 Z"
        fill="color-mix(in oklab, var(--color-grape) 7%, transparent)"
        stroke="color-mix(in oklab, var(--color-grape) 30%, transparent)"
        strokeWidth="1.5"
        strokeDasharray="2 5"
      />

      {/* The route the courier runs — drawn once, then a marker follows it */}
      <path
        d={ROUTE}
        pathLength={1}
        className="route-line"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* The courier marker, running the route via CSS offset-path */}
      <circle
        r="5"
        className="courier-dot"
        fill="var(--color-accent)"
        stroke="var(--color-surface)"
        strokeWidth="2"
        style={{ offsetPath: `path("${ROUTE}")` } as React.CSSProperties}
      />

      {/* Stops */}
      {STOPS.map((s, i) => (
        <g
          key={s.name}
          className="map-pin"
          style={{ animationDelay: `${0.5 + i * 0.12}s` }}
        >
          {s.base ? (
            <>
              {/* Westfield — the base — a marigold star */}
              <circle cx={s.x} cy={s.y} r="9" fill="var(--color-accent)" opacity="0.18" />
              <path
                d={star(s.x, s.y, 6.5, 3)}
                fill="var(--color-accent)"
                stroke="var(--color-surface)"
                strokeWidth="1"
              />
            </>
          ) : (
            <circle
              cx={s.x}
              cy={s.y}
              r={s.onRoute ? 4.5 : 3.5}
              fill={s.onRoute ? "var(--color-accent)" : "var(--color-grape)"}
              stroke="var(--color-surface)"
              strokeWidth="1.5"
            />
          )}
          <text
            x={s.x > 288 ? s.x - (s.base ? 12 : 8) : s.x + (s.base ? 12 : 8)}
            y={s.y + 3.8}
            textAnchor={s.x > 288 ? "end" : "start"}
            className="readout"
            fontSize="12"
            fontWeight={s.onRoute ? 600 : 500}
            fill="var(--color-foreground)"
            fillOpacity={s.onRoute ? 0.95 : 0.82}
          >
            {s.name}
          </text>
        </g>
      ))}
    </svg>
  );
}

// Small 5-point star path centered at (cx, cy).
function star(cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
}
