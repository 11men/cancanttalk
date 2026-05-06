// 후킹 카피 생성 헬퍼
// "후킹: 마음을 훅 끌어당기는 기술" 프레임 적용
// - 0.3~3초 패턴 인터럽트
// - 명령 X / 초대 O
// - 후킹 뒤엔 반드시 payoff

const FALLBACK_TEASE = [
  "다들 한 번씩은 본 상황",
  "눌러보면 너만 빼고 다 알고 있음",
  "익명이라 솔직 모드",
];

// 투표 전 카드 하단 미끼 (vote_count 기반)
export function getCardTease(voteCount: number, yesCount: number): string {
  if (voteCount < 1) {
    return FALLBACK_TEASE[Math.floor(Math.random() * FALLBACK_TEASE.length)];
  }
  if (voteCount < 5) return `${voteCount}명 갈렸음 · 너가 결정타`;

  const yesPct = Math.round((yesCount / voteCount) * 100);
  const tight = yesPct >= 45 && yesPct <= 55;
  const lopsided = yesPct >= 90 || yesPct <= 10;

  if (tight) return `${voteCount}명이 정확히 반반 · 너로 결정남`;
  if (lopsided) return `${voteCount}명 중 ${Math.max(yesPct, 100 - yesPct)}% 한 쪽으로 쏠림`;
  return `${voteCount}명이 갈렸어 · 결과 보러 ↓`;
}

// 투표 후 결과 헤드라인 (비율 분포별 동적)
export function getResultHook(yesPct: number, totalCount: number): string {
  const noPct = 100 - yesPct;
  const dom = Math.max(yesPct, noPct);
  const winSide = yesPct >= noPct ? "가능" : "불가능";

  if (totalCount < 3) return "첫 투표자 · 너가 판세 만든다";
  if (dom >= 90) return `이건 못 참지 — ${winSide} ${dom}% 압도`;
  if (dom >= 70) return `대세는 ${winSide} ${dom}%`;
  if (dom >= 56) return `${winSide} 우세 · 그래도 ${100 - dom}%는 반대`;
  return `진짜 미친 ${yesPct}:${noPct} · 너로 결정남`;
}

// 결과 화면 보조 카피 (소속감)
export function getCohortLine(
  myChoice: boolean,
  yesPct: number,
  totalCount: number,
): string {
  const sameSidePct = myChoice ? yesPct : 100 - yesPct;
  const sameSideCount = Math.round((totalCount * sameSidePct) / 100);
  if (sameSideCount <= 1) return "너 혼자 이 답 골랐음 · 소수정예";
  return `너랑 같은 답 → ${sameSideCount}명`;
}
