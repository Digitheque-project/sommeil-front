import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const AUTH_LOGIN_URL = process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? "https://authentification-front.vercel.app/login";
const AUTH_COOKIE_NAME = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "auth_token";

export default async function LoginPage({
  searchParams,
}: Readonly<{
  searchParams: {
    redirect_to?: string;
    return_to?: string;
    next?: string;
    redirect?: string;
    callback_url?: string;
    next_url?: string;
    returnUrl?: string;
    callbackUrl?: string;
    token?: string;
    access_token?: string;
    auth_token?: string;
    id_token?: string;
    code?: string;
  };
}>) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  const redirectTo =
    searchParams?.redirect_to ??
    searchParams?.return_to ??
    searchParams?.next ??
    searchParams?.next_url ??
    searchParams?.redirect ??
    searchParams?.callback_url ??
    searchParams?.callbackUrl ??
    searchParams?.returnUrl;
  const tokenFromAuth =
    searchParams?.token ??
    searchParams?.access_token ??
    searchParams?.auth_token ??
    searchParams?.id_token ??
    searchParams?.code;

  if (!authCookie && tokenFromAuth) {
    cookieStore.set({
      name: AUTH_COOKIE_NAME,
      value: tokenFromAuth,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24,
    });
    redirect(redirectTo ?? "/");
  }

  if (authCookie) {
    if (redirectTo) {
      redirect(redirectTo);
    }
    redirect("/");
  }

  const redirectUrl = new URL(AUTH_LOGIN_URL);
  if (redirectTo) {
    const redirectParams = [
      "redirect_to",
      "return_to",
      "next",
      "next_url",
      "redirect",
      "callback_url",
      "callbackUrl",
      "returnUrl",
    ];
    redirectParams.forEach((key) => redirectUrl.searchParams.set(key, redirectTo));
  }

  redirect(redirectUrl.toString());
}
