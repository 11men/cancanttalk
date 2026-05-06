import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAnonId, getStoredNickname } from "@/lib/anon";
import ChallengeSlider, {
  type QuestionWithMeta,
} from "@/components/ChallengeSlider";
import { seedFromDate, shuffleWithSeed } from "@/lib/shuffle";
import { getHookName } from "@/lib/category-style";

export const revalidate = 30;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category, error: catErr } = await supabase
    .from("categories")
    .select("id, slug, name, emoji")
    .eq("slug", slug)
    .maybeSingle();

  if (catErr) console.error("[category] category fetch error:", catErr);
  if (!category) notFound();

  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id, content, vote_count, yes_count, difficulty")
    .eq("category_id", category.id)
    .eq("status", "approved")
    .order("vote_count", { ascending: false });

  if (qErr) console.error("[category] questions fetch error:", qErr);

  const anonId = await getAnonId();
  const nickname = (await getStoredNickname()) ?? "";

  let myVotes: Record<string, boolean> = {};
  if (questions && questions.length > 0) {
    const ids = questions.map((q) => q.id);
    const { data: votes, error: vErr } = await supabase
      .from("votes")
      .select("question_id, choice")
      .eq("anon_id", anonId)
      .in("question_id", ids);
    if (vErr) console.error("[category] votes fetch error:", vErr);
    myVotes = Object.fromEntries(
      (votes ?? []).map((v) => [v.question_id, v.choice]),
    );
  }

  // 핫토픽: vote_count 최상위 1개는 고정, 나머지는 날짜 seed로 셔플
  const all = questions ?? [];
  const hot = all.slice(0, 1);
  const rest = shuffleWithSeed(all.slice(1), seedFromDate());
  const sorted = [...hot, ...rest];

  const items: QuestionWithMeta[] = sorted.map((q) => ({
    ...q,
    myChoice: myVotes[q.id] ?? null,
  }));

  return (
    <ChallengeSlider
      category={{
        name: getHookName(category.slug, category.name),
        emoji: category.emoji,
      }}
      items={items}
      initialNickname={nickname}
    />
  );
}
