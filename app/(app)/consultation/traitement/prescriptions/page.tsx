import PrescriptionModuleFrame from "./prescription-module-frame";

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PrescriptionsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<SearchParams> }>) {
  const params = await searchParams;

  return <PrescriptionModuleFrame params={Object.fromEntries(Object.entries(params).flatMap(([key, value]) => {
    const item = first(value);
    return item === undefined ? [] : [[key, item]];
  }))} />;
}
