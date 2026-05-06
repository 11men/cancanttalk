import { createAnonServerClient } from "@/lib/supabase/anon-server";

export const revalidate = 300;

type HotQuestion = {
  id: string;
  content: string;
  vote_count: number;
  yes_count: number;
  difficulty: number;
  author_nickname: string | null;
  categories: { slug: string; name: string; emoji: string } | null;
};

async function getHot(): Promise<HotQuestion[]> {
  const supabase = createAnonServerClient();
  const { data, error } = await supabase
    .from("questions")
    .select(
      "id, content, vote_count, yes_count, difficulty, author_nickname, categories(slug, name, emoji)",
    )
    .eq("status", "approved")
    .order("vote_count", { ascending: false })
    .limit(20);
  if (error) console.error("[ranking] hot fetch error:", error);
  return ((data ?? []) as unknown as HotQuestion[]).filter((q) => q.vote_count > 0);
}

const MEDAL_STYLE = [
  "bg-(--acid-lime)",
  "bg-(--hot-cyan)",
  "bg-(--acid-pink) text-(--paper)",
];

export default async function RankingPage() {
  const hot = await getHot();

  return (
    <section className="flex-1 w-full max-w-2xl mx-auto px-5 sm:px-6 py-6 sm:py-10">
      <div className="mb-5">
        <p className="font-(family-name:--font-accent) text-[11px] tracking-[0.2em] text-(--ink)/70">
          HALL OF MADNESS
        </p>
        <h2 className="font-(family-name:--font-display) text-[36px] leading-[0.95] tracking-tight mt-1 text-(--ink)">
          🔥 이번 주 미친 TOP
        </h2>
        <p className="text-[12px] text-(--ink)/70 mt-2 font-mono leading-5">
          투표 폭발 순 · 5분마다 갱신
        </p>
      </div>
      {hot.length === 0 ? (
        <div className="brutal bg-(--paper) p-8 text-center">
          <div className="text-5xl mb-3">👑</div>
          <p
            className="font-(family-name:--font-display) text-[22px] text-(--ink) leading-tight"
            style={{ WebkitTextStroke: "0.3px var(--ink)" }}
          >
            첫 1위가 다 가져감
          </p>
          <p className="font-mono text-[11px] text-(--ink)/60 mt-2">
            NO VOTES YET · 투표 1개로 1위 가능
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {hot.map((q, i) => {
            const yesPct =
              q.vote_count > 0
                ? Math.round((q.yes_count / q.vote_count) * 100)
                : 0;
            return (
              <li
                key={q.id}
                className="brutal bg-(--paper) p-4 flex gap-3 animate-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span
                  className={`font-(family-name:--font-display) text-[22px] w-12 h-12 border-[2.5px] border-(--ink) flex items-center justify-center shrink-0 ${
                    MEDAL_STYLE[i] ?? "bg-(--paper-tint)"
                  }`}
                >
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {q.categories && (
                      <span className="sticker bg-(--acid-lime) text-[10px]">
                        {q.categories.emoji} {q.categories.name}
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-(--ink)/60">
                      @{q.author_nickname ?? "익명"}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed break-keep text-(--ink)">
                    {q.content}
                  </p>
                  <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-(--ink)/70">
                    <span>
                      🗳️ <b>{q.vote_count}</b>표
                    </span>
                    <span className="text-(--yes) font-bold">
                      가능 {yesPct}%
                    </span>
                    <span className="text-(--no) font-bold">
                      불가능 {100 - yesPct}%
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
