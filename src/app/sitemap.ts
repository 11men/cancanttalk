import type { MetadataRoute } from "next";
import { createAnonServerClient } from "@/lib/supabase/anon-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const supabase = createAnonServerClient();
    const { data } = await supabase.from("categories").select("slug");
    const categoryEntries = (data ?? []).map((c) => ({
      url: `${base}/categories/${c.slug}`,
      lastModified: new Date(),
    }));
    return [
      { url: base, lastModified: new Date() },
      { url: `${base}/submit`, lastModified: new Date() },
      { url: `${base}/ranking`, lastModified: new Date() },
      ...categoryEntries,
    ];
  } catch (err) {
    console.error("[sitemap] generation failed:", err);
    return [{ url: base, lastModified: new Date() }];
  }
}
