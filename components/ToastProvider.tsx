"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ToastKind = "success" | "error";
type ToastState = { id: number; message: string; kind: ToastKind } | null;

type ToastContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_STYLES: Record<ToastKind, string> = {
  success: "bg-emerald-600",
  error: "bg-red-600",
};

const KIND_ICONS: Record<ToastKind, string> = {
  success: "check_circle",
  error: "error",
};

/**
 * Toast global de l'application : un seul actif à la fois (un nouveau message
 * remplace le précédent), auto-masqué après 4s. Succès en vert, erreur en
 * rouge — avant ça, la plupart des pages réutilisaient la même barre grise
 * pour les deux, rendant un échec indiscernable d'une réussite.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToastState] = useState<ToastState>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToastState(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const showSuccess = useCallback(
    (message: string) => setToastState({ id: Date.now(), message, kind: "success" }),
    []
  );
  const showError = useCallback(
    (message: string) => setToastState({ id: Date.now(), message, kind: "error" }),
    []
  );

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-xl ${KIND_STYLES[toast.kind]}`}
        >
          <span className="material-symbols-outlined text-[18px]">{KIND_ICONS[toast.kind]}</span>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans un ToastProvider");
  return ctx;
}
