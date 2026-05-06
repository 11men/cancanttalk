# ADR 0003 — Repo public 전환 (Vercel Hobby plan 호환용)

- 상태: 채택
- 일자: 2026-05-06
- 결정자: 사용자 (kdelay)

## 배경

Vercel Hobby plan은 **organization-owned private repo**의 자동 배포를 지원하지 않는다(Pro 업그레이드 필요). 이 repo는 GitHub organization `11men` 소유라 두 옵션 중 하나가 강제됐다:

- A. private 유지 + Pro 업그레이드 ($20/월)
- B. public 전환
- C. private 유지 + GitHub Actions로 Vercel deploy 우회 (15분 셋업 + VERCEL_TOKEN 관리)

## 결정

**B. public 전환.**

근거:
- 현재 단계는 사이드 프로젝트 / 1020 도파민 커뮤니티. 코드 비밀성보다 배포 운영 단순성이 더 중요
- secret 스캔 결과 코드/git history에 노출 위험 없음(아래 "검증 결과" 참조)
- `.env*` / `.vercel` / `.claude` / `.playwright-mcp` gitignore 적용됨
- 모든 secret은 `process.env.X` 참조만, 코드에 인라인 안 됨
- 비용 0
- C는 가능하지만 현 단계에선 yak-shaving

## 검증 결과 (전환 직전 스캔)

```
✓ tracked .env / *.pem / *.key / credential 파일 — 0건
✓ JWT/sk-/ghp_/AKIA/password=... 패턴 — 0건
✓ git history 전체에 위 패턴 — 0건
✓ git log 메시지 secret 언급 — 0건
✓ .gitignore: .env* 정상 ignore
✓ README의 supabase URL은 형식 안내 (실제 값 X)
```

## 결과

- ✅ `git push origin main` → Vercel 자동 빌드/배포 즉시 작동
- ✅ 협업자(HDPark95 등) PR 흐름 단순
- ⚠️ **앞으로 secret이 실수로 commit되면 즉시 prod 키 invalidate + history rewrite 필요** — `.env*` gitignore와 `process.env.X` 참조 원칙을 절대 어기지 말 것
- ⚠️ private 다시 필요해지면 Pro 업그레이드 또는 옵션 C로

## 보강 권장 (TODO)

- pre-commit hook(`gitleaks` 또는 `trufflehog`) 추가하면 secret commit 사고 자동 차단
- GitHub Actions secret-scanning은 public repo에서 무료 활성

## 되돌릴 때

```bash
gh repo edit 11men/cancanttalk --visibility private
```

→ Vercel 자동 배포는 재차 끊김. 그때 옵션 C로 우회하거나 Pro 업그레이드.
