import { NextResponse, type NextRequest } from "next/server";

const ANON_COOKIE = "anon_id";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function proxy(request: NextRequest) {
  const res = NextResponse.next({ request });

  if (!request.cookies.get(ANON_COOKIE)) {
    const id = crypto.randomUUID();
    res.cookies.set(ANON_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_YEAR,
    });
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
