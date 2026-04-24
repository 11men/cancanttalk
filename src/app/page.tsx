import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

type CategoryWithCount = {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  question_count: number;
};

const CATEGORY_STYLE: Record<string, { bg: string; rotate: string; tag: string }> = {
  love:   { bg: "bg-(--acid-pink)",   rotate: "-rotate-2", tag: "💘 빌런" },
  social: { bg: "bg-(--hot-cyan)",    rotate: "rotate-2",  tag: "🏢 말살" },
  hobby:  { bg: "bg-(--acid-lime)",   rotate: "-rotate-1", tag: "🎮 광기" },
  daily:  { bg: "bg-(--neon-purple)", rotate: "rotate-1",  tag: "🚇 생존" },
};

async function getCategoriesWithCount(): Promise<CategoryWithCount[]> {
  try {
    const supabase = await createClient();
    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, slug, name, emoji")
      .order("order_index", { ascending: true });

    if (error || !categories) return [];

    const counts = await Promise.all(
      categories.map(async (c) => {
        const { count } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("category_id", c.id)
          .eq("status", "approved");
        return { ...c, question_count: count ?? 0 };
      }),
    );
    return counts;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const categories = await getCategoriesWithCount();

  return (
    <div className="relative flex-1">
      <section className="px-5 pt-6 pb-4">
        <p className="font-(family-name:--font-accent) text-[11px] tracking-[0.2em] text-(--ink)/70 mb-1">
          TEST YOUR LIMIT ◆
        </p>
        <h2
          className="font-(family-name:--font-display) text-[44px] leading-[0.95] tracking-tight"
          style={{ WebkitTextStroke: "0.5px var(--ink)" }}
        >
          이게 <span className="inline-block bg-(--acid-pink) px-2 text-(--paper) -rotate-2">가능?</span>
          <br />
          <span className="inline-block bg-(--ink) px-2 text-(--acid-lime) rotate-1 mt-1">불가능?</span>
        </h2>
        <p className="mt-3 text-[13px] text-(--ink)/80 font-medium leading-relaxed">
          1020 찐찐찐 도파민 투표장.
          <br />
          너의 한계를 고르고, 세상과 비교해봐 ✦
        </p>
      </section>

      {categories.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="px-5 pb-5 grid grid-cols-2 gap-4">
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
                  {c.name}
                </div>
                <div className="mt-2 text-[11px] font-mono font-bold text-(--ink)/75">
                  [{String(c.question_count).padStart(2, "0")} QUESTIONS]
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {categories.length > 0 && (
        <section className="px-5 pb-10">
          <Link
            href="/submit"
            className="brutal brutal-lg block bg-(--ink) text-(--paper) p-5 hover-glitch relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-(family-name:--font-accent) text-[12px] text-(--acid-lime) tracking-[0.2em] mb-1">
                  UGC ◆ 나만 당할 수 없지
                </div>
                <div
                  className="font-(family-name:--font-display) text-[24px] leading-[1]"
                  style={{ WebkitTextStroke: "0.3px var(--paper)" }}
                >
                  너의 찐질문 제보하기
                </div>
              </div>
              <span className="text-3xl">→</span>
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
