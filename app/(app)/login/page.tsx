import { redirect } from "next/navigation";

// L'application Centre de Sommeil fonctionne sans écran ni redirection
// d'authentification. Cette route est conservée afin que les anciens liens
// vers /login restent valides.
export default function LoginPage() {
  redirect("/");
}
