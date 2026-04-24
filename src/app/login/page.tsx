import { signInWith } from "@/actions/auth";

export default function LoginPage() {
  return (
    <section className="flex-1 flex flex-col items-center justify-center px-6 py-10">
      <div className="brutal brutal-lg w-full bg-(--paper) p-8 relative">
        <span className="sticker absolute -top-4 -left-3 bg-(--acid-pink) text-(--paper) -rotate-6">
          LOGIN
        </span>
        <span className="sticker absolute -top-4 right-4 bg-(--acid-lime) rotate-3">
          ✦ MEMBER
        </span>

        <h2
          className="font-(family-name:--font-display) text-[36px] leading-[0.95] tracking-tight mt-2"
          style={{ WebkitTextStroke: "0.4px var(--ink)" }}
        >
          시작해볼까
          <br />
          <span className="text-(--acid-pink)">찐력 게임</span>
        </h2>
        <p className="text-[12px] text-(--ink)/70 mt-3 font-mono leading-5">
          투표 · 댓글 · 제보는 가입 후 가능.
          <br />
          3초 컷.
        </p>

        <div className="mt-7 space-y-3">
          <form action={signInWith.bind(null, "kakao")}>
            <button
              type="submit"
              className="brutal w-full py-4 bg-[#fee500] font-(family-name:--font-display) text-[20px] tracking-tight flex items-center justify-center gap-2"
            >
              <span>💬</span> 카카오로 계속하기
            </button>
          </form>
          <form action={signInWith.bind(null, "google")}>
            <button
              type="submit"
              className="brutal w-full py-4 bg-(--paper) font-(family-name:--font-display) text-[20px] tracking-tight flex items-center justify-center gap-2"
            >
              <span>🌐</span> 구글로 계속하기
            </button>
          </form>
        </div>

        <p className="mt-6 text-[10px] font-mono text-center text-(--ink)/50 leading-5">
          By logging in you accept the FUN TERMS.
          <br />
          아무 책임도 지지 않습니다.
        </p>
      </div>
    </section>
  );
}
