/**
 * Cinematic hero backdrop — pure inline SVG/CSS, no images or JS. Deep
 * greenhouse-at-dusk gradient, the signature grow-light glow, and layered
 * foliage silhouettes that gently sway. Sits behind the hero copy; the LCP
 * text is never inside an image.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Deep greenhouse gradient base */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,#1c4a2b_0%,#123a22_38%,#0c1a10_100%)]" />

      {/* Signature grow-light glow */}
      <div className="hero-glow absolute left-1/2 top-[-18%] h-[70%] w-[140%] -translate-x-1/2 glow-grow blur-2xl" />
      <div className="hero-glow absolute right-[8%] top-[6%] h-40 w-40 rounded-full bg-grow/25 blur-3xl" />

      {/* Faint greenhouse-glass grid */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.06]" aria-hidden>
        <defs>
          <pattern id="glass" width="64" height="96" patternUnits="userSpaceOnUse">
            <path d="M0 0H64V96H0Z" fill="none" stroke="#f6f3e9" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#glass)" />
      </svg>

      {/* Layered foliage silhouettes along the bottom */}
      <svg
        className="hero-sway absolute inset-x-0 bottom-[-2px] h-[42%] w-full"
        viewBox="0 0 1200 300"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden
      >
        <path d="M0 300 V180 C120 150 160 90 210 120 C240 80 300 100 320 150 C380 120 440 160 470 200 C520 170 560 210 600 210 L600 300 Z" fill="#0e2416" opacity="0.9" />
        <path d="M600 300 V210 C650 190 690 150 740 180 C780 140 840 160 860 200 C920 170 980 200 1010 220 C1070 190 1130 210 1200 190 V300 Z" fill="#0e2416" opacity="0.9" />
        {/* Foreground fronds */}
        <g fill="#0a1a0f">
          <path d="M120 300 C120 240 90 210 70 190 C110 200 140 240 150 300 Z" />
          <path d="M1080 300 C1080 235 1110 205 1140 188 C1100 200 1075 240 1065 300 Z" />
        </g>
        {/* Sprout accents catching the light */}
        <g fill="#86c34a" opacity="0.5">
          <circle cx="150" cy="150" r="4" />
          <circle cx="470" cy="205" r="3.5" />
          <circle cx="860" cy="205" r="4" />
        </g>
      </svg>
    </div>
  );
}
