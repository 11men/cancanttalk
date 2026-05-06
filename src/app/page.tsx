import Link from "next/link";
import { createAnonServerClient } from "@/lib/supabase/anon-server";
import { CATEGORY_STYLE } from "@/lib/category-style";

export const revalidate = 60;

type CategoryWithCount = {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  question_count: number;
};

async function getCategoriesWithCount(): Promise<CategoryWithCount[]> {
  try {
    const supabase = createAnonServerClient();
    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, slug, name, emoji")
      .order("order_index", { ascending: true });

    if (error) {
      console.error("[home] categories fetch error:", error);
      return [];
    }
    if (!categories) return [];

    const counts = await Promise.all(
      categories.map(async (c) => {
        const { count, error: countError } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("category_id", c.id)
          .eq("status", "approved");
        if (countError) {
          console.error(`[home] question count error for ${c.slug}:`, countError);
        }
        return { ...c, question_count: count ?? 0 };
      }),
    );
    return counts;
  } catch (err) {
    console.error("[home] getCategoriesWithCount unexpected error:", err);
    return [];
  }
}

export default async function HomePage() {
  const categories = await getCategoriesWithCount();

  return (
    <div className="relative flex-1 w-full max-w-6xl mx-auto">
      <section className="px-5 sm:px-6 pt-6 sm:pt-10 pb-4 sm:pb-6">
        <p className="font-(family-name:--font-accent) text-[11px] sm:text-[13px] tracking-[0.2em] text-(--ink)/70 mb-1">
          TEST YOUR LIMIT ◆
        </p>
        <h2
          className="font-(family-name:--font-display) text-[44px] sm:text-[64px] md:text-[80px] leading-[0.95] tracking-tight"
          style={{ WebkitTextStroke: "0.5px var(--ink)" }}
        >
          <span>이게 </span>
          <span className="inline-block bg-(--acid-pink) px-2 text-(--paper) -rotate-2">가능?</span>
          <br />
          <span className="inline-block bg-(--ink) px-2 text-(--acid-lime) rotate-1 mt-1">불가능?</span>
        </h2>
        <p className="mt-3 sm:mt-5 text-[15px] sm:text-[17px] text-(--ink) font-bold leading-relaxed max-w-xl">
          다들 생각만 하고 못 물어본 거,
          <br />
          여기서 익명으로 투표해.
        </p>
        <p className="mt-2 text-[12px] sm:text-[13px] font-mono text-(--ink)/60">
          정답 없음 · 투표만 있음 · 결과는 너로 결정남
        </p>
      </section>

      {categories.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="px-5 sm:px-6 pb-5 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {categories.map((c, i) => {
            const style = CATEGORY_STYLE[c.slug] ?? CATEGORY_STYLE.love;
            return (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className={`brutal group relative block p-4 pt-10 pb-5 ${style.bg} animate-slide-up stagger-${(i % 4) + 1}`}
              >
                <span className="sticker absolute -top-3 left-3 bg-(--paper) -rotate-6">
                  {style.tag}
                </span>
                <div className={`text-5xl mb-3 transition-transform ${style.rotate} group-hover:scale-110`}>
                  {c.emoji}
                </div>
                <div
                  className="font-(family-name:--font-display) text-[22px] leading-[1.05]"
                  style={{ WebkitTextStroke: "0.3px var(--ink)" }}
                >
                  {style.hookName ?? c.name}
                </div>
                <div className="mt-2 text-[11px] font-mono font-bold text-(--ink)/75">
                  [{String(c.question_count).padStart(2, "0")} 질문]
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {categories.length > 0 && (
        <section className="px-5 sm:px-6 pb-10">
          <Link
            href="/submit"
            className="brutal brutal-lg block bg-(--ink) text-(--paper) p-5 sm:p-6 hover-glitch relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-(family-name:--font-accent) text-[12px] sm:text-[13px] text-(--acid-lime) tracking-[0.2em] mb-1">
                  UGC ◆ 채택되면 첫 화면에 박힘
                </div>
                <div className="font-(family-name:--font-display) text-[24px] sm:text-[28px] leading-[1] text-(--paper)">
                  네가 본 미친 상황 던져
                </div>
              </div>
              <span className="text-3xl sm:text-4xl">→</span>
            </div>
          </Link>

          <div className="mt-8 flex items-center gap-3 justify-center">
            <span className="sticker bg-(--acid-lime)">@TEAM2</span>
            <span className="text-[10px] font-mono text-(--ink)/60">
              v0.1.0 / beta
            </span>
          </div>
        </section>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="px-5">
      <div className="brutal p-6 bg-(--paper) text-center">
        <div className="text-5xl mb-3 animate-wiggle">🚧</div>
        <p
          className="font-(family-name:--font-display) text-[22px] leading-tight"
          style={{ WebkitTextStroke: "0.3px var(--ink)" }}
        >
          Supabase 연결 필요
        </p>
        <p className="text-[12px] mt-3 font-mono text-(--ink)/70 leading-5">
          .env.local 세팅 후
          <br />
          <code className="bg-(--acid-lime) px-2 py-0.5 border-2 border-(--ink)">
            supabase/migrations
          </code>
          의 SQL 실행
        </p>
      </div>
    </section>
  );
}
