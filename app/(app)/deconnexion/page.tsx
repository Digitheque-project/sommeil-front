"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AUTH_LOGIN_URL } from "@/lib/auth";

export default function DeconnexionPage() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
    window.location.replace(AUTH_LOGIN_URL);
  }, [logout]);

  return <main className="grid min-h-screen place-items-center text-sm text-slate-500">Déconnexion en cours…</main>;
}
