"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { createComment, reactToComment } from "@/actions/comment";

type CommentRow = {
  id: string;
  content: string;
  like_count: number;
  dislike_count: number;
  created_at: string;
  user_id: string;
  profiles: { nickname: string | null } | null;
};

type Props = {
  questionId: string;
  open: boolean;
  onClose: () => void;
  isAuthed: boolean;
};

export default function CommentSheet({
  questionId,
  open,
  onClose,
  isAuthed,
}: Props) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    setLoading(true);

    (async () => {
      const { data } = await supabase
        .from("comments")
        .select(
          "id, content, like_count, dislike_count, created_at, user_id, profiles(nickname)",
        )
        .eq("question_id", questionId)
        .order("created_at", { ascending: false })
        .limit(50);
      setComments((data as CommentRow[] | null) ?? []);
      setLoading(false);
    })();

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
            .select(
              "id, content, like_count, dislike_count, created_at, user_id, profiles(nickname)",
            )
            .eq("id", payload.new.id)
            .maybeSingle();
          if (data) setComments((prev) => [data as CommentRow, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, questionId]);

  function handleSubmit() {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    startTransition(async () => {
      const res = await createComment(questionId, content);
      if (!res.ok) alert(res.error);
    });
  }

  function handleReact(commentId: string, kind: "like" | "dislike") {
    if (!isAuthed) return alert("로그인이 필요합니다");
    startTransition(async () => {
      await reactToComment(commentId, kind);
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
    });
  }

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-[var(--ink)]/40 z-[90] transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden
      />

      <div
        className={`fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[88%] bg-[var(--paper)] z-[100] border-t-[4px] border-x-[3px] border-[var(--ink)] transition-[bottom] duration-300 ease-[cubic-bezier(.2,1.3,.4,1)] flex flex-col shadow-[0_-12px_0_0_var(--ink)] ${
          open ? "bottom-0" : "-bottom-full"
        }`}
      >
        {/* handle */}
        <div className="flex justify-center py-2 border-b-2 border-[var(--ink)] bg-[var(--acid-pink)]">
          <span className="w-14 h-1.5 bg-[var(--paper)] rounded-full" />
        </div>

        <div className="px-5 py-4 border-b-2 border-[var(--ink)] flex justify-between items-center bg-[var(--acid-pink)] text-[var(--paper)]">
          <h3
            className="font-[family-name:var(--font-display)] text-[22px] tracking-tight"
            style={{ WebkitTextStroke: "0.3px var(--paper)" }}
          >
            실시간 반응 💬
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="sticker bg-[var(--paper)] text-[var(--ink)]"
          >
            ✕ CLOSE
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="text-center font-mono text-sm text-[var(--ink)]/60 mt-16 animate-pulse">
              LOADING...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center mt-16">
              <div className="text-5xl mb-2 animate-wiggle">💭</div>
              <p
                className="font-[family-name:var(--font-display)] text-[18px]"
                style={{ WebkitTextStroke: "0.2px var(--ink)" }}
              >
                첫 반응의 주인공?
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li
                  key={c.id}
                  className="brutal bg-[var(--paper-tint)] p-4 animate-slide-up"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="sticker bg-[var(--acid-lime)] text-[10px]">
                      @{c.profiles?.nickname ?? "익명"}
                    </span>
                    <span className="font-mono text-[9px] text-[var(--ink)]/50">
                      {new Date(c.created_at).toLocaleString("ko", {
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed my-2">
                    {c.content}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => handleReact(c.id, "like")}
                      disabled={isPending}
                      className="brutal bg-[var(--paper)] px-3 py-1 text-xs font-bold hover:bg-[var(--acid-lime)]"
                    >
                      👍 {c.like_count}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReact(c.id, "dislike")}
                      disabled={isPending}
                      className="brutal bg-[var(--paper)] px-3 py-1 text-xs font-bold hover:bg-[var(--acid-pink)] hover:text-[var(--paper)]"
                    >
                      👎 {c.dislike_count}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {isAuthed ? (
          <div className="p-4 border-t-[3px] border-[var(--ink)] bg-[var(--paper-tint)]">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="찐 반응 남기기..."
                maxLength={500}
                className="brutal flex-1 bg-[var(--paper)] px-4 py-3 text-sm outline-none"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || !input.trim()}
                className="brutal bg-[var(--ink)] text-[var(--paper)] px-5 py-3 font-[family-name:var(--font-accent)] text-xs tracking-wider disabled:opacity-50"
              >
                POST
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t-[3px] border-[var(--ink)] bg-[var(--paper-tint)] text-center">
            <p className="text-xs font-mono text-[var(--ink)]/70">
              LOGIN TO REACT
            </p>
          </div>
        )}
      </div>
    </>
  );
}
