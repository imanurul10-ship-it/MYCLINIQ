import { useEffect, useRef } from "react";
import { Activity, AlertTriangle, AlertOctagon, MinusCircle, Heart, Zap } from "lucide-react";

const LABELS = [
  "No pain",
  "Very mild",
  "Mild",
  "Uncomfortable",
  "Distracting",
  "Distressing",
  "Intense",
  "Severe",
  "Very severe",
  "Excruciating",
  "Worst possible",
];

// Professional clinical icons (no emojis)
const ICON_FOR = (v: number) => {
  if (v === 0) return Heart;
  if (v <= 2) return MinusCircle;
  if (v <= 4) return Activity;
  if (v <= 6) return AlertTriangle;
  if (v <= 8) return AlertOctagon;
  return Zap;
};

const COLOR_FOR = (v: number) => {
  if (v <= 5) {
    const t = v / 5;
    return `oklch(${0.78 - 0.05 * t} ${0.13 + 0.04 * t} ${190 - 105 * t})`;
  }
  const t = (v - 5) / 5;
  return `oklch(${0.78 - 0.18 * t} ${0.17 + 0.08 * t} ${85 - 60 * t})`;
};

export function PainSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const color = COLOR_FOR(value);
  const Icon = ICON_FOR(value);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty("--pain-color", color);
      ref.current.style.setProperty("--pain-pct", `${(value / 10) * 100}%`);
    }
  }, [value, color]);

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Pain intensity</p>
          <p className="mt-0.5 text-sm font-bold">Numeric Rating Scale · 0 – 10</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl border"
            style={{ borderColor: color, color, boxShadow: `0 0 12px ${color}` }}
            aria-hidden
          >
            <Icon className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span
            className="rounded-lg px-3 py-1 font-mono text-lg font-bold tabular-nums"
            style={{ color, border: `1px solid ${color}` }}
          >
            {value}
          </span>
        </div>
      </div>

      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color }}>
        {LABELS[value]}
      </p>

      <input
        ref={ref}
        aria-label="Pain level"
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="pain-range mt-3 w-full"
      />

      <div className="mt-1 flex justify-between text-[9px] font-semibold text-muted-foreground">
        {Array.from({ length: 11 }).map((_, i) => (
          <span key={i} className={i === value ? "text-foreground" : ""}>{i}</span>
        ))}
      </div>
    </div>
  );
}
