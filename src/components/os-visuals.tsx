/**
 * Mini generative visuals for the Knowledge-OS module cards — each card in
 * the reference mockups has its own "scene." Tiny inline SVGs, no images.
 */

export function GalaxySpiral({ className = "" }: { className?: string }) {
  const dots = Array.from({ length: 60 }, (_, i) => {
    const t = i / 60;
    const a = t * Math.PI * 5;
    const r = 4 + t * 46;
    return {
      x: 60 + Math.cos(a) * r,
      y: 50 + Math.sin(a) * r * 0.62,
      s: 0.7 + (1 - t) * 1.5,
      o: 0.25 + (1 - t) * 0.75,
    };
  });
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <radialGradient id="galCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="40%" stopColor="var(--violet)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--violet)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="50" rx="34" ry="22" fill="url(#galCore)" />
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.s}
          fill={i % 3 === 0 ? "var(--magenta)" : i % 3 === 1 ? "var(--violet)" : "var(--cyan)"}
          opacity={d.o}
        />
      ))}
    </svg>
  );
}

export function MiniSprout({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="sproutG" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#1d7a41" />
          <stop offset="100%" stopColor="var(--lime)" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="86" rx="34" ry="7" fill="var(--cyan)" opacity="0.25" />
      <ellipse cx="60" cy="86" rx="22" ry="4.5" fill="none" stroke="var(--cyan)" strokeWidth="1" opacity="0.6" />
      <path d="M60 84 L60 38" stroke="url(#sproutG)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M60 62 C40 60 30 46 28 30 C46 32 58 44 60 62 Z" fill="url(#sproutG)" opacity="0.9" />
      <path d="M60 62 C80 60 90 46 92 30 C74 32 62 44 60 62 Z" fill="url(#sproutG)" opacity="0.75" />
      <path d="M60 40 C52 32 50 22 52 12 C62 18 64 30 60 40 Z" fill="var(--cyan)" opacity="0.85" />
      <circle cx="60" cy="36" r="7" fill="var(--lime)" opacity="0.35" />
    </svg>
  );
}

export function LotusFigure({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="lotusG" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--magenta)" />
          <stop offset="100%" stopColor="var(--violet)" />
        </linearGradient>
      </defs>
      {/* aura */}
      <circle cx="60" cy="46" r="30" fill="var(--violet)" opacity="0.16" />
      <circle cx="60" cy="46" r="30" fill="none" stroke="url(#lotusG)" strokeWidth="0.8" opacity="0.6" strokeDasharray="2 5" />
      {/* figure */}
      <circle cx="60" cy="30" r="7" fill="url(#lotusG)" />
      <path d="M60 39 C48 42 44 52 44 62 L76 62 C76 52 72 42 60 39 Z" fill="url(#lotusG)" opacity="0.9" />
      <path d="M44 60 C36 64 34 68 35 71 L60 66 L85 71 C86 68 84 64 76 60" fill="url(#lotusG)" opacity="0.7" />
      {/* lotus petals */}
      <g fill="var(--magenta)" opacity="0.8">
        <path d="M60 88 C54 80 54 74 60 68 C66 74 66 80 60 88 Z" />
        <path d="M46 86 C44 79 47 73 54 70 C56 77 53 83 46 86 Z" />
        <path d="M74 86 C76 79 73 73 66 70 C64 77 67 83 74 86 Z" />
      </g>
    </svg>
  );
}

export function GemCluster({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="gemG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--magenta)" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="84" rx="30" ry="6" fill="var(--gold)" opacity="0.2" />
      <polygon points="60,18 76,38 68,78 52,78 44,38" fill="url(#gemG)" opacity="0.85" stroke="var(--gold)" strokeWidth="1" />
      <polygon points="60,18 60,78 52,78 44,38" fill="#000" opacity="0.25" />
      <polygon points="36,48 46,58 42,80 30,72" fill="url(#gemG)" opacity="0.6" />
      <polygon points="86,52 92,64 84,80 76,68" fill="url(#gemG)" opacity="0.6" />
      <path d="M60 6 Q61.5 16.5 72 18 Q61.5 19.5 60 30 Q58.5 19.5 48 18 Q58.5 16.5 60 6 Z" fill="#fff" opacity="0.9" />
    </svg>
  );
}

/** Rough-but-recognizable New York State silhouette with a beacon on WNY. */
export function NYMap({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="nyG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--cyan)" />
          <stop offset="100%" stopColor="var(--violet)" />
        </linearGradient>
      </defs>
      <path
        d="M14 30 L44 24 L58 26 L64 18 L72 16 L74 24 L78 30 L92 32
           L94 46 L90 56 L84 60 L86 68 L82 72 L76 68 L70 72
           L88 80 L104 76 L108 82 L92 88 L72 84 L64 78 L58 70
           L44 66 L36 58 L14 52 L20 42 Z"
        fill="color-mix(in srgb, var(--cyan) 12%, transparent)"
        stroke="url(#nyG)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* WNY beacon (Buffalo/Niagara) */}
      <circle cx="22" cy="41" r="3" fill="var(--cyan)" />
      <circle cx="22" cy="41" r="7" fill="none" stroke="var(--cyan)" strokeWidth="1" opacity="0.6" className="bloom-pulse" style={{ transformBox: "fill-box" }} />
      <text x="32" y="44" fontSize="7" fill="var(--frost)" fontFamily="monospace" letterSpacing="0.08em">WNY</text>
    </svg>
  );
}

/** Pot cross-section: layered living soil with glowing root web. */
export function SoilStrata({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="soilG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a2a18" />
          <stop offset="100%" stopColor="#1a1208" />
        </linearGradient>
      </defs>
      {/* sprout */}
      <path d="M60 34 L60 22" stroke="var(--lime)" strokeWidth="2" strokeLinecap="round" />
      <path d="M60 26 C52 24 48 18 47 11 C55 13 59 19 60 26 Z" fill="var(--lime)" />
      <path d="M60 26 C68 24 72 18 73 11 C65 13 61 19 60 26 Z" fill="var(--cyan)" opacity="0.9" />
      {/* pot */}
      <path d="M28 34 L92 34 L84 92 L36 92 Z" fill="url(#soilG)" stroke="var(--gold)" strokeWidth="1.2" strokeOpacity="0.5" />
      {/* strata */}
      <path d="M31 48 L89 48" stroke="var(--gold)" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="3 4" />
      <path d="M33 63 L87 63" stroke="var(--lime)" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 4" />
      <path d="M35 77 L85 77" stroke="var(--cyan)" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 4" />
      {/* glowing root web */}
      <g stroke="var(--cyan)" strokeWidth="0.9" fill="none" opacity="0.8">
        <path d="M60 34 C58 48 52 56 44 64 M60 34 C62 50 68 60 76 68 M60 34 C60 52 58 66 60 80 M60 48 C54 56 50 66 48 76 M60 48 C66 58 70 66 74 78" />
      </g>
      <g fill="var(--lime)">
        <circle cx="44" cy="64" r="1.4" /><circle cx="76" cy="68" r="1.4" />
        <circle cx="60" cy="80" r="1.4" /><circle cx="48" cy="76" r="1.2" /><circle cx="74" cy="78" r="1.2" />
      </g>
    </svg>
  );
}

/** Blueprint grid with a sprout + checkmarks — for the Build My Grow card. */
export function BlueprintGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="bpG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--cyan)" />
          <stop offset="100%" stopColor="var(--lime)" />
        </linearGradient>
      </defs>
      {/* blueprint frame */}
      <rect x="18" y="14" width="84" height="72" rx="6" fill="none" stroke="url(#bpG)" strokeWidth="1.4" opacity="0.8" />
      {/* grid */}
      <g stroke="var(--cyan)" strokeWidth="0.5" opacity="0.25">
        {[32, 46, 60, 74, 88].map((x) => (
          <line key={x} x1={x} y1="14" x2={x} y2="86" />
        ))}
        {[28, 42, 56, 70].map((y) => (
          <line key={y} x1="18" y1={y} x2="102" y2={y} />
        ))}
      </g>
      {/* checklist ticks */}
      <g stroke="var(--lime)" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M26 34 L29 37 L35 30" />
        <path d="M26 48 L29 51 L35 44" />
        <path d="M26 62 L29 65 L35 58" />
      </g>
      <g stroke="var(--frost)" strokeWidth="1.2" opacity="0.5">
        <line x1="42" y1="34" x2="70" y2="34" />
        <line x1="42" y1="48" x2="66" y2="48" />
        <line x1="42" y1="62" x2="72" y2="62" />
      </g>
      {/* sprout marker */}
      <path d="M84 74 L84 64" stroke="var(--lime)" strokeWidth="2" strokeLinecap="round" />
      <path d="M84 68 C79 67 76 63 75 58 C80 59 83 63 84 68 Z" fill="url(#bpG)" />
      <path d="M84 68 C89 67 92 63 93 58 C88 59 85 63 84 68 Z" fill="var(--cyan)" opacity="0.85" />
    </svg>
  );
}

/** Laurel wreath around a star — for the Grow Like the Greats card. */
export function LaurelGlyph({ className = "" }: { className?: string }) {
  const leaf = (x: number, y: number, rot: number, side: number) => (
    <path
      d={`M0 0 C${6 * side} -3 ${9 * side} -9 ${9 * side} -15 C${3 * side} -12 ${1 * side} -6 0 0 Z`}
      fill="url(#laurelG)"
      opacity="0.85"
      transform={`translate(${x} ${y}) rotate(${rot})`}
    />
  );
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="laurelG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--lime)" />
        </linearGradient>
        <radialGradient id="laurelStar" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="60%" stopColor="var(--gold)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* laurel branches */}
      <g>
        {[0, 1, 2, 3].map((i) => leaf(40 - i * 2, 74 - i * 15, -30 - i * 8, 1))}
        {[0, 1, 2, 3].map((i) => leaf(80 + i * 2, 74 - i * 15, 30 + i * 8, -1))}
      </g>
      {/* star */}
      <path
        d="M60 30 L64 46 L80 46 L67 56 L72 72 L60 62 L48 72 L53 56 L40 46 L56 46 Z"
        fill="url(#laurelStar)"
        stroke="var(--gold)"
        strokeWidth="1"
      />
      <circle cx="60" cy="52" r="26" fill="none" stroke="var(--gold)" strokeWidth="0.6" opacity="0.4" />
    </svg>
  );
}

/** LED grow-light panel with light beams — for the Gear Index card. */
export function GearGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="gearG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--cyan)" />
          <stop offset="100%" stopColor="var(--violet)" />
        </linearGradient>
      </defs>
      {/* light panel */}
      <rect x="34" y="16" width="52" height="16" rx="3" fill="none" stroke="url(#gearG)" strokeWidth="1.6" />
      <g fill="var(--cyan)">
        {Array.from({ length: 5 }, (_, i) => (
          <circle key={i} cx={42 + i * 9} cy={24} r="1.6" />
        ))}
      </g>
      {/* beams */}
      <g stroke="url(#gearG)" strokeWidth="1" opacity="0.5">
        <path d="M40 32 L34 76 M52 32 L48 78 M68 32 L72 78 M80 32 L86 76" />
      </g>
      {/* glow pool */}
      <ellipse cx="60" cy="84" rx="34" ry="6" fill="var(--cyan)" opacity="0.2" />
      <ellipse cx="60" cy="84" rx="20" ry="3.5" fill="none" stroke="var(--cyan)" strokeWidth="1" opacity="0.6" />
      {/* little sprout under the light */}
      <path d="M60 84 L60 70" stroke="var(--lime)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M60 74 C54 73 51 69 50 64 C56 65 59 69 60 74 Z" fill="var(--lime)" />
    </svg>
  );
}

export function TerpeneGlyph({ className = "" }: { className?: string }) {
  const nodes = [
    { cx: 60, cy: 30, r: 8, color: "var(--cyan)" },
    { cx: 35, cy: 50, r: 6, color: "var(--violet)" },
    { cx: 85, cy: 50, r: 6, color: "var(--lime)" },
    { cx: 42, cy: 75, r: 5, color: "var(--gold)" },
    { cx: 78, cy: 75, r: 5, color: "var(--magenta)" },
  ];
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <g stroke="var(--frost)" strokeWidth="0.8" opacity="0.25">
        <path d="M60 30 L35 50 M60 30 L85 50 M35 50 L42 75 M85 50 L78 75 M42 75 L78 75" />
      </g>
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.cx} cy={n.cy} r={n.r * 1.8} fill={n.color} opacity="0.15" />
          <circle cx={n.cx} cy={n.cy} r={n.r} fill={n.color} opacity="0.7" />
        </g>
      ))}
    </svg>
  );
}

export function SeedGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="seedG" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="var(--lime)" />
          <stop offset="100%" stopColor="var(--gold)" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="52" rx="16" ry="22" fill="url(#seedG)" opacity="0.7" />
      <path d="M60 30 L60 74" stroke="var(--gold)" strokeWidth="1" opacity="0.5" />
      <path d="M60 40 C52 36 48 28 50 20 C55 24 58 32 60 40 Z" fill="var(--lime)" opacity="0.6" />
      <path d="M60 40 C68 36 72 28 70 20 C65 24 62 32 60 40 Z" fill="var(--lime)" opacity="0.6" />
      <ellipse cx="60" cy="88" rx="30" ry="4" fill="var(--gold)" opacity="0.15" />
    </svg>
  );
}

export function RecipeGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <linearGradient id="recG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--violet)" />
        </linearGradient>
      </defs>
      <rect x="38" y="20" width="44" height="56" rx="6" fill="none" stroke="url(#recG)" strokeWidth="1.6" />
      <path d="M48 16 L48 24" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" />
      <path d="M60 16 L60 24" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" />
      <path d="M72 16 L72 24" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" />
      <g opacity="0.4">
        <circle cx="50" cy="40" r="1.5" fill="var(--lime)" />
        <circle cx="60" cy="44" r="2" fill="var(--magenta)" />
        <circle cx="70" cy="38" r="1.5" fill="var(--cyan)" />
        <circle cx="55" cy="52" r="1.8" fill="var(--gold)" />
        <circle cx="65" cy="56" r="1.5" fill="var(--violet)" />
      </g>
      <g stroke="var(--gold)" strokeWidth="1.2" strokeLinecap="round" opacity="0.5">
        <path d="M50 66 C52 60 58 58 60 62 C62 58 68 60 70 66" />
      </g>
    </svg>
  );
}

/** Growers connected in a network — for the Community module card. */
export function NetworkGlyph({ className = "" }: { className?: string }) {
  const nodes = [
    { x: 60, y: 22, r: 6, c: "var(--gold)" },
    { x: 30, y: 46, r: 4.5, c: "var(--magenta)" },
    { x: 90, y: 46, r: 4.5, c: "var(--cyan)" },
    { x: 42, y: 78, r: 4, c: "var(--lime)" },
    { x: 78, y: 78, r: 4, c: "var(--violet)" },
    { x: 60, y: 58, r: 3, c: "var(--frost)" },
  ];
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [0, 5],
    [1, 5],
    [2, 5],
    [1, 3],
    [2, 4],
    [5, 3],
    [5, 4],
  ];
  return (
    <svg viewBox="0 0 120 100" className={className} aria-hidden>
      <defs>
        <radialGradient id="networkGlow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="45" r="48" fill="url(#networkGlow)" />
      <g stroke="var(--frost)" strokeOpacity="0.25" strokeWidth="1">
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
          />
        ))}
      </g>
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.r} fill={n.c} opacity="0.9" />
      ))}
    </svg>
  );
}
