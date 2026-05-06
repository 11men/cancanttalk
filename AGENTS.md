<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# cancanttalk 작업 룰

이 프로젝트에서 코드를 만지기 전에 반드시 알아둘 것. 깊은 설명은 `docs/`에 있음.

## 1. 핵심 모델: 익명

- 로그인 없음. `proxy.ts`가 첫 방문 시 `anon_id` 쿠키(1년)를 발급한다.
- 투표 PK = `(anon_id, question_id)`. 댓글은 닉네임 직접 입력 + `parent_id`로 1단 대댓글.
- 어드민은 `ADMIN_KEY` 쿠키 게이트(env와 매칭). 옛 OAuth/profiles/login 라우트는 모두 제거됨 — 되살리지 말 것.
- 자세한 흐름은 [`docs/architecture.md`](docs/architecture.md).

## 2. Tailwind v4 ⚠️ prod에서 silently purge되는 형식

```
❌ bg-[var(--paper)]   text-[var(--ink)]/70   font-[family-name:var(--font-display)]
✅ bg-(--paper)         text-(--ink)/70         font-(family-name:--font-display)
```

복합 box-shadow는 inline `style={{ boxShadow: "..." }}`로 분리한다 (shortform이 compound shadow를 못 다룸).

`globals.css`의 `* { margin: 0 }`이 `mx-auto`를 덮어쓰는 경우가 있어 `layout.tsx`의 body/main에 `items-center`를 둔다. 함부로 제거하지 말 것.

배경: [`docs/decisions/0002-tailwind-v4-shortform.md`](docs/decisions/0002-tailwind-v4-shortform.md).

## 3. 후킹 카피 시스템

- 카드 미끼 / 결과 헤드라인 / 코호트 라인은 `src/lib/hook-copy.ts`가 vote_count·yes_pct 기반으로 동적 생성. 가짜 숫자 하드코딩 금지(1020 타겟에서 즉시 식음).
- 카테고리 라벨은 `src/lib/category-style.ts`의 `hookName`으로 매핑("연애" → "썸 vs 손절"). DB의 `name`을 직접 표시하지 말 것.
- 카피 톤 원칙: 명령 X / 초대 O. 메인 라벨은 정상 ("가능"/"불가능"), 보조에만 1020 슬랭 ("ㅇㅇ 가능각"/"ㄴㄴ 이건 못참") 정도로 절제.

## 4. ISR과 cookies

`src/app/(...)`에서 `cookies()`를 읽으면 그 라우트는 강제 dynamic이 된다. anon_id가 필요 없는 페이지(홈/랭킹/sitemap)는 `src/lib/supabase/anon-server.ts`의 cookieless 클라이언트로 ISR 정적화한다.

## 5. 배포 / DB

- `main` push → Vercel 자동 배포. 깨질 때 절차는 [`docs/operations.md`](docs/operations.md).
- DB 마이그레이션은 Supabase Dashboard → SQL Editor 수동 실행. CLI/psql/service_role 미보유.
- 새 마이그레이션을 추가했다면 PR description에 "마이그레이션 적용 필요" 명시.

## 6. 보안

`.env*` / `.vercel` / `.claude` / `.playwright-mcp`은 gitignore. repo가 public이라도 secret은 코드에 절대 인라인 금지 — 모두 `process.env.X` 참조만.
