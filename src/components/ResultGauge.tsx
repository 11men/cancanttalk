type Props = { yesPct: number; noPct: number; myChoice: boolean | null };

export default function ResultGauge({ yesPct, noPct, myChoice }: Props) {
  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <div className="font-[family-name:var(--font-accent)] text-[11px] tracking-[0.2em] text-[var(--ink)]/70">
          VERDICT
        </div>
        <div className="font-mono text-[10px] text-[var(--ink)]/60">
          {myChoice !== null && (
            <>
              YOU: <span className="font-bold">{myChoice ? "가능 ✓" : "불가능 ✓"}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex h-14 border-[3px] border-[var(--ink)] overflow-hidden bg-[var(--paper)] shadow-[4px_4px_0_0_var(--ink)]">
        <div
          className="h-full flex items-center justify-center bg-[var(--yes)] text-[var(--paper)] font-[family-name:var(--font-display)] text-[22px] leading-none tracking-tight transition-[width] duration-[700ms] ease-[cubic-bezier(.2,1.3,.4,1)] border-r-[3px] border-[var(--ink)]"
          style={{ width: `${yesPct}%` }}
        >
          {yesPct >= 12 ? `${yesPct}%` : ""}
        </div>
        <div
          className="h-full flex items-center justify-center bg-[var(--no)] text-[var(--paper)] font-[family-name:var(--font-display)] text-[22px] leading-none tracking-tight transition-[width] duration-[700ms] ease-[cubic-bezier(.2,1.3,.4,1)]"
          style={{ width: `${noPct}%` }}
        >
          {noPct >= 12 ? `${noPct}%` : ""}
        </div>
      </div>
      <div className="flex justify-between mt-2 font-mono text-[10px]">
        <span className="text-[var(--yes)] font-bold">▲ 가능</span>
        <span className="text-[var(--no)] font-bold">불가능 ▼</span>
      </div>
    </div>
  );
}
