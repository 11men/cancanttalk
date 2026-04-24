// Lightweight client+server shared moderation filter.
// This is the FIRST line of defense — deliberately conservative, low false
// negative is preferred over low false positive. Upgrade to server-side LLM
// moderation (OpenAI Moderation API / CLOVA) as a second layer later.
//
// The list is intentionally short and focused on blatant profanity, slurs,
// and violent threats. It is NOT exhaustive — users will find ways around
// single-word filters. The goal is to raise the friction for casual abuse.

const BANNED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // Korean profanity (explicit / slurs / sexual harassment)
  { pattern: /씨[\s.,!?*_-]*발|시[\s.,!?*_-]*발/i, reason: "욕설" },
  { pattern: /좆|존나|좇|좃/i, reason: "욕설" },
  { pattern: /병[\s.,!?*_-]*신|븅[\s.,!?*_-]*신/i, reason: "모욕" },
  { pattern: /개[\s.,!?*_-]*새[기끼]|개[\s.,!?*_-]*자식/i, reason: "모욕" },
  { pattern: /호[\s.,!?*_-]*모|게이[\s.,!?*_-]*새[기끼]/i, reason: "혐오" },
  { pattern: /섹스|야동|자위|딸[\s.,!?*_-]*딸/i, reason: "성적 콘텐츠" },
  { pattern: /니[\s.,!?*_-]*애[\s.,!?*_-]*미|에[\s.,!?*_-]*미/i, reason: "패드립" },
  { pattern: /죽여|자살|자해|목[\s.,!?*_-]*매/i, reason: "폭력/자해" },
  // Discriminatory slurs
  { pattern: /장애[\s.,!?*_-]*인[\s.,!?*_-]*새[기끼]|틀[\s.,!?*_-]*딱/i, reason: "차별 발언" },
  // English (explicit)
  { pattern: /\bfuck(ing|er)?\b/i, reason: "profanity" },
  { pattern: /\bshit\b/i, reason: "profanity" },
  { pattern: /\b(retard|retarded)\b/i, reason: "slur" },
  { pattern: /\bn[i1]gg(er|a)\b/i, reason: "slur" },
];

export type ModerationResult =
  | { ok: true }
  | { ok: false; reason: string; matched: string };

export function moderate(content: string): ModerationResult {
  const normalized = content.normalize("NFC");
  for (const { pattern, reason } of BANNED_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      return { ok: false, reason, matched: match[0] };
    }
  }
  return { ok: true };
}

// Convenience for components that want a simple yes/no with a user-facing
// message ready to show.
export function moderateForUser(content: string): {
  allowed: boolean;
  message?: string;
} {
  const result = moderate(content);
  if (result.ok) return { allowed: true };
  return {
    allowed: false,
    message: `전송 차단: ${result.reason} 감지 — 표현을 다시 써주세요`,
  };
}
