"use client";
import { useState } from 'react';

export type Section =
  | 'med' | 'nm' | 'surv' | 'trans' | 'soins-inf'
  | 'labo' | 'imag' | 'eeg' | 'ecg' | 'poly' | 'orl' | 'kine' | 'endo' | 'dial' | 'ana'
  | 'bloc' | 'cpa' | 'para' | 'hist' | 'actes-orl';

interface ConsultationLayoutProps {
  patient?: {
    nom?: string; prenom?: string;
    dateNaissance?: string;
    idPermanent?: string;
    allergies?: string[];
    sexe?: string;
    categorie?: string;
    groupeSanguin?: string;
    chambre?: string;
    lit?: string;
    service?: string;
    typeHospital?: string;
  };
  prescripteur?: { id?: string; nom?: string; prenoms?: string; poste?: string; service?: string };
  onChangePatient?: () => void;
  children: (activeSection: Section, setSection?: (section: Section) => void) => React.ReactNode;
}

export default function ConsultationLayout({ patient, prescripteur, onChangePatient, children }: ConsultationLayoutProps) {
  const [activeSection, setActiveSection] = useState<Section>('med');
  const [activeParaSection, setActiveParaSection] = useState<Section>('labo');

  const mainItems = [
    {id:'med',  icon:'medication',       label:'Médicamenteuse'},
    {id:'nm',   icon:'self_care',        label:'Non Médicamenteuse'},
    {id:'soins-inf', icon:'health_and_safety', label:'Soins infirmier'},
    {id:'surv', icon:'monitor_heart',    label:'Surveillance'},
    {id:'actes-orl', icon:'hearing',     label:'Actes ORL'},
    {id:'trans',icon:'bloodtype',        label:'Transfusion sanguine'},
    {id:'para', icon:'biotech',          label:'Paraclinique'},
    {id:'bloc', icon:'medical_services', label:'Intervention'},
    {id:'cpa',  icon:'local_hospital',   label:'CPA'},
    {id:'hist', icon:'history',          label:'Historique'},
  ];

  const paraItems = [
    {id:'labo', icon:'science',    label:'Laboratoire'},
    {id:'imag', icon:'radiology',  label:'Imagerie'},
    {id:'ana',  icon:'biotech',    label:'Anatomie Pathologique'},
    {id:'endo', icon:'visibility', label:'Endoscopie'},
    {id:'dial', icon:'water_full', label:'Dialyse'},
    {id:'eeg',  icon:'neurology',  label:'EEG'},
    {id:'ecg',  icon:'favorite',   label:'ECG'},
    {id:'poly', icon:'bedtime',    label:'Polysomnographie'},
    {id:'orl',  icon:'hearing',    label:'ORL'},
    {id:'kine', icon:'exercise',   label:'Kinésithérapie'},
  ];

  const currentSection = activeSection === 'para' ? activeParaSection : activeSection;
  const initiale = prescripteur?.nom?.[0]?.toUpperCase() || 'N';
  const age = patient?.dateNaissance ? new Date().getFullYear() - new Date(patient.dateNaissance).getFullYear() : null;
  const sexeLabel = patient?.sexe === 'M' ? 'Masculin' : patient?.sexe === 'F' ? 'Féminin' : patient?.sexe;
  const chambreLabel = [patient?.chambre, patient?.lit].filter(Boolean).join(' — ');

  return (
    <div style={{display:'flex', flexDirection:'column', flex:1, overflow:'hidden'}}>

      {/* HEADER */}
      <div style={{
        background:'linear-gradient(135deg, #0066CC 0%, #004C99 100%)',
        flexShrink:0, padding:'0 16px',
        boxShadow:'0 2px 8px rgba(0,0,0,.12)',
      }}>
        <div style={{maxWidth:'clamp(900px, 92vw, 1280px)', margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:56}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <button style={{
              background:'rgba(255,255,255,.12)', border:'none', cursor:'pointer',
              display:'flex', alignItems:'center', padding:0,
              width:34, height:34, borderRadius:8, justifyContent:'center',
              transition:'all .15s',
            }} onClick={() => window.history.back()}
              onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,.25)')}
              onMouseLeave={e => (e.currentTarget.style.background='rgba(255,255,255,.12)')}
            >
              <span className="ms" style={{fontSize:20, color:'#fff'}}>arrow_back_ios</span>
            </button>
            <div style={{display:'flex', flexDirection:'column'}}>
              <span style={{color:'#fff', fontSize:16, fontWeight:700, fontFamily:'"Manrope",sans-serif', letterSpacing:'.3px'}}>
                Consultation
              </span>
              {prescripteur && (
                <span style={{color:'rgba(255,255,255,.65)', fontSize:11, fontWeight:500}}>
                  Dr {prescripteur.nom} — {prescripteur.poste}
                </span>
              )}
            </div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:6}}>
            {onChangePatient && (
              <button
                onClick={onChangePatient}
                style={{
                  border:'1px solid rgba(255,255,255,.25)',
                  background:'rgba(255,255,255,.1)',
                  color:'#fff',
                  borderRadius:8,
                  padding:'6px 12px',
                  fontSize:12,
                  fontWeight:500,
                  cursor:'pointer',
                  transition:'all .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,.2)')}
                onMouseLeave={e => (e.currentTarget.style.background='rgba(255,255,255,.1)')}
              >
                Changer patient
              </button>
            )}
            <div style={{
              width:34, height:34, borderRadius:'50%',
              background:'rgba(255,255,255,.15)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', fontSize:14, fontWeight:700,
              border:'1.5px solid rgba(255,255,255,.3)',
            }}>
              {initiale}
            </div>
          </div>
        </div>
      </div>

      {/* PATIENT BANNER */}
      {patient && (
        <div style={{
          background:'#fff', borderBottom:'1px solid #e5e7eb',
          padding:'8px 16px', flexShrink:0,
        }}>
          <div style={{maxWidth:'clamp(900px, 92vw, 1280px)', margin:'0 auto', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap'}}>

            {/* ID + Nom */}
            <div style={{display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0}}>
              <div style={{
                background:'#005b82', color:'#fff', borderRadius:6,
                padding:'3px 10px', fontSize:11, fontWeight:700, flexShrink:0,
                fontFamily:'"Manrope",sans-serif', letterSpacing:'.3px',
              }}>
                {patient.idPermanent}
              </div>
              <div>
                <div style={{fontWeight:700, fontSize:14, color:'#1f2937'}}>
                  {patient.sexe === 'M' ? 'M.' : patient.sexe === 'F' ? 'Mme' : ''} {patient.nom} {patient.prenom}
                </div>
                <div style={{display:'flex', alignItems:'center', gap:6, marginTop:2, flexWrap:'wrap'}}>
                  {patient.groupeSanguin && (
                    <span style={{
                      fontSize:11, fontWeight:600,
                      padding:'1px 6px', borderRadius:4,
                      background:'#fef2f2', color:'#dc2626',
                    }}>
                      {patient.groupeSanguin}
                    </span>
                  )}
                  {(age || sexeLabel) && (
                    <span style={{fontSize:11, color:'#6b7280'}}>
                      {[age ? `${age} ans` : null, sexeLabel].filter(Boolean).join(' / ')}
                    </span>
                  )}
                  {patient?.service && (
                    <span style={{fontSize:11, color:'#6b7280'}}>
                      {patient.service}
                    </span>
                  )}
                  {chambreLabel && (
                    <span style={{fontSize:11, color:'#6b7280'}}>
                      {patient.typeHospital && `${patient.typeHospital} — `}{chambreLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Catégorie */}
            {patient.categorie && (
              <div style={{
                background:'#f0fdf4', color:'#166534',
                borderRadius:6, padding:'3px 10px',
                fontSize:11, fontWeight:700, flexShrink:0,
                border:'1px solid rgba(22,101,52,.15)',
              }}>
                {patient.categorie}
              </div>
            )}

            {/* Allergies */}
            {patient.allergies && patient.allergies.length > 0 && (
              <div style={{
                background:'#fef3c7', border:'1px solid #fbbf24',
                borderRadius:6, padding:'3px 10px',
                fontSize:11, fontWeight:600, color:'#92400e',
                display:'flex', alignItems:'center', gap:4, flexShrink:0,
              }}>
                <span className="ms" style={{fontSize:14}}>warning</span>
                Allergies : {patient.allergies.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN NAVIGATION */}
      <div style={{background:'#ffffff', borderBottom:'1px solid #e5e7eb', flexShrink:0}}>
        <div style={{maxWidth:'clamp(900px, 92vw, 1280px)', margin:'0 auto', display:'flex', overflowX:'auto', gap:0, justifyContent:'center'}}>
          {mainItems.map(item => {
            const isActive = activeSection === item.id;
            return (
              <button key={item.id}
                onClick={() => setActiveSection(item.id as Section)}
                style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                  padding:'10px 14px', border:'none', background:'none', cursor:'pointer',
                  borderBottom: isActive ? '3px solid #005b82' : '3px solid transparent',
                  color: isActive ? '#005b82' : '#6b7280',
                    fontWeight: isActive ? 700 : 500, fontSize:13,
                  whiteSpace:'nowrap', transition:'all .15s', flexShrink:0,
                }}>
                <span className="ms" style={{fontSize:20}}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* PARA-CLINIQUE SUB-NAVIGATION */}
      {activeSection === 'para' && (
        <div style={{background:'#f0fdf4', borderBottom:'1px solid rgba(22,101,52,.12)', flexShrink:0}}>
          <div style={{maxWidth:'clamp(900px, 92vw, 1280px)', margin:'0 auto', display:'flex', overflowX:'auto', gap:0, justifyContent:'center'}}>
            {paraItems.map(item => {
              const isActive = activeParaSection === item.id;
              return (
                <button key={item.id}
                  onClick={() => setActiveParaSection(item.id as Section)}
                  style={{
                    display:'flex', alignItems:'center', gap:5,
                    padding:'8px 12px', border:'none', background:'none', cursor:'pointer',
                    borderBottom: isActive ? '2px solid #166534' : '2px solid transparent',
                    color: isActive ? '#166534' : '#6b7280',
                    fontWeight: isActive ? 700 : 500, fontSize:13,
                      whiteSpace:'nowrap', transition:'all .15s', flexShrink:0,
                  }}>
                  <span className="ms" style={{fontSize:16}}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div id="consultation-scroll-container" style={{flex:1, overflowY:'auto'}}>
        <div style={{maxWidth:'clamp(900px, 92vw, 1280px)', margin:'0 auto', padding:'16px'}}>
          {children(currentSection, setActiveSection)}
        </div>
      </div>

    </div>
  );
}
