import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const supabase = await createClient();
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
  } catch {
    return [{ url: base, lastModified: new Date() }];
  }
}
