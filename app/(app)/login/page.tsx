"use client";

import { useEffect } from "react";
import { AUTH_LOGIN_URL } from "@/lib/auth";

export default function LoginPage() {
  useEffect(() => {
    window.location.replace(AUTH_LOGIN_URL);
  }, []);

  return <main className="grid min-h-screen place-items-center text-sm text-slate-500">Redirection vers la connexion sécurisée…</main>;
}
