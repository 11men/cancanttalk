import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

type RankRow = {
  author_id: string;
  approved_count: number;
  total_votes: number;
  nickname: string | null;
};

async function getRanking(): Promise<RankRow[]> {
  const supabase = await createClient();
  type QuestionWithProfile = {
    author_id: string | null;
    vote_count: number;
    profiles: { nickname: string | null } | null;
  };
  const { data: raw } = await supabase
    .from("questions")
    .select("author_id, vote_count, profiles(nickname)")
    .eq("status", "approved")
    .not("author_id", "is", null);

  const data = (raw ?? []) as unknown as QuestionWithProfile[];
  const map = new Map<string, RankRow>();
  for (const q of data) {
    if (!q.author_id) continue;
    const prev =
      map.get(q.author_id) ??
      ({
        author_id: q.author_id,
        approved_count: 0,
        total_votes: 0,
        nickname: q.profiles?.nickname ?? null,
      } as RankRow);
    prev.approved_count += 1;
    prev.total_votes += q.vote_count ?? 0;
    map.set(q.author_id, prev);
  }
  return [...map.values()]
    .sort((a, b) => b.total_votes - a.total_votes)
    .slice(0, 20);
}

const MEDAL_STYLE = [
  "bg-[var(--acid-lime)]",
  "bg-[var(--hot-cyan)]",
  "bg-[var(--acid-pink)] text-[var(--paper)]",
];

export default async function RankingPage() {
  const ranking = await getRanking();

  return (
    <section className="flex-1 px-5 py-6">
      <div className="mb-5">
        <p className="font-[family-name:var(--font-accent)] text-[11px] tracking-[0.2em] text-[var(--ink)]/70">
          HALL OF FAME
        </p>
        <h2
          className="font-[family-name:var(--font-display)] text-[36px] leading-[0.95] tracking-tight mt-1"
          style={{ WebkitTextStroke: "0.4px var(--ink)" }}
        >
          🏆 베스트 제보자
        </h2>
      </div>
      {ranking.length === 0 ? (
        <div className="brutal bg-[var(--paper)] p-8 text-center">
          <div className="text-5xl mb-3">👑</div>
          <p className="font-[family-name:var(--font-display)] text-[18px]">
            첫 전설이 될 기회
          </p>
          <p className="font-mono text-[11px] text-[var(--ink)]/60 mt-2">
            NO SUBMISSIONS YET
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {ranking.map((r, i) => (
            <li
              key={r.author_id}
              className={`brutal bg-[var(--paper)] p-4 flex items-center gap-4 animate-slide-up`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span
                className={`font-[family-name:var(--font-display)] text-[22px] w-12 h-12 border-[2.5px] border-[var(--ink)] flex items-center justify-center ${
                  MEDAL_STYLE[i] ?? "bg-[var(--paper-tint)]"
                }`}
              >
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className="font-[family-name:var(--font-display)] text-[18px] text-[var(--acid-pink)] truncate"
                  style={{ WebkitTextStroke: "0.2px var(--ink)" }}
                >
                  @{r.nickname ?? "익명"}
                </div>
                <div className="font-mono text-[11px] text-[var(--ink)]/70 mt-0.5">
                  승인 {r.approved_count} · 누적 투표 {r.total_votes}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
