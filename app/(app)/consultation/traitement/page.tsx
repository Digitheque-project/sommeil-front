import ConsultationTraitementClient from "./ConsultationTraitementClient";

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
  const patient = getFirstParamValue(searchParams.patient);
  const consultationId = getFirstParamValue(searchParams.id);

  return <ConsultationTraitementClient patient={patient} consultationId={consultationId} />;
}
