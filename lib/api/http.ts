import { getSommeilApiUrl } from "./consultation-config";

/**
 * Accès HTTP mutualisé au backend sommeil-back.
 * Les clés de stockage suivent celles posées par AuthContext.
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token")
  );
}

export function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * Remonte le message d'erreur du backend plutôt qu'un code HTTP brut :
 * les refus métier (compte rendu validé, examen déjà démarré...) sont
 * affichés tels quels à l'utilisateur.
 */
export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Erreur HTTP ${res.status}`;
    try {
      const error = await res.json();
      if (Array.isArray(error?.message)) message = error.message.join(", ");
      else if (error?.message) message = error.message;
    } catch {
      /* réponse sans corps JSON : on garde le code HTTP */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
};

export async function sommeilApi<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query } = options;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const queryString = params.toString();
  const url = `${getSommeilApiUrl(path)}${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  return handleResponse<T>(res);
}
