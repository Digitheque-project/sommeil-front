import TopBar from '@/components/TopBar';

export default function DeconnexionPage() {
  return (
    <div className="p-6">
      <TopBar title="Déconnexion" />
      <section className="mt-6">
        <h2 className="font-headline-md text-headline-md">Déconnexion</h2>
        <p className="mt-4 text-on-surface-variant">
          Vous allez être déconnecté·e. (Page de simulation)
        </p>
      </section>
    </div>
  );
}
