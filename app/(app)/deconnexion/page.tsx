import { redirect } from "next/navigation";

// Route de compatibilité : aucune session n'est gérée côté Centre de Sommeil.
export default function DeconnexionPage() {
  redirect("/");
}
