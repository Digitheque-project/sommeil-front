import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const AUTH_LOGIN_URL = process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? "https://authentification-front.vercel.app/login";
const AUTH_COOKIE_NAME = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "auth_token";

export default function LoginPage({
  searchParams,
}: Readonly<{
  searchParams: { redirect_to?: string };
}>) {
  const authCookie = cookies().get(AUTH_COOKIE_NAME);
  const redirectTo = searchParams?.redirect_to;

  if (authCookie) {
    if (redirectTo) {
      redirect(redirectTo);
    }
    redirect("/");
  }

  const redirectUrl = new URL(AUTH_LOGIN_URL);
  if (redirectTo) {
    redirectUrl.searchParams.set("redirect_to", redirectTo);
  }

  redirect(redirectUrl);
}
