# ADR 0002 — Tailwind v4 shortform CSS-var 형식

- 상태: 채택
- 일자: 2026-04-24 (PR #1, HDPark95)
- 적용 강화: 2026-05-04 (Claude + kdelay)

## 배경

dev 환경에서 멀쩡하게 동작하던 `bg-[var(--paper)]` / `text-[var(--ink)]/70` / `font-[family-name:var(--font-display)]` 같은 임의값 CSS-var 클래스가 **prod에서 silently purge**되어 디자인이 거의 unstyled 수준으로 깨졌다.

원인 추정: Tailwind v4의 자동 콘텐츠 검출이 위 형식을 emit 대상으로 인식하지 못함(또는 dev/prod에서 다르게 처리). custom utility(`.brutal`, `.sticker`, `.marquee-track`)는 globals.css에 직접 있어서 살아남았지만 임의값 클래스가 통째로 사라짐.

## 결정

전 컴포넌트의 임의값 CSS-var 클래스를 v4 native shortform으로 일괄 변환:

```
bg-[var(--paper)]                      → bg-(--paper)
text-[var(--ink)]/70                   → text-(--ink)/70
border-[var(--ink)]                    → border-(--ink)
font-[family-name:var(--font-display)] → font-(family-name:--font-display)
```

shortform이 **cover하지 못하는 케이스**:
- compound box-shadow (`shadow-[4px_4px_0_0_var(--ink)]`) → inline `style={{ boxShadow: "4px 4px 0 0 var(--ink)" }}`로 분리
- compound transform/transition 등 var()이 섞인 다값 속성 → 동일 inline 처리

추가로 발견된 부수 이슈:

1. **`mx-auto` 무력화**: `globals.css`의 `* { margin: 0 }` reset 룰이 `.mx-auto` shortform을 덮어쓰는 (또는 v4 emit 우선순위 문제로) 케이스 발생 → `layout.tsx` body/main에 `items-center` 추가로 회피
2. **Satori OG 이미지**: `display: inline-block` 미지원, 자식 element 여러 개 있는 div는 명시적으로 `display: flex` 필요

## 결과

- ✅ prod 디자인 정상 복구
- ✅ dev/prod 동등성 보장
- ⚠️ 새 코드 작성 시 자동완성이 `[var(--X)]`을 추천할 수 있음 — 코드리뷰에서 잡거나 lint rule 추가 검토

## Lint 권장 (TODO)

```js
// eslint custom rule: disallow Tailwind className containing /\[var\(--/
```

지금은 PR 리뷰로 catch.
