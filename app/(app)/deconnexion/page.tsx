import Link from "next/link";
import TopBar from '@/components/TopBar';

const AUTH_LOGIN_URL = process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? "https://authentification-front.vercel.app/login";

export default function DeconnexionPage() {
  return (
    <div className="p-6">
      <TopBar title="Déconnexion" />
      <section className="mt-6 space-y-4">
        <h2 className="font-headline-md text-headline-md">Déconnexion</h2>
        <p className="text-on-surface-variant">
          Vous allez être déconnecté·e. Utilisez le lien ci-dessous pour vous reconnecter.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={AUTH_LOGIN_URL}
            className="inline-flex items-center justify-center rounded-2xl bg-secondary px-5 py-3 text-sm font-semibold text-on-secondary hover:opacity-90 transition-all"
          >
            Se reconnecter
          </a>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-2xl border border-outline-variant px-5 py-3 text-sm font-semibold text-primary hover:bg-surface-container transition-all"
          >
            Aller vers la page de login
          </Link>
        </div>
      </section>
    </div>
  );
}
