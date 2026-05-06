"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { createComment, reactToComment } from "@/actions/comment";

type CommentRow = {
  id: string;
  parent_id: string | null;
  anon_id: string;
  nickname: string;
  content: string;
  like_count: number;
  dislike_count: number;
  created_at: string;
};

type Props = {
  questionId: string;
  open: boolean;
  onClose: () => void;
  initialNickname?: string;
};

const SELECT_COLS =
  "id, parent_id, anon_id, nickname, content, like_count, dislike_count, created_at";

export default function CommentSheet({
  questionId,
  open,
  onClose,
  initialNickname,
}: Props) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [input, setInput] = useState("");
  const [nickname, setNickname] = useState(initialNickname ?? "");
  const [replyTo, setReplyTo] = useState<CommentRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  // 1) 시트 열릴 때마다 초기 로드 (questionId 바뀌면 다시 로드)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const supabase = createClient();
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(SELECT_COLS)
        .eq("question_id", questionId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled) return;
      if (error) console.error("[CommentSheet] fetch error:", error);
      setComments((data as CommentRow[] | null) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, questionId]);

  // 2) realtime 구독은 questionId 단위로 한 번만 (open 토글로 재구독 안 함)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`comments:${questionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `question_id=eq.${questionId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("comments")
            .select(SELECT_COLS)
            .eq("id", payload.new.id)
            .maybeSingle();
          if (data) {
            setComments((prev) =>
              prev.some((c) => c.id === (data as CommentRow).id)
                ? prev
                : [...prev, data as CommentRow],
            );
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [questionId]);

  function handleSubmit() {
    if (!input.trim()) return;
    const cleanNick = nickname.trim() || "익명";
    const content = input.trim();
    const prevReply = replyTo; // 클로저 캡처해서 롤백 시 stale 방지
    const parentId = prevReply?.id ?? null;
    setInput("");
    setReplyTo(null);
    startTransition(async () => {
      const res = await createComment(questionId, content, cleanNick, parentId);
      if (!res.ok) {
        alert(res.error ?? "댓글 작성 실패");
        setInput(content);
        if (prevReply) setReplyTo(prevReply);
      }
    });
  }

  function handleReact(commentId: string, kind: "like" | "dislike") {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              like_count: kind === "like" ? c.like_count + 1 : c.like_count,
              dislike_count:
                kind === "dislike" ? c.dislike_count + 1 : c.dislike_count,
            }
          : c,
      ),
    );
    startTransition(async () => {
      const res = await reactToComment(commentId, kind);
      if (!res.ok) {
        // 롤백
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  like_count:
                    kind === "like" ? c.like_count - 1 : c.like_count,
                  dislike_count:
                    kind === "dislike"
                      ? c.dislike_count - 1
                      : c.dislike_count,
                }
              : c,
          ),
        );
        alert(res.error ?? "반응 실패");
      }
    });
  }

  const roots = comments.filter((c) => c.parent_id === null);
  const repliesBy = new Map<string, CommentRow[]>();
  for (const c of comments) {
    if (c.parent_id) {
      const arr = repliesBy.get(c.parent_id) ?? [];
      arr.push(c);
      repliesBy.set(c.parent_id, arr);
    }
  }

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-(--ink)/40 z-[90] transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden
      />

      <div
        className={`fixed left-1/2 -translate-x-1/2 w-full max-w-xl h-[88%] bg-(--paper) z-[100] border-t-[4px] border-x-[3px] border-(--ink) transition-[bottom] duration-300 ease-[cubic-bezier(.2,1.3,.4,1)] flex flex-col ${
          open ? "bottom-0" : "-bottom-full"
        }`}
        style={{ boxShadow: "0 -12px 0 0 var(--ink)" }}
      >
        {/* handle */}
        <div className="flex justify-center py-2 border-b-2 border-(--ink) bg-(--acid-pink)">
          <span className="w-14 h-1.5 bg-(--paper) rounded-full" />
        </div>

        <div className="px-5 py-4 border-b-2 border-(--ink) flex justify-between items-center bg-(--acid-pink) text-(--paper)">
          <h3 className="font-(family-name:--font-display) text-[22px] tracking-tight">
            실시간 반응 💬
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="sticker bg-(--paper) text-(--ink)"
          >
            ✕ CLOSE
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="text-center font-mono text-sm text-(--ink)/60 mt-16 animate-pulse">
              LOADING...
            </div>
          ) : roots.length === 0 ? (
            <div className="text-center mt-16">
              <div className="text-5xl mb-2 animate-wiggle">🪝</div>
              <p
                className="font-(family-name:--font-display) text-[22px] leading-tight text-(--ink)"
                style={{ WebkitTextStroke: "0.3px var(--ink)" }}
              >
                첫 댓글이 다 가져감
              </p>
              <p className="font-mono text-[11px] text-(--ink)/60 mt-2">
                NO COMMENTS YET · 한 줄 던지기 GO
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {roots.map((c) => (
                <CommentNode
                  key={c.id}
                  comment={c}
                  replies={repliesBy.get(c.id) ?? []}
                  onReact={handleReact}
                  onReply={() => setReplyTo(c)}
                  isPending={isPending}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 sm:p-5 border-t-[3px] border-(--ink) bg-(--paper-tint) space-y-3">
          {replyTo && (
            <div className="flex items-center justify-between text-[11px] font-mono bg-(--acid-lime) border-2 border-(--ink) px-3 py-2">
              <span className="truncate">
                ↱ @{replyTo.nickname} 에게 답글 쓰는 중
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 20))}
            placeholder="닉네임 (최대 20자)"
            maxLength={20}
            className="brutal bg-(--paper) w-full px-4 py-2.5 text-sm font-bold outline-none"
          />
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={replyTo ? "답글 남기기..." : "솔직하게 한 줄 · 익명이야 막 던져"}
              maxLength={500}
              className="brutal bg-(--paper) flex-1 min-w-0 px-4 py-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !input.trim()}
              className="brutal bg-(--ink) text-(--paper) px-5 py-3 font-(family-name:--font-accent) text-xs tracking-wider disabled:opacity-50 shrink-0"
            >
              POST
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function CommentNode({
  comment,
  replies,
  onReact,
  onReply,
  isPending,
  isReply = false,
}: {
  comment: CommentRow;
  replies: CommentRow[];
  onReact: (id: string, kind: "like" | "dislike") => void;
  onReply: () => void;
  isPending: boolean;
  isReply?: boolean;
}) {
  return (
    <li className={isReply ? "" : "animate-slide-up"}>
      <div className={`brutal ${isReply ? "bg-(--paper)" : "bg-(--paper-tint)"} p-4`}>
        <div className="flex items-center justify-between mb-1">
          <span className="sticker bg-(--acid-lime) text-[10px]">
            @{comment.nickname}
          </span>
          <span className="font-mono text-[9px] text-(--ink)/50">
            {new Date(comment.created_at).toLocaleString("ko", {
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            })}
          </span>
        </div>
        <p className="text-sm font-medium leading-relaxed my-2 text-(--ink)">
          {comment.content}
        </p>
        <div className="flex gap-2.5 mt-3 flex-wrap">
          <button
            type="button"
            onClick={() => onReact(comment.id, "like")}
            disabled={isPending}
            className="brutal bg-(--paper) px-3 py-1 text-xs font-bold hover:bg-(--acid-lime)"
          >
            👍 {comment.like_count}
          </button>
          <button
            type="button"
            onClick={() => onReact(comment.id, "dislike")}
            disabled={isPending}
            className="brutal bg-(--paper) px-3 py-1 text-xs font-bold hover:bg-(--acid-pink) hover:text-(--paper)"
          >
            👎 {comment.dislike_count}
          </button>
          {!isReply && (
            <button
              type="button"
              onClick={onReply}
              className="brutal bg-(--paper) px-3 py-1 text-xs font-bold hover:bg-(--hot-cyan)"
            >
              ↱ 답글
            </button>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <ul className="mt-2 pl-5 space-y-2 border-l-[3px] border-(--ink)/40">
          {replies.map((r) => (
            <CommentNode
              key={r.id}
              comment={r}
              replies={[]}
              onReact={onReact}
              onReply={onReply}
              isPending={isPending}
              isReply
            />
          ))}
        </ul>
      )}
    </li>
  );
}
