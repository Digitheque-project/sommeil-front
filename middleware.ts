import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAME = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "sommeil_auth_token";
const AUTH_LOGIN_URL =
  process.env.NEXT_PUBLIC_AUTH_LOGIN_URL || "https://authentification-front.vercel.app/login";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken =
    request.nextUrl.searchParams.get("accessToken") ||
    request.nextUrl.searchParams.get("accesstoken");

  // Le portail SSO redirige le service avec le JWT dans l'URL. On le retire
  // immédiatement de l'URL et le conserve dans un cookie de ce domaine.
  if (accessToken) {
    const destination = request.nextUrl.clone();
    destination.searchParams.delete("accessToken");
    destination.searchParams.delete("accesstoken");
    const response = NextResponse.redirect(destination);
    response.cookies.set(AUTH_COOKIE_NAME, accessToken, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  }

  // Après le choix du service dans le portail SSO, la base URL du service
  // est appelée. La racine de cette application est son tableau de bord.
  // Aucun second saut n'est nécessaire : le jeton est déjà présent dans le
  // cookie posé juste au-dessus.

  if (pathname === "/login" || pathname === "/deconnexion") {
    return NextResponse.next();
  }

  const token =
    request.cookies.get(AUTH_COOKIE_NAME)?.value ||
    request.cookies.get("auth_token")?.value ||
    request.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL(AUTH_LOGIN_URL));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico|robots.txt|api).*)"],
};
