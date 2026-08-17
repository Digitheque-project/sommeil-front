"use client";

export type BarChartSeries = {
  key: string;
  label: string;
  color: string;
};

export type BarChartDatum = {
  label: string;
  values: Record<string, number>;
};

type BarChartProps = {
  data: BarChartDatum[];
  series: BarChartSeries[];
  height?: number;
  maxValue?: number;
  valueFormatter?: (value: number) => string;
};

export default function BarChart({
  data,
  series,
  height = 220,
  maxValue,
  valueFormatter = (v) => `${v}`,
}: BarChartProps) {
  const computedMax =
    maxValue ??
    Math.max(1, ...data.flatMap((d) => series.map((s) => d.values[s.key] ?? 0)));
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      {series.length > 1 && (
        <div className="flex flex-wrap gap-4 mb-5">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-xs font-bold uppercase tracking-wide text-[#64748B]">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="relative" style={{ height }}>
        {gridLines.map((g) => (
          <div
            key={g}
            className="absolute left-0 right-0 flex items-center gap-2"
            style={{ bottom: `${g * 100}%` }}
          >
            <span className="text-[10px] font-semibold text-[#64748B] w-8 -translate-y-1/2">
              {valueFormatter(Math.round(computedMax * g))}
            </span>
            <div className="flex-1 border-t border-[#E2E8F0]" />
          </div>
        ))}
        <div className="absolute inset-0 pl-10 flex items-end gap-3 sm:gap-5">
          {data.map((d) => (
            <div
              key={d.label}
              className="flex-1 h-full flex items-end justify-center gap-1"
            >
              {series.map((s) => {
                const value = d.values[s.key] ?? 0;
                const barHeight = Math.max(4, (value / computedMax) * height);
                return (
                  <div
                    key={s.key}
                    title={`${s.label} · ${d.label}: ${valueFormatter(value)}`}
                    className="flex-1 max-w-[26px] rounded-t-xl hover:opacity-80 transition-all"
                    style={{ height: barHeight, backgroundColor: s.color }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 sm:gap-5 mt-3 pl-10">
        {data.map((d) => (
          <span
            key={d.label}
            className="flex-1 text-center text-[11px] font-semibold text-[#64748B]"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
