import { MONTHS } from "@/lib/utils";

/**
 * THE SIGNATURE. Encodes the farm's one real claim — vegetables year-round,
 * grown locally — as a structural element instead of a marketing line.
 */
export function HarvestWheel({
  activeMonths,
  currentMonth,
  compact = false,
}: {
  activeMonths: number[];
  currentMonth?: number;
  compact?: boolean;
}) {
  const now = currentMonth ?? new Date().getMonth() + 1;
  return (
    <div className={compact ? "" : "panel p-4"}>
      <div className="harvest-wheel">
        {MONTHS.map((label, i) => {
          const month = i + 1;
          const active = activeMonths.includes(month);
          return (
            <div
              key={label}
              className="harvest-cell"
              data-active={active}
              data-current={month === now}
              aria-label={`${label}: ${active ? "in season" : "out of season"}${month === now ? " (this month)" : ""}`}
            >
              {active && <span className="harvest-dot" aria-hidden />}
            </div>
          );
        })}
      </div>
      {!compact && (
        <div className="mt-2 flex justify-between px-0.5">
          {MONTHS.map((label) => (
            <span
              key={label}
              className="w-[calc(100%/12)] text-center text-[0.62rem] font-medium text-muted-foreground"
            >
              {label[0]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
