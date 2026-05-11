import { createAnonServerClient } from "@/lib/supabase/anon-server";
import { getHookName } from "@/lib/category-style";

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

const MEDAL_BG = ["bg-(--acid-lime)/45", "bg-(--hot-cyan)/40", "bg-(--acid-pink)/35"];

export default async function RankingPage() {
  const hot = await getHot();
  const top3 = hot.slice(0, 3);
  const middle = hot.slice(3, 10);
  const tail = hot.slice(10);

  return (
    <section className="flex-1 w-full max-w-2xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
      <div className="mb-10">
        <p className="font-(family-name:--font-accent) text-[11px] tracking-[0.2em] text-(--ink)/60">
          HALL OF MADNESS
        </p>
        <h2 className="font-(family-name:--font-display) text-[36px] sm:text-[44px] leading-[0.95] tracking-tight mt-2 text-(--ink)">
          🔥 이번 주 미친 TOP
        </h2>
        <p className="text-[12px] text-(--ink)/60 mt-3 font-mono leading-5">
          투표 폭발 순 · 5분마다 갱신
        </p>
      </div>

      {hot.length === 0 ? (
        <div className="brutal bg-(--paper) p-10 text-center">
          <div className="text-5xl mb-4">👑</div>
          <p
            className="font-(family-name:--font-display) text-[24px] text-(--ink) leading-tight"
            style={{ WebkitTextStroke: "0.3px var(--ink)" }}
          >
            첫 1위가 다 가져감
          </p>
          <p className="font-mono text-[11px] text-(--ink)/60 mt-3">
            NO VOTES YET · 투표 1개로 1위 가능
          </p>
        </div>
      ) : (
        <>
          {/* TOP 3 — hero 위계 */}
          {top3.length > 0 && (
            <div className="space-y-4">
              {top3.map((q, i) => (
                <TopCard key={q.id} q={q} rank={i + 1} delay={i * 60} />
              ))}
            </div>
          )}

          {/* 4-10위 — primary 위계 (compact row) */}
          {middle.length > 0 && (
            <>
              <div className="section-gap">
                <p className="font-(family-name:--font-accent) text-[11px] tracking-[0.2em] text-(--ink)/60">
                  TOP 10
                </p>
                <div className="mt-1 h-[2px] w-12 bg-(--ink)" />
              </div>
              <ol className="mt-5 space-y-2">
                {middle.map((q, i) => (
                  <MidRow key={q.id} q={q} rank={i + 4} delay={i * 30} />
                ))}
              </ol>
            </>
          )}

          {/* 11+ — secondary 위계 (compact list) */}
          {tail.length > 0 && (
            <>
              <div className="section-gap">
                <p className="font-(family-name:--font-accent) text-[11px] tracking-[0.2em] text-(--ink)/60">
                  ALSO HOT
                </p>
                <div className="mt-1 h-[2px] w-12 bg-(--ink)" />
              </div>
              <ol className="mt-5 divide-y-2 divide-(--ink)/15">
                {tail.map((q, i) => (
                  <TailRow key={q.id} q={q} rank={i + 11} />
                ))}
              </ol>
            </>
          )}
        </>
      )}
    </section>
  );
}

function TopCard({ q, rank, delay }: { q: HotQuestion; rank: number; delay: number }) {
  const yesPct = Math.round((q.yes_count / q.vote_count) * 100);
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  const bg = MEDAL_BG[rank - 1] ?? "bg-(--paper-tint)";
  return (
    <article
      className="brutal bg-(--paper) p-6 sm:p-7 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4">
        <span
          className={`font-(family-name:--font-display) text-[28px] w-14 h-14 border-2 border-(--ink) flex items-center justify-center shrink-0 ${bg}`}
        >
          {medal}
        </span>
        <div className="flex-1 min-w-0">
          {q.categories && (
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="sticker bg-(--acid-lime) text-[10px]">
                {q.categories.emoji} {getHookName(q.categories.slug, q.categories.name)}
              </span>
              <span className="font-mono text-[10px] text-(--ink)/50">
                @{q.author_nickname ?? "익명"}
              </span>
            </div>
          )}
          <p
            className="font-(family-name:--font-display) text-[18px] sm:text-[20px] leading-[1.3] break-keep text-(--ink)"
            style={{ WebkitTextStroke: "0.2px var(--ink)" }}
          >
            {q.content}
          </p>
          <PctBar yesPct={yesPct} voteCount={q.vote_count} />
        </div>
      </div>
    </article>
  );
}

function MidRow({ q, rank, delay }: { q: HotQuestion; rank: number; delay: number }) {
  const yesPct = Math.round((q.yes_count / q.vote_count) * 100);
  return (
    <li
      className="bg-(--paper) border-2 border-(--ink) p-4 flex items-start gap-3 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="font-(family-name:--font-display) text-[18px] w-9 h-9 border border-(--ink) flex items-center justify-center shrink-0 bg-(--paper-tint)">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold leading-snug break-keep text-(--ink) line-clamp-2">
          {q.content}
        </p>
        <PctBar yesPct={yesPct} voteCount={q.vote_count} compact />
      </div>
    </li>
  );
}

function TailRow({ q, rank }: { q: HotQuestion; rank: number }) {
  return (
    <li className="py-3 flex items-center gap-3">
      <span className="font-mono text-[12px] text-(--ink)/40 w-6 shrink-0">
        {rank}
      </span>
      <p className="flex-1 min-w-0 text-[12px] text-(--ink)/80 truncate">
        {q.content}
      </p>
      <span className="font-mono text-[10px] text-(--ink)/50 shrink-0">
        {q.vote_count}표
      </span>
    </li>
  );
}

function PctBar({
  yesPct,
  voteCount,
  compact = false,
}: {
  yesPct: number;
  voteCount: number;
  compact?: boolean;
}) {
  const noPct = 100 - yesPct;
  return (
    <div className={compact ? "mt-2" : "mt-3"}>
      <div className={`flex ${compact ? "h-1" : "h-1.5"} bg-(--ink)/10 overflow-hidden`}>
        <div className="bg-(--yes)/70" style={{ width: `${yesPct}%` }} />
        <div className="bg-(--no)/70" style={{ width: `${noPct}%` }} />
      </div>
      <div className={`mt-1.5 flex items-center gap-3 font-mono text-[10px] text-(--ink)/60`}>
        <span>🗳️ <b className="text-(--ink)">{voteCount}</b>표</span>
        <span className="text-(--yes)/80 font-bold">{yesPct}%</span>
        <span className="text-(--no)/80 font-bold">{noPct}%</span>
      </div>
    </div>
  );
}
