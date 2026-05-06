import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// 쿠키를 읽지 않는 서버용 supabase 클라이언트.
// ISR/SSG가 필요한 페이지(홈, 랭킹, 사이트맵 등 anon_id가 필요 없는 라우트)에서 사용.
export function createAnonServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}
