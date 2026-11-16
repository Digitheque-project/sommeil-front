import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Vrai pour un identifiant technique (UUID, cuid, longue chaîne hexadécimale) :
 * ce n'est jamais montré à l'écran, seul un numéro lisible l'est.
 */
export function isTechnicalId(value: string | null | undefined): boolean {
  if (!value) return true;
  const v = value.trim();
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ||
    /^c[a-z0-9]{20,}$/i.test(v) ||
    /^[0-9a-f]{20,}$/i.test(v)
  );
}
