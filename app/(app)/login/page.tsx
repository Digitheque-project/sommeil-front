import { redirect } from "next/navigation";

const AUTH_LOGIN_URL = process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? "https://authentification-front.vercel.app/login";

export default function LoginPage() {
  redirect(AUTH_LOGIN_URL);
}
