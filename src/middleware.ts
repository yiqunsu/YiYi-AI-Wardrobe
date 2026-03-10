/**
 * Next.js Edge Middleware [module: middleware]
 * Protects /dashboard, /service, /settings routes by checking the
 * lightweight session hint cookie set by AuthContext on login/logout.
 * The cookie is a UX hint only — actual JWT validation is enforced by
 * each API route handler independently.
 */
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/service", "/settings"];
const SESSION_COOKIE = "yiyi-has-session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtected) return NextResponse.next();

  const hasSession = req.cookies.get(SESSION_COOKIE)?.value === "1";
  if (!hasSession) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/service/:path*", "/settings/:path*"],
};
