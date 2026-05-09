import type { Severity } from "@/lib/clinics";

const map: Record<Severity, { label: string; cls: string; glow: string }> = {
  low: {
    label: "Low",
    cls: "bg-success/15 text-success border-success/40",
    glow: "shadow-[0_0_16px_oklch(0.7_0.18_155/0.35)]",
  },
  medium: {
    label: "Moderate",
    cls: "bg-warning/15 text-warning border-warning/40",
    glow: "shadow-[0_0_16px_oklch(0.78_0.17_75/0.35)]",
  },
  high: {
    label: "Critical",
    cls: "bg-destructive/15 text-destructive border-destructive/40",
    glow: "shadow-[0_0_18px_oklch(0.62_0.25_25/0.5)]",
  },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const m = map[severity];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${m.cls} ${m.glow}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]" />
      {m.label}
    </span>
  );
}

export function QueueLoadDot({ load }: { load: "Low" | "Medium" | "High" }) {
  const cls =
    load === "Low"
      ? "bg-success shadow-[0_0_8px_oklch(0.7_0.18_155/0.7)]"
      : load === "Medium"
        ? "bg-warning shadow-[0_0_8px_oklch(0.78_0.17_75/0.7)]"
        : "bg-destructive shadow-[0_0_8px_oklch(0.62_0.25_25/0.7)]";
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${cls}`} />
      {load} load
    </span>
  );
}
