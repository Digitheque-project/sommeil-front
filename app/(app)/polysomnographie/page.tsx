"use client";

import { useEffect, useRef, useState } from "react";
import TopBar from "@/components/TopBar";

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

const waveforms = [
  {
    label: "C3-A2 (Alpha)",
    stroke: "stroke-secondary opacity-80",
    strokeWidth: 1.5,
    path: "M0,25 Q10,10 20,25 T40,25 T60,25 T80,25 T100,25 T120,25 T140,25 T160,25 T180,25 T200,25 T220,25 T240,25 T260,25 T280,25 T300,25 T320,25 T340,25 T360,25 T380,25 T400,25",
  },
  {
    label: "O1-A2 (Beta)",
    stroke: "stroke-primary opacity-60",
    strokeWidth: 1,
    path: "M0,25 L5,15 L10,35 L15,10 L20,40 L25,25 L30,15 L35,35 L40,10 L45,40 L50,25 L55,15 L60,35 L65,10 L70,40 L75,25 L80,15 L85,35 L90,10 L95,40 L100,25",
  },
  {
    label: "F3-A2 (Delta)",
    stroke: "stroke-on-primary-container",
    strokeWidth: 2,
    path: "M0,25 C50,0 150,50 200,25 S350,0 400,25 S550,50 600,25 S750,0 800,25 S950,50 1000,25",
  },
];

const labParams = [
  { label: "Lumière", value: "ÉTEINTE", icon: "dark_mode" },
  { label: "Impédance", value: "OK", icon: "check_circle", ok: true },
  { label: "Position", value: "Supine" },
];

export default function PolysomnographiePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [heartRate, setHeartRate] = useState(72);
  const [spo2, setSpo2] = useState(98);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startSession = () => {
    setIsRunning(true);
    setSeconds(0);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        if (next % 3 === 0) {
          setHeartRate(68 + Math.floor(Math.random() * 8));
          setSpo2(97 + Math.floor(Math.random() * 3));
        }
        return next;
      });
    }, 1000);
  };

  const stopSession = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    window.alert(
      "Examen terminé. Les données ont été sauvegardées dans le dossier patient."
    );
  };

  return (
    <>
      <TopBar
        title="Polysomnographie"
        searchPlaceholder="Rechercher un dossier..."
        doctorName="Dr. Morel"
        doctorRole="Technicien du sommeil"
      />

      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Status Bar */}
        <div className="px-container-padding py-6 border-b border-outline-variant bg-surface-container-lowest flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <span className="text-label-sm text-on-surface-variant uppercase tracking-widest block mb-1">
                Patient en cours
              </span>
              <h1 className="font-headline-md text-headline-md text-primary">
                Jean-Pierre Lambert
              </h1>
            </div>
            <div className="h-10 w-px bg-outline-variant hidden sm:block" />
            <div>
              <span className="text-label-sm text-on-surface-variant uppercase tracking-widest block mb-1">
                État de l&apos;examen
              </span>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                  isRunning
                    ? "bg-green-100 text-green-800 border-green-300"
                    : "bg-surface-container-high text-on-surface border-outline-variant"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRunning ? "bg-green-600 animate-pulse" : "bg-secondary"
                  }`}
                />
                <span className="font-label-md text-label-md">
                  {isRunning
                    ? "Enregistrement en cours"
                    : "Session programmée"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-label-sm text-on-surface-variant uppercase block">
                Durée écoulée
              </span>
              <span className="font-data-mono text-data-mono font-bold text-primary">
                {formatTime(seconds)}
              </span>
            </div>
            <button
              onClick={isRunning ? stopSession : startSession}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-label-md text-label-md shadow-lg hover:shadow-xl active:scale-95 transition-all transform duration-150 ${
                isRunning
                  ? "bg-primary text-on-primary"
                  : "bg-secondary text-on-secondary"
              }`}
            >
              <span className="material-symbols-outlined filled">
                {isRunning ? "check_circle" : "play_arrow"}
              </span>
              <span>
                {isRunning ? "Terminer l'examen" : "Démarrer l'examen"}
              </span>
            </button>
          </div>
        </div>

        {/* Monitoring Workspace */}
        <div className="flex-1 overflow-auto p-gutter bg-background grid grid-cols-12 gap-gutter">
          {/* Left Panel */}
          <div className="col-span-12 lg:col-span-9 space-y-gutter">
            {/* EEG Card */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm flex flex-col h-[400px]">
              <div className="p-4 border-b border-outline-variant flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">
                    psychology
                  </span>
                  <span className="font-headline-sm text-headline-sm text-primary">
                    Monitorage EEG (Ondes Cérébrales)
                  </span>
                </div>
                <div className="flex gap-4">
                  <span className="text-label-sm text-on-surface-variant">
                    Vitesse: 30mm/s
                  </span>
                  <span className="text-label-sm text-on-surface-variant">
                    Sensibilité: 7µV/mm
                  </span>
                </div>
              </div>
              <div className="flex-1 relative monitor-glow signal-grid overflow-hidden">
                <div className="absolute inset-0 flex flex-col justify-around py-4">
                  {waveforms.map((wave) => (
                    <div key={wave.label} className="relative h-12 w-full px-4">
                      <span className="absolute left-4 top-0 text-[10px] font-bold text-on-surface-variant uppercase bg-surface-container-lowest px-1 z-10">
                        {wave.label}
                      </span>
                      <svg
                        className={`w-full h-full ${wave.stroke}`}
                        preserveAspectRatio="none"
                      >
                        <path
                          className="scrolling-waveform"
                          d={wave.path}
                          fill="none"
                          strokeWidth={wave.strokeWidth}
                        />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lower Monitoring Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm h-48 flex flex-col">
                <div className="p-3 border-b border-outline-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-sm">
                    visibility
                  </span>
                  <span className="font-label-md text-label-md text-primary">
                    EOG (Mouvements Oculaires)
                  </span>
                </div>
                <div className="flex-1 relative signal-grid flex items-center">
                  <svg
                    className="w-full h-16 stroke-secondary opacity-70"
                    preserveAspectRatio="none"
                  >
                    <path
                      className="scrolling-waveform"
                      d="M0,32 L50,32 L60,10 L70,54 L80,32 L200,32 L210,10 L220,54 L230,32 L400,32 L410,10 L420,54 L430,32 L600,32"
                      fill="none"
                      strokeWidth={1.5}
                    />
                  </svg>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm h-48 flex flex-col">
                <div className="p-3 border-b border-outline-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-sm">
                    air
                  </span>
                  <span className="font-label-md text-label-md text-primary">
                    Flux Respiratoire Nasal
                  </span>
                </div>
                <div className="flex-1 relative signal-grid flex items-center">
                  <svg
                    className="w-full h-16 stroke-primary opacity-70"
                    preserveAspectRatio="none"
                  >
                    <path
                      className="scrolling-waveform"
                      d="M0,32 Q50,0 100,32 T200,32 T300,32 T400,32 T500,32 T600,32"
                      fill="none"
                      strokeWidth={2}
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Vitals & Parameters */}
          <div className="col-span-12 lg:col-span-3 space-y-gutter">
            <div className="bg-primary text-on-primary rounded-xl p-6 shadow-md relative overflow-hidden h-40 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="font-label-md text-label-md opacity-80 uppercase">
                  Fréquence Cardiaque
                </span>
                <span className="material-symbols-outlined filled text-error animate-pulse-red">
                  favorite
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display-lg text-display-lg leading-none">
                  {heartRate}
                </span>
                <span className="font-label-md text-label-md opacity-80">
                  BPM
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-12">
                <svg
                  className="w-full h-full stroke-on-primary opacity-30"
                  preserveAspectRatio="none"
                >
                  <path
                    className="scrolling-waveform"
                    d="M0,40 L20,40 L25,10 L30,60 L35,40 L70,40 L75,10 L80,60 L85,40 L120,40 L125,10 L130,60 L135,40 L170,40"
                    fill="none"
                    strokeWidth={2}
                  />
                </svg>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm h-40 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase">
                  Saturation O₂
                </span>
                <span className="material-symbols-outlined filled text-secondary">
                  water_drop
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display-lg text-display-lg text-primary leading-none">
                  {spo2}
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  %
                </span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className="bg-secondary h-full"
                  style={{ width: `${spo2}%` }}
                />
              </div>
            </div>

            <div className="bg-surface-container-high rounded-xl p-gutter space-y-4">
              <h3 className="font-label-md text-label-md text-primary border-b border-outline-variant pb-2">
                Paramètres Labo
              </h3>
              {labParams.map((param) => (
                <div
                  key={param.label}
                  className="flex justify-between items-center"
                >
                  <span className="text-body-sm text-on-surface-variant">
                    {param.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-label-sm font-bold flex items-center gap-1 ${
                        param.ok ? "text-green-600" : "text-on-surface"
                      }`}
                    >
                      {param.value}
                    </span>
                    {param.icon && (
                      <span
                        className={`material-symbols-outlined text-lg ${
                          param.ok ? "text-green-600" : "text-on-surface-variant"
                        }`}
                      >
                        {param.icon}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div className="pt-4">
                <button className="w-full py-2 border border-secondary text-secondary rounded-lg font-label-md text-label-md hover:bg-secondary hover:text-on-secondary transition-colors">
                  Journal des événements
                </button>
              </div>
            </div>

            {/* Video Feed Placeholder */}
            <div className="relative rounded-xl overflow-hidden aspect-video border border-outline-variant group bg-surface-container-high">
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-4xl opacity-50">
                  videocam_off
                </span>
              </div>
              {isRunning && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-error rounded text-[10px] text-white font-bold animate-pulse">
                  REC
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
