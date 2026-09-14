/**
 * THE SIGNATURE — the Root Line, rebuilt as structure rather than ornament.
 *
 * The first version was a `position: fixed` SVG whose branch endpoints were
 * magic numbers in viewport coordinates. It looked like a root and meant
 * nothing: the branches landed wherever the window happened to put them, with
 * no relationship to any section, while docs/design-plan.md and the README
 * both claimed each branch terminated at a section anchor. design.md is
 * explicit that structure must encode something true about the content, so
 * either the claim went or the code did.
 *
 * Now the root is in the document, not the viewport:
 *
 *   RootTrunk  — one filled taper spanning the full height of <main>. It is a
 *                FILL, not a stroke, so stretching it vertically to an unknown
 *                page height cannot distort a stroke weight.
 *   RootBranch — one per section, rendered BY that section, so its position is
 *                the section's position by construction and cannot drift.
 *
 * Each branch is drawn by `animation-timeline: view()` — it sprouts as its own
 * section enters the viewport. That is both truer than the old scroll
 * percentages and simpler: no ranges to keep in sync with the page.
 *
 * Still zero JavaScript. Still compositor-thread. Still degrades to a finished
 * drawing where scroll timelines are unsupported or motion is unwelcome.
 */

/** Horizontal home of the root, shared by the trunk and every branch. */
export const TRUNK_LEFT = "left-[7px] md:left-10";

export function RootTrunk() {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-y-0 ${TRUNK_LEFT} w-3 md:w-4`}
    >
      <svg
        className="h-full w-full fill-gold"
        viewBox="0 0 16 1000"
        // The page height is unknown at build time, so the trunk stretches to
        // fill it. A filled shape survives that; a stroked path would not.
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/*
          A taper, not a rule. The trunk is thickest where it enters at the top
          and thins as it descends, the way a root actually does — that single
          property is most of what separates "a root" from "a 1px border-left".
        */}
        {/*
          The horizontal axis is NOT stretched — the viewBox is 16 units wide
          in a 16px box — so these numbers are pixels. The trunk is 3.6px where
          it enters and 1.2px where it ends: a third of its entry weight. At a
          uniform width it read as a border-left, which is the difference
          between a root and a rule.
        */}
        <path
          d="M5.6 0
             C5.9 180 7.6 320 6.5 500
             C5.7 680 7.3 820 6.4 1000
             L7.6 1000
             C8.5 820 9.6 680 8.8 500
             C7.9 320 9.5 180 9.2 0
             Z"
          opacity={0.6}
        />
      </svg>
    </div>
  );
}

/**
 * One branch, growing out of the trunk toward its section's heading.
 *
 * Rendered inside a `relative` section and positioned against it, so it is
 * anchored to real content rather than to a scroll percentage. `side` flips
 * alternate branches for the slight irregularity a real root has; `top` aligns
 * the branch with the heading it belongs to.
 */
export function RootBranch({
  side = "down",
  className = "",
}: {
  side?: "down" | "up";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`root-branch pointer-events-none absolute hidden md:block ${TRUNK_LEFT} ${className}`}
      style={{ width: "5.5rem", height: "3.5rem" }}
    >
      <svg
        viewBox="0 0 88 56"
        fill="none"
        className="h-full w-full stroke-gold"
        strokeLinecap="round"
      >
        {side === "down" ? (
          <>
            <path
              className="root-branch-path"
              pathLength={1}
              d="M8 6 C26 10 44 20 62 30"
              strokeWidth={1.4}
              opacity={0.75}
            />
            {/* One secondary fork. Roots fork again; a single stub reads as a
                scratch. Two path commands buy the entire read. */}
            <path
              className="root-branch-path"
              pathLength={1}
              d="M44 20 C54 20 64 17 74 14"
              strokeWidth={0.9}
              opacity={0.55}
            />
          </>
        ) : (
          <>
            <path
              className="root-branch-path"
              pathLength={1}
              d="M8 50 C26 46 44 36 62 26"
              strokeWidth={1.4}
              opacity={0.75}
            />
            <path
              className="root-branch-path"
              pathLength={1}
              d="M44 36 C54 36 64 39 74 42"
              strokeWidth={0.9}
              opacity={0.55}
            />
          </>
        )}
        {/* The terminal node, level with the section's heading. This is what
            turns the gutter into a table of contents rather than a margin. */}
        <circle
          className="root-branch-node fill-gold-lit"
          cx={64}
          cy={side === "down" ? 31 : 26}
          r={2.2}
          stroke="none"
        />
      </svg>
    </span>
  );
}

/**
 * The spread — where the trunk ends and fans into the root network from the
 * brand mark.
 *
 * The design plan promised this and the old fixed drawing never delivered it:
 * its rootlets were cropped out of every viewport and what actually reached
 * the bottom of the page was a bare vertical stick. It belongs at the end of
 * the document, so it is rendered there rather than pinned to the viewport.
 */
export function RootSpread() {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-0 hidden md:block ${TRUNK_LEFT}`}
      style={{ width: "7rem", height: "7rem", transform: "translateX(-3.4rem)" }}
    >
      <svg
        viewBox="0 0 112 112"
        fill="none"
        className="h-full w-full stroke-gold"
        strokeLinecap="round"
      >
        <g className="root-branch-path-group">
          <path className="root-branch-path" pathLength={1} d="M56 0 C56 26 54 40 50 62" strokeWidth={1.6} opacity={0.6} />
          <path className="root-branch-path" pathLength={1} d="M55 22 C44 36 32 48 18 62" strokeWidth={1.1} opacity={0.5} />
          <path className="root-branch-path" pathLength={1} d="M56 26 C68 40 80 52 94 66" strokeWidth={1.1} opacity={0.5} />
          <path className="root-branch-path" pathLength={1} d="M53 46 C46 60 40 72 34 90" strokeWidth={0.8} opacity={0.4} />
          <path className="root-branch-path" pathLength={1} d="M54 48 C60 62 64 74 70 92" strokeWidth={0.8} opacity={0.4} />
          <path className="root-branch-path" pathLength={1} d="M51 60 C50 74 49 84 48 100" strokeWidth={0.7} opacity={0.35} />
        </g>
      </svg>
    </div>
  );
}

/**
 * A page section that carries its own branch.
 *
 * The branch lives here rather than in a central list so that adding a section
 * adds a branch, and moving one moves its branch with it. There is no second
 * place to keep in sync.
 */
export function Section({
  id,
  children,
  side = "down",
  className = "",
  branchTop = "top-[4.6rem] md:top-[6.6rem]",
}: {
  id?: string;
  children: React.ReactNode;
  side?: "down" | "up";
  className?: string;
  /** Vertical alignment of the branch with this section's heading. */
  branchTop?: string;
}) {
  return (
    <section
      id={id}
      className={`relative ${id ? "scroll-mt-24" : ""} ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0">
        <div className="relative mx-auto h-full w-full max-w-6xl">
          <RootBranch side={side} className={branchTop} />
        </div>
      </div>
      {children}
    </section>
  );
}
