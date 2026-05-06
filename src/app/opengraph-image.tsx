import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "찐력 챌린지";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fffcef",
          color: "#0a0a0a",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: 40,
            left: 40,
            background: "#ff2e93",
            color: "#fffcef",
            padding: "6px 18px",
            border: "4px solid #0a0a0a",
            fontSize: 22,
            fontWeight: 900,
            transform: "rotate(-3deg)",
            boxShadow: "8px 8px 0 0 #0a0a0a",
          }}
        >
          TEST YOUR LIMIT
        </div>
        <div
          style={{
            fontSize: 160,
            fontWeight: 900,
            letterSpacing: -6,
            lineHeight: 0.9,
            color: "#0a0a0a",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              background: "#ff2e93",
              color: "#fffcef",
              padding: "0 16px",
              transform: "rotate(-2deg)",
            }}
          >
            이게 가능?
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 16,
              background: "#0a0a0a",
              color: "#d4ff00",
              padding: "0 16px",
              transform: "rotate(1deg)",
            }}
          >
            불가능?
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 32,
            color: "#0a0a0a",
            fontWeight: 900,
            letterSpacing: -1,
          }}
        >
          다들 갈렸음 · 너는?
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 14,
            fontSize: 22,
            color: "#555555",
            fontFamily: "monospace",
          }}
        >
          익명 / 1020 / 결과는 들어와야 보임
        </div>
      </div>
    ),
    { ...size },
  );
}
