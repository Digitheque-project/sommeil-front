"use client";

export type DonutChartDatum = {
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  data: DonutChartDatum[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
};

export default function DonutChart({
  data,
  size = 160,
  thickness = 22,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = data.reduce<
    Array<
      DonutChartDatum & {
        fraction: number;
        dash: number;
        gap: number;
        offset: number;
        percent: number;
      }
    >
  >((acc, d) => {
    const cumulativeFraction = acc.reduce((sum, s) => sum + s.fraction, 0);
    const fraction = d.value / total;
    const dash = fraction * circumference;
    return [
      ...acc,
      {
        ...d,
        fraction,
        dash,
        gap: circumference - dash,
        offset: -cumulativeFraction * circumference,
        percent: Math.round(fraction * 100),
      },
    ];
  }, []);

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-outline-variant/50"
            strokeWidth={thickness}
          />
          {segments.map((s) => (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={s.offset}
            >
              <title>{`${s.label}: ${s.percent}%`}</title>
            </circle>
          ))}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            {centerValue && (
              <span className="font-headline-md text-headline-md text-primary">
                {centerValue}
              </span>
            )}
            {centerLabel && (
              <span className="text-label-sm text-on-surface-variant">
                {centerLabel}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-[150px] space-y-2.5">
        {segments.map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-between gap-3 text-body-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-on-surface truncate">{s.label}</span>
            </div>
            <span className="font-data-mono text-on-surface-variant shrink-0">
              {s.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
