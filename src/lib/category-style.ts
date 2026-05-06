// 카테고리 slug 별 후킹 표시명 + 카드 스타일 매핑.
// DB의 categories.name 위에 클라이언트가 표시명을 override.

export type CategoryStyle = {
  bg: string;
  rotate: string;
  tag: string;
  hookName: string;
};

export const CATEGORY_STYLE: Record<string, CategoryStyle> = {
  love:   { bg: "bg-[var(--acid-pink)]",   rotate: "-rotate-2", tag: "💘 미친 진심",  hookName: "썸 vs 손절" },
  social: { bg: "bg-[var(--hot-cyan)]",    rotate: "rotate-2",  tag: "🏢 인간 말살",  hookName: "사장 vs 알바" },
  hobby:  { bg: "bg-[var(--acid-lime)]",   rotate: "-rotate-1", tag: "🎮 도파민 광기", hookName: "취미 미친썰" },
  daily:  { bg: "bg-[var(--neon-purple)]", rotate: "rotate-1",  tag: "🚇 생존 모드",  hookName: "일상 광기" },
};

export function getHookName(slug: string, fallback: string): string {
  return CATEGORY_STYLE[slug]?.hookName ?? fallback;
}
