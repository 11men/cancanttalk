# Operations

자주 쓰는 운영 절차. 절차가 안 통하면 [architecture](architecture.md)부터 다시 보자.

## 환경변수

`.env.local`(로컬) + Vercel **Settings → Environment Variables**(prod·preview)에 동일하게 등록.

| 키 | 어디서 얻나 | 비고 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Settings → API | client 노출 OK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Settings → API | RLS로 보호되므로 client 노출 OK |
| `NEXT_PUBLIC_SITE_URL` | 정식 도메인 | 선택. OG/sitemap에 사용 |
| `ADMIN_KEY` | 직접 생성한 비밀 문자열 | **절대 client 노출 X**. server action에서만 비교 |

`ADMIN_KEY` 값을 잃었거나 노출됐다면:
```bash
vercel env rm ADMIN_KEY production
echo "$(openssl rand -hex 16)" | vercel env add ADMIN_KEY production
```
새 값을 사용자 `.env.local`에도 동기화. git에는 절대 커밋 X.

---

## DB 마이그레이션

CLI/psql/service_role 미보유 환경. 아래 절차로 수동 실행.

1. Supabase Dashboard → SQL Editor 열기
2. `supabase/migrations/` 안 파일을 **타임스탬프 순서대로** 실행
   - `20260421000001_init_schema.sql`
   - `20260421000002_seed_data.sql`
   - `20260423000001_anonymous_community.sql`
3. PR에 새 마이그레이션을 추가했다면 PR description에 "마이그레이션 적용 필요" 명시
4. prod 배포 전에 마이그레이션 먼저 실행 — **순서 거꾸로 가면 prod 깨짐**

새 마이그레이션 파일명 규칙: `YYYYMMDDHHMMSS_<slug>.sql`. 항상 idempotent하게 작성(`drop ... if exists`, `add column if not exists`).

---

## 배포

### 평소

```
git push origin main
```

→ Vercel webhook → 자동 빌드 → `cancanttalk.vercel.app` alias 갱신.

### 자동 배포 검증 명령

```bash
SHA=$(git rev-parse HEAD)
gh api repos/11men/cancanttalk/commits/$SHA/status --jq '.state'
# pending → success/failure
```

### 자동 배포가 안 갈 때 (CLI 수동)

```bash
vercel --prod --yes
```

prod alias가 즉시 갱신됨. 단 GitHub commit status는 안 찍힘.

### Vercel ↔ GitHub 연결 끊겼을 때

```bash
vercel git connect https://github.com/11men/cancanttalk.git --yes
```

403 또는 "Login Connection 필요" 에러 시:
- https://vercel.com/account/login-connections 에서 GitHub 연결 후 재시도
- repo가 organization-owned private이면 Hobby plan은 자동 배포 불가 → public 전환 또는 Pro 업그레이드

### 빌드 깨졌을 때

1. Vercel Dashboard → Deployments → 실패한 deployment → Logs 확인
2. 또는 `vercel inspect <deployment-url>`
3. 로컬에서 `npm run build`로 재현 시도

---

## 검수 (어드민)

1. `/admin` 진입 → ADMIN_KEY 입력 → 쿠키 set
2. 대기 큐(status=pending)에서 ✓ APPROVE / ✕ REJECT
3. status 변경은 service_role 권한이 필요하므로 server action(`src/actions/moderate.ts`)이 처리

권한 없이 status 강제로 바꾸려면 Supabase Dashboard SQL Editor에서:
```sql
update public.questions set status = 'approved' where id = '<uuid>';
```

---

## Repo 가시성

현재 repo는 **public** (Hobby plan 자동 배포 위해). 변경 시 보안 영향:

- private 전환: Vercel auto-deploy 끊김 → Pro 업그레이드 또는 GitHub Actions 우회 필요
- public 유지: secret이 코드/history에 절대 들어가지 않게 주의 — `process.env.X` 참조만

Public 전환 전 secret 스캔 명령:
```bash
git grep -niE "(sk-[a-z0-9]{20,}|ey[a-z0-9_-]{20,}\.[a-z0-9_-]{20,}\.[a-z0-9_-]{20,}|password\s*[:=]\s*['\"][^'\"]{4,})"
git log --all -p | grep -E "^\+.*[A-Za-z0-9+/]{40,}" | grep -vE "node_modules|package-lock|integrity"
```

---

## 캐시 / ISR 디버깅

push 후 prod에 옛 카피가 보이면:

1. **Vercel 빌드 진행 중** — `gh api .../commits/$SHA/status`가 `pending`
2. **ISR 캐시** — `?cb=$(date +%s)` 쿼리로 cache-bust. `x-vercel-cache: MISS`인데도 옛 코드면 빌드/promote 미완료
3. **GitHub-Vercel webhook 끊김** — commit status에 Vercel 체크가 0개

revalidate 시간:
- 홈: 60s
- 랭킹: 300s
- 카테고리 페이지: 30s

---

## 백업·복구

local 작업 중 큰 머지/리베이스 들어가기 전:

```bash
git branch backup/$(date +%Y-%m-%d)-<purpose>
```

prod DB는 Supabase가 자동 백업(plan별 정책 다름). 마이그레이션 전에 중요 테이블은 `create table x_backup as select * from x;`로 임시 스냅샷 권장.
