import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_LOGIN_URL = process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? "https://authentification-front.vercel.app/login";
const AUTH_COOKIE_NAME = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "auth_token";

const PUBLIC_PATHS = [
  "/login",
  "/deconnexion",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }

  return pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname.startsWith("/api");
}

function hasAuthCookie(request: NextRequest) {
  return (
    Boolean(request.cookies.get(AUTH_COOKIE_NAME)) ||
    Boolean(request.cookies.get("auth_token")) ||
    Boolean(request.cookies.get("session")) ||
    Boolean(request.cookies.get("next-auth.session-token"))
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (hasAuthCookie(request)) {
    return NextResponse.next();
  }

  const redirectUrl = new URL(AUTH_LOGIN_URL);
  redirectUrl.searchParams.set("redirect_to", request.nextUrl.href);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico|robots.txt|login|deconnexion|api).*)"],
};
