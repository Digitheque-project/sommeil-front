import { NextResponse } from 'next/server';

export async function GET() {
  const data = {
    stats: [
      { title: "Examens Aujourd'hui", value: '14' },
      { title: 'Comptes-rendus en attente', value: '08' },
      { title: 'Prochain RDV', value: '14:30' },
      { title: 'Occupation Lits', value: '92%' },
    ],
    activity: [
      { title: 'Données PSG téléchargées', subtitle: 'Patient: Mme. Sophie Martin · ID #4429', time: 'Il y a 12 min' },
      { title: 'Compte-rendu validé', subtitle: 'Par Dr. Leroy · Patient: M. Pierre Adam', time: 'Il y a 1 h' },
      { title: 'Nouvelle Consultation', subtitle: 'Patient: Emma Bernard · Demain à 09:00', time: 'Il y a 2 h' },
    ]
  };

  return NextResponse.json(data);
}
