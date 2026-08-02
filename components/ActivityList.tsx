"use client";

export default function ActivityList() {
  const items = [
    { title: "Données PSG téléchargées", subtitle: "Patient: Mme. Sophie Martin · ID #4429", time: "Il y a 12 min" },
    { title: "Compte-rendu validé", subtitle: "Par Dr. Leroy · Patient: M. Pierre Adam", time: "Il y a 1 h" },
    { title: "Nouvelle Consultation", subtitle: "Patient: Emma Bernard · Demain à 09:00", time: "Il y a 2 h" },
  ];

  return (
    <ul className="space-y-3">
      {items.map((it, idx) => (
        <li key={idx} className="p-3 rounded-lg border border-outline-variant bg-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium text-body-md">{it.title}</div>
              <div className="text-label-sm text-on-surface-variant">{it.subtitle}</div>
            </div>
            <div className="text-label-sm text-on-surface-variant">{it.time}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
