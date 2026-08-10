import ConsultationTraitementClient from "./ConsultationTraitementClient";

const fakeConsultation = {
  patientName: "MARCEL, Sophie",
  status: "EN COURS",
  visitType: "INITIALE",
  motif: "Apnée suspectée / fatigue diurne",
  diagnosis: "AOS légère à modérée, suspicion de troubles respiratoires nocturnes",
  doctor: "Dr. Jean Dupont",
};

function getFirstParamValue(value: string | string[] | undefined) {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

export default function Page({
  searchParams,
}: Readonly<{
  searchParams: Record<string, string | string[] | undefined>;
}>) {
  const patient = getFirstParamValue(searchParams.patient) ?? fakeConsultation.patientName;
  const consultationId = getFirstParamValue(searchParams.id) ?? "29481";

  return <ConsultationTraitementClient patient={patient} consultationId={consultationId} />;
}
