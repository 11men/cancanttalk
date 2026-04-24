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
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span>이게</span>
            <span
              style={{
                background: "#ff2e93",
                color: "#fffcef",
                padding: "0 16px",
                transform: "rotate(-2deg)",
                display: "flex",
              }}
            >
              가능?
            </span>
          </div>
          <div style={{ marginTop: 8, display: "flex" }}>
            <span
              style={{
                background: "#0a0a0a",
                color: "#d4ff00",
                padding: "0 16px",
                transform: "rotate(1deg)",
                display: "flex",
              }}
            >
              불가능?
            </span>
          </div>
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 28,
            color: "#555",
            fontFamily: "monospace",
          }}
        >
          1020 찐찐찐 도파민 · 실시간 투표장
        </div>
      </div>
    ),
    { ...size },
  );
}
