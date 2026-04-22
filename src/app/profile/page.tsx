import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { derivePersona, type PersonaStat } from "@/lib/persona";
import { signOut } from "@/actions/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, title, badge_count")
    .eq("id", user.id)
    .maybeSingle();

  type VoteRelation = {
    choice: boolean;
    questions: { categories: { slug: string } | null } | null;
  };
  const { data: votesRaw } = await supabase
    .from("votes")
    .select("choice, questions(category_id, categories(slug))")
    .eq("user_id", user.id);
  const votes = (votesRaw ?? []) as unknown as VoteRelation[];

  const grouped = new Map<string, PersonaStat>();
  for (const v of votes) {
    const slug = v.questions?.categories?.slug;
    if (!slug) continue;
    const prev =
      grouped.get(slug) ??
      ({ categorySlug: slug, yesCount: 0, totalCount: 0 } as PersonaStat);
    prev.totalCount += 1;
    if (v.choice) prev.yesCount += 1;
    grouped.set(slug, prev);
  }

  const stats = [...grouped.values()];
  const persona = derivePersona(stats);

  return (
    <section className="flex-1 px-5 py-6 space-y-4">
      {/* 페르소나 카드 */}
      <div className="brutal brutal-lg bg-[var(--acid-pink)] text-[var(--paper)] p-7 text-center relative">
        <span className="sticker absolute -top-4 left-4 bg-[var(--acid-lime)] text-[var(--ink)] -rotate-3">
          PERSONA
        </span>
        <div className="text-7xl mb-3 animate-bounce-in">
          {persona?.emoji ?? "👤"}
        </div>
        <div className="font-mono text-[11px] opacity-90">
          @{profile?.nickname ?? "user"}
        </div>
        <h2
          className="font-[family-name:var(--font-display)] text-[30px] leading-[1] tracking-tight mt-1"
          style={{ WebkitTextStroke: "0.4px var(--paper)" }}
        >
          {persona?.title ?? "아직 타이틀 없음"}
        </h2>
        <p className="text-[12px] mt-2 opacity-90 font-mono">
          {persona?.reason ?? "5표 이상 던져야 타이틀 부여 ✦"}
        </p>
      </div>

      {/* 카테고리별 성향 */}
      <div className="brutal bg-[var(--paper)] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-[family-name:var(--font-display)] text-[18px]">
            카테고리 성향
          </h3>
          <span className="sticker bg-[var(--hot-cyan)]">STATS</span>
        </div>
        {stats.length === 0 ? (
          <p className="font-mono text-xs text-[var(--ink)]/60 py-4 text-center">
            NO VOTES YET
          </p>
        ) : (
          <ul className="space-y-2.5">
            {stats.map((s) => {
              const pct = Math.round((s.yesCount / s.totalCount) * 100);
              return (
                <li key={s.categorySlug}>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="font-bold uppercase">{s.categorySlug}</span>
                    <span>
                      {s.yesCount}/{s.totalCount} · {pct}%
                    </span>
                  </div>
                  <div className="h-3 border-2 border-[var(--ink)] bg-[var(--paper-tint)]">
                    <div
                      className="h-full bg-[var(--acid-pink)] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="brutal w-full py-3 bg-[var(--ink)] text-[var(--paper)] font-[family-name:var(--font-accent)] text-xs tracking-[0.2em]"
        >
          ✕ LOGOUT
        </button>
      </form>
    </section>
  );
}
