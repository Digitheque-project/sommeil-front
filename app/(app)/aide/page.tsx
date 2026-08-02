import TopBar from '@/components/TopBar';

export default function AidePage() {
  return (
    <div className="p-6">
      <TopBar title="Aide" />
      <section className="mt-6">
        <h2 className="font-headline-md text-headline-md">Aide</h2>
        <p className="mt-4 text-on-surface-variant">
          Ici se trouvera la documentation d'aide et les FAQs de l'application.
        </p>
      </section>
    </div>
  );
}
