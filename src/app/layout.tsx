import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/Header";
import Marquee from "@/components/Marquee";
import "./globals.css";

export const metadata: Metadata = {
  title: "찐력 챌린지 ✦ 이게 가능?",
  description: "아슬아슬 킹받는 상황, 너는 가능? 불가능? 도파민 테스트 지금.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col relative">
        <Marquee />
        <Header />
        <main className="flex-1 flex flex-col relative z-10 max-w-[480px] w-full mx-auto">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
