import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubmitForm from "./SubmitForm";

export default async function SubmitPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/submit");

  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, name, emoji")
    .order("order_index");

  return (
    <section className="flex-1 px-5 py-6">
      <div className="mb-5">
        <p className="font-(family-name:--font-accent) text-[11px] tracking-[0.2em] text-(--ink)/70">
          UGC ◆ USER QUESTION
        </p>
        <h2
          className="font-(family-name:--font-display) text-[32px] leading-[0.95] tracking-tight mt-1"
          style={{ WebkitTextStroke: "0.4px var(--ink)" }}
        >
          나만 당할 수 없지 <span className="text-(--acid-pink)">😤</span>
        </h2>
        <p className="text-[12px] text-(--ink)/70 mt-2 font-mono leading-5">
          검수 통과하면 전체 공개 ✦
        </p>
      </div>
      <SubmitForm categories={categories ?? []} />
    </section>
  );
}
