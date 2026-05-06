import ResultGauge from "@/components/ResultGauge";
import { getCardTease, getResultHook, getCohortLine } from "@/lib/hook-copy";

// 마이그레이션 전 후킹 카피 검수용 미리보기 페이지.
// 검수 끝나면 src/app/dev 디렉터리째로 삭제.

export const dynamic = "force-static";

const SCENARIOS: Array<{
  label: string;
  question: string;
  yesPct: number;
  total: number;
}> = [
  { label: "투표 0건", question: "지하철에서 최애 노래 크게 틀고 리듬타기 가능?", yesPct: 50, total: 0 },
  { label: "투표 3건 (소수)", question: "엄마한테 카톡 ‘ㅇㅋ’ 한 글자만 보내기 가능?", yesPct: 67, total: 3 },
  { label: "5:5 미친 박빙", question: "썸 타는 애한테 손절 통보 카톡 가능?", yesPct: 50, total: 248 },
  { label: "55:45 살짝 우세", question: "친구 앞에서 부모님 잔소리 흉내내기 가능?", yesPct: 55, total: 412 },
  { label: "70:30 대세", question: "같이 놀던 무리 단톡 조용히 나가기 가능?", yesPct: 71, total: 836 },
  { label: "90:10 압도적", question: "수업 중에 화장실 가서 안 돌아오기 가능?", yesPct: 92, total: 1247 },
  { label: "10:90 반대 압도", question: "엘베에서 모르는 사람한테 먼저 인사하기 가능?", yesPct: 8, total: 980 },
];

export default function PreviewPage() {
  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-5 sm:px-6 py-8 space-y-12">
      <header className="brutal bg-(--paper) p-5">
        <p className="font-(family-name:--font-accent) text-[11px] tracking-[0.2em] text-(--ink)/70">
          DEV ONLY ◆ 후킹 카피 미리보기
        </p>
        <h1
          className="font-(family-name:--font-display) text-[36px] leading-[0.95] tracking-tight mt-1"
          style={{ WebkitTextStroke: "0.4px var(--ink)" }}
        >
          /dev/preview
        </h1>
        <p className="text-[12px] font-mono text-(--ink)/70 mt-2 leading-5">
          마이그레이션 전 후킹 카피 검수용. 7개 시나리오로 카드 미끼 / 결과 헤드라인 / 코호트 라인을 모두 확인.
          <br />
          검수 끝나면 <code className="bg-(--acid-lime) px-1">src/app/dev</code> 디렉터리째 삭제.
        </p>
      </header>

      {SCENARIOS.map((s, i) => {
        const yesCount = Math.round((s.total * s.yesPct) / 100);
        const tease = getCardTease(s.total, yesCount);
        const headlineYes = getResultHook(s.yesPct, s.total);
        const headlineNo = getResultHook(s.yesPct, s.total); // headline은 양쪽 동일
        const cohortYes = s.total > 0 ? getCohortLine(true, s.yesPct, s.total) : null;
        const cohortNo = s.total > 0 ? getCohortLine(false, s.yesPct, s.total) : null;

        return (
          <section key={i} className="space-y-4">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="sticker bg-(--ink) text-(--paper)">
                #{String(i + 1).padStart(2, "0")}
              </span>
              <h2
                className="font-(family-name:--font-display) text-[24px] leading-tight tracking-tight"
                style={{ WebkitTextStroke: "0.3px var(--ink)" }}
              >
                {s.label}
              </h2>
              <span className="font-mono text-[11px] text-(--ink)/60">
                {s.yesPct}:{100 - s.yesPct} · {s.total}표
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* 투표 전 카드 */}
              <div className="brutal brutal-lg bg-(--paper) p-6 relative overflow-hidden">
                <div className="font-(family-name:--font-accent) text-[11px] text-(--acid-pink) tracking-[0.2em] mb-3">
                  PRE-VOTE
                </div>
                <p
                  className="font-(family-name:--font-display) text-[20px] leading-[1.25] tracking-tight break-keep mb-5"
                  style={{ WebkitTextStroke: "0.2px var(--ink)" }}
                >
                  {s.question}
                </p>
                <p className="font-mono text-[11px] text-(--ink)/70 mb-2.5 text-center">
                  ↳ {tease}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="brutal py-3 bg-(--yes) text-(--paper) text-center font-(family-name:--font-display) text-[18px]">
                    가능!
                    <div className="text-[10px] font-mono opacity-80">ㅇㅇ 가능각</div>
                  </div>
                  <div className="brutal py-3 bg-(--no) text-(--paper) text-center font-(family-name:--font-display) text-[18px]">
                    불가능
                    <div className="text-[10px] font-mono opacity-80">ㄴㄴ 이건 못참</div>
                  </div>
                </div>
              </div>

              {/* 투표 후 결과 (가능 선택 가정) */}
              <div className="brutal brutal-lg bg-(--paper) p-6">
                <div className="font-(family-name:--font-accent) text-[11px] text-(--acid-pink) tracking-[0.2em] mb-3">
                  POST-VOTE (가능 선택)
                </div>
                <ResultGauge
                  yesPct={s.yesPct}
                  noPct={100 - s.yesPct}
                  myChoice={true}
                  totalCount={s.total}
                />
              </div>
            </div>

            {/* 추가 카피 디버그 박스 */}
            <details className="brutal bg-(--paper-tint) p-3">
              <summary className="font-mono text-[11px] cursor-pointer text-(--ink)/70">
                ▾ 카피 raw 값 확인
              </summary>
              <div className="font-mono text-[11px] mt-2 space-y-1 text-(--ink)/80">
                <div>tease: <b>{tease}</b></div>
                <div>headline (yes-side): <b>{headlineYes}</b></div>
                <div>headline (no-side): <b>{headlineNo}</b></div>
                {cohortYes && <div>cohort (가능 선택): <b>{cohortYes}</b></div>}
                {cohortNo && <div>cohort (불가능 선택): <b>{cohortNo}</b></div>}
              </div>
            </details>
          </section>
        );
      })}

      <footer className="brutal bg-(--ink) text-(--paper) p-5">
        <p className="font-mono text-[11px] leading-5">
          ✓ 7개 시나리오 모두 확인.
          <br />
          카피 수정 필요하면 <code className="bg-(--acid-lime) text-(--ink) px-1">src/lib/hook-copy.ts</code> 손보면 됨.
        </p>
      </footer>
    </main>
  );
}
