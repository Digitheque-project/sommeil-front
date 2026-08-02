"use client";

type StatTileProps = {
  title: string;
  value: string;
};

export default function StatTile({ title, value }: StatTileProps) {
  return (
    <div className="bg-surface-container p-4 rounded-lg border border-outline-variant flex flex-col justify-between">
      <div className="text-on-surface-variant text-label-sm">{title}</div>
      <div className="mt-3 text-headline-sm font-semibold text-headline-sm">{value}</div>
    </div>
  );
}
