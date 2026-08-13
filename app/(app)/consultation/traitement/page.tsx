import ConsultationTraitementClient from "./ConsultationTraitementClient";

function getFirstParamValue(value: string | string[] | undefined) {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = await searchParams;
  const patient = getFirstParamValue(params.patient);
  const consultationId = getFirstParamValue(params.id);

  return <ConsultationTraitementClient patient={patient} consultationId={consultationId} />;
}
