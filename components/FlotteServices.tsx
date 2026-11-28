'use client';

/**
 * Numéros de flotte (28/11/2026) : téléphones fixes attribués à chaque service
 * du CHU. Gérés dans l'admin ; ici, consultation seule. Composant autonome,
 * identique dans tous les modules (placé dans ActionsCompte, menu latéral).
 */
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

type Telephone = { numero: string; libelle?: string };
type ServiceFlotte = { id: string; name: string; isActive?: boolean; telephones?: Telephone[] | null };

function lireJeton(): { jeton: string; chuId: string } | null {
  const vus: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) vus.push(localStorage.getItem(localStorage.key(i) || '') || '');
  } catch { /* stockage indisponible */ }
  try {
    for (let i = 0; i < sessionStorage.length; i++) vus.push(sessionStorage.getItem(sessionStorage.key(i) || '') || '');
  } catch { /* stockage indisponible */ }
  try {
    document.cookie.split(';').forEach((c) => vus.push(decodeURIComponent(c.split('=').slice(1).join('='))));
  } catch { /* cookies indisponibles */ }
  for (const v of vus) {
    const m = String(v).match(/eyJ[\w-]+\.[\w-]+\.[\w-]+/);
    if (!m) continue;
    try {
      const b = m[0].split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const p = JSON.parse(decodeURIComponent(escape(atob(b + '==='.slice((b.length + 3) % 4)))));
      const chuId = p?.services?.[0]?.chu?.id ?? p?.chuId;
      if (chuId) return { jeton: m[0], chuId: String(chuId) };
    } catch { /* jeton illisible */ }
  }
  return null;
}

async function chargerServices(): Promise<ServiceFlotte[]> {
  const passerelle = (process.env.NEXT_PUBLIC_GATEWAY_URL || '').replace(/\/+$/, '');
  const j = lireJeton();
  if (j && passerelle) {
    const r = await fetch(`${passerelle}/services?chuId=${encodeURIComponent(j.chuId)}`, {
      headers: { Authorization: `Bearer ${j.jeton}` },
    });
    if (r.ok) return r.json();
  }
  // Jeton en cookie httpOnly (Anapath) : relais du module et CHU de la session.
  const s = await fetch('/api/session', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const chuId = s?.chu?.id;
  if (!chuId) return [];
  const r = await fetch(`/api/passerelle/services?chuId=${encodeURIComponent(chuId)}`, { cache: 'no-store' });
  return r.ok ? r.json() : [];
}

export function FlotteServices({
  className,
  classeLibelle,
  icones = false,
}: {
  className?: string;
  classeLibelle?: string;
  icones?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [services, setServices] = useState<ServiceFlotte[] | null>(null);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    if (!ouvert || services) return;
    chargerServices()
      .then((l) => setServices(Array.isArray(l) ? l : []))
      .catch(() => setErreur('Les numéros de flotte ne sont pas disponibles pour le moment.'));
  }, [ouvert, services]);

  useEffect(() => {
    if (!ouvert) return;
    const f = (e: KeyboardEvent) => e.key === 'Escape' && setOuvert(false);
    document.addEventListener('keydown', f);
    return () => document.removeEventListener('keydown', f);
  }, [ouvert]);

  const liste = useMemo(
    () =>
      (services ?? [])
        .filter((s) => s.isActive !== false && (s.telephones ?? []).length > 0)
        .filter((s) => {
          const q = recherche.trim().toLowerCase();
          if (!q) return true;
          return s.name.toLowerCase().includes(q) || (s.telephones ?? []).some((t) => `${t.numero} ${t.libelle ?? ''}`.toLowerCase().includes(q));
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [services, recherche],
  );

  return (
    <>
      <button type="button" className={className} title="Numéros de flotte des services" onClick={() => setOuvert(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        {!icones && <span className={classeLibelle}>Numéros de flotte</span>}
      </button>
      {ouvert &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.target === e.currentTarget && setOuvert(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 2147482000, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <div style={{ width: 'min(720px, 100%)', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,.25)', fontFamily: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #E2E8F0' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>Numéros de flotte</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>Téléphones fixes des services (consultation seule)</p>
                </div>
                <button type="button" onClick={() => setOuvert(false)} aria-label="Fermer" style={{ border: 0, background: 'transparent', fontSize: 22, cursor: 'pointer', color: '#64748B' }}>×</button>
              </div>
              <div style={{ padding: '12px 18px' }}>
                <input
                  autoFocus
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher un service ou un numéro…"
                  style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E2E8F0', borderRadius: 10, padding: '9px 12px', fontSize: 14 }}
                />
              </div>
              <div style={{ overflowY: 'auto', padding: '0 18px 18px' }}>
                {erreur ? (
                  <p style={{ color: '#B91C1C', fontSize: 14 }}>{erreur}</p>
                ) : services === null ? (
                  <p style={{ color: '#64748B', fontSize: 14 }}>Chargement…</p>
                ) : liste.length === 0 ? (
                  <p style={{ color: '#64748B', fontSize: 14 }}>Aucun numéro de flotte {recherche ? 'ne correspond à la recherche' : "n'est encore enregistré"}.</p>
                ) : (
                  liste.map((s) => (
                    <div key={s.id} style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: '10px 12px', marginBottom: 8 }}>
                      <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{s.name}</p>
                      {(s.telephones ?? []).map((t, i) => (
                        <a
                          key={`${t.numero}-${i}`}
                          href={`tel:${t.numero.replace(/\s+/g, '')}`}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 8, background: '#F8FAFC', marginTop: 4, textDecoration: 'none' }}
                        >
                          <span style={{ fontWeight: 700, fontSize: 14, color: '#006A8C' }}>{t.numero}</span>
                          {t.libelle ? <span style={{ fontSize: 13, color: '#475569' }}>{t.libelle}</span> : null}
                        </a>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
