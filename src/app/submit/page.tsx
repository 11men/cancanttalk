import { createClient } from "@/lib/supabase/server";
import { getStoredNickname } from "@/lib/anon";
import SubmitForm from "./SubmitForm";

export default async function SubmitPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, name, emoji")
    .order("order_index");

  const nickname = (await getStoredNickname()) ?? "";

  return (
    <section className="flex-1 w-full max-w-2xl mx-auto px-5 sm:px-6 py-6 sm:py-10">
      <div className="mb-5">
        <p className="font-(family-name:--font-accent) text-[11px] tracking-[0.2em] text-(--ink)/70">
          DROP YOUR LIMIT ◆
        </p>
        <h2 className="font-(family-name:--font-display) text-[32px] leading-[0.95] tracking-tight mt-1 text-(--ink)">
          네가 본 미친 상황 <span className="text-(--acid-pink)">던져</span>
        </h2>
        <p className="text-[12px] text-(--ink)/70 mt-2 font-mono leading-5">
          채택되면 첫 화면에 박힘 · 익명 보장
        </p>
      </div>
      <SubmitForm categories={categories ?? []} initialNickname={nickname} />
    </section>
  );
}
