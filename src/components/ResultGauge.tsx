import { getResultHook, getCohortLine } from "@/lib/hook-copy";

type Props = {
  yesPct: number;
  noPct: number;
  myChoice: boolean | null;
  totalCount?: number;
};

export default function ResultGauge({
  yesPct,
  noPct,
  myChoice,
  totalCount = 0,
}: Props) {
  const headline = getResultHook(yesPct, totalCount);
  const cohort =
    myChoice !== null && totalCount > 0
      ? getCohortLine(myChoice, yesPct, totalCount)
      : null;

  return (
    <div>
      <div className="mb-2.5">
        <div className="font-(family-name:--font-accent) text-[11px] tracking-[0.2em] text-(--ink)/70 mb-1">
          VERDICT
        </div>
        <p
          className="font-(family-name:--font-display) text-[20px] sm:text-[22px] leading-tight tracking-tight text-(--ink)"
          style={{ WebkitTextStroke: "0.3px var(--ink)" }}
        >
          {headline}
        </p>
      </div>
      <div
        className="flex h-14 border-[3px] border-(--ink) overflow-hidden bg-(--paper)"
        style={{ boxShadow: "4px 4px 0 0 var(--ink)" }}
      >
        <div
          className="h-full flex items-center justify-center bg-(--yes) text-(--paper) font-(family-name:--font-display) text-[22px] leading-none tracking-tight transition-[width] duration-[700ms] ease-[cubic-bezier(.2,1.3,.4,1)] border-r-[3px] border-(--ink)"
          style={{ width: `${yesPct}%` }}
        >
          {yesPct >= 12 ? `${yesPct}%` : ""}
        </div>
        <div
          className="h-full flex items-center justify-center bg-(--no) text-(--paper) font-(family-name:--font-display) text-[22px] leading-none tracking-tight transition-[width] duration-[700ms] ease-[cubic-bezier(.2,1.3,.4,1)]"
          style={{ width: `${noPct}%` }}
        >
          {noPct >= 12 ? `${noPct}%` : ""}
        </div>
      </div>
      <div className="flex justify-between mt-2 font-mono text-[10px]">
        <span className="text-(--yes) font-bold">▲ 가능</span>
        <span className="text-(--no) font-bold">불가능 ▼</span>
      </div>
      {cohort && (
        <p className="mt-3 font-mono text-[11px] text-(--ink)/70">
          {cohort}
          {myChoice !== null && (
            <span className="ml-2 text-(--ink)/50">
              · 너:{" "}
              <span className="font-bold text-(--ink)">
                {myChoice ? "가능" : "불가능"}
              </span>
            </span>
          )}
        </p>
      )}
    </div>
  );
}
