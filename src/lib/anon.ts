import { cookies } from "next/headers";

const ANON_COOKIE = "anon_id";
const NICKNAME_COOKIE = "nickname";

export async function getAnonId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(ANON_COOKIE)?.value;
  if (existing) return existing;
  // proxy가 먼저 쿠키를 심지만, 혹시라도 없으면 임시 ID를 만들어 서버에서라도 진행
  return crypto.randomUUID();
}

export async function getStoredNickname(): Promise<string | null> {
  const store = await cookies();
  return store.get(NICKNAME_COOKIE)?.value ?? null;
}

export async function setStoredNickname(nickname: string) {
  const store = await cookies();
  store.set(NICKNAME_COOKIE, nickname, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export function normalizeNickname(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").trim().slice(0, 20);
  return trimmed || "익명";
}
