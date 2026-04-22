// 투표 패턴으로 타이틀 부여
// 카테고리별 '가능' 비율 + 총 투표 수로 판정

export type PersonaStat = {
  categorySlug: string;
  yesCount: number;
  totalCount: number;
};

export type Persona = {
  title: string;
  emoji: string;
  reason: string;
};

export function derivePersona(stats: PersonaStat[]): Persona | null {
  const total = stats.reduce((s, x) => s + x.totalCount, 0);
  if (total < 5) return null; // 최소 5표 이상

  const byCategory = Object.fromEntries(
    stats.map((s) => [
      s.categorySlug,
      s.totalCount > 0 ? s.yesCount / s.totalCount : 0,
    ]),
  );

  const hobby = byCategory.hobby ?? 0;
  const social = byCategory.social ?? 0;
  const love = byCategory.love ?? 0;
  const daily = byCategory.daily ?? 0;

  if (hobby >= 0.6 && social >= 0.4)
    return { title: "프로 덕후", emoji: "🎮", reason: "덕질과 사회생활 양립" };

  if (hobby >= 0.5)
    return { title: "광기의 덕후", emoji: "🔥", reason: "취미엔 한계가 없다" };

  if (social <= 0.2)
    return {
      title: "사회적 생존자",
      emoji: "🧊",
      reason: "사회생활은 지켜야지",
    };

  if (love >= 0.5)
    return { title: "순애보 빌런", emoji: "💘", reason: "사랑엔 장사 없다" };

  if (daily >= 0.5)
    return { title: "당당 일상러", emoji: "🚇", reason: "눈치 안 보는 타입" };

  return { title: "균형 감각자", emoji: "⚖️", reason: "적당히가 제일 어렵지" };
}
