import { Clinic } from "@/lib/clinics";
import { QueueLoadDot } from "./SeverityBadge";
import { MapPin, Clock, Users, Car, Footprints, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

interface Props {
  clinic: Clinic;
  recommended?: boolean;
  emergencyHighlight?: boolean;
  onSelect?: (c: Clinic) => void;
  actionLabel?: string;
}

export function ClinicCard({ clinic, recommended, emergencyHighlight, onSelect, actionLabel = "Join Queue" }: Props) {
  return (
    <div
      className={`group relative w-full rounded-2xl border p-4 transition-all ${
        recommended
          ? "border-primary/50 bg-card shadow-[0_0_0_1px_oklch(0.62_0.22_255/0.3),0_0_30px_-8px_oklch(0.55_0.22_285/0.4)]"
          : emergencyHighlight
            ? "border-destructive/50 bg-card shadow-[0_0_0_1px_oklch(0.62_0.25_25/0.4),0_0_30px_-8px_oklch(0.62_0.27_25/0.5)]"
            : "border-border/60 bg-card hover:border-primary/30"
      }`}
      style={
        recommended
          ? {
              backgroundImage:
                "linear-gradient(135deg, oklch(0.62 0.2 252 / 0.08) 0%, oklch(0.55 0.22 290 / 0.04) 100%)",
            }
          : undefined
      }
    >
      {/* Top accent line */}
      {(recommended || emergencyHighlight) && (
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: recommended
              ? "linear-gradient(90deg, transparent, oklch(0.7 0.2 285), transparent)"
              : "linear-gradient(90deg, transparent, oklch(0.7 0.25 22), transparent)",
          }}
        />
      )}

      {recommended && (
        <div className="mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-primary-foreground"
          style={{
            background: "var(--gradient-primary)",
            boxShadow: "0 4px 16px -2px oklch(0.55 0.22 285 / 0.6)",
          }}
        >
          <Sparkles className="h-3 w-3" />
          Recommended
        </div>
      )}
      {emergencyHighlight && !recommended && (
        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-destructive-foreground shadow-[0_4px_16px_-2px_oklch(0.62_0.27_25/0.6)]">
          <AlertCircle className="h-3 w-3" />
          Emergency Capable
        </div>
      )}

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-[15px] font-bold leading-snug tracking-tight text-foreground">{clinic.name}</h3>
          <p className="mt-0.5 flex min-w-0 items-start gap-1 text-[11px] leading-snug text-muted-foreground">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="break-words">{clinic.address}</span>
          </p>
        </div>
        <div className="inline-flex w-fit shrink-0 items-baseline gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 sm:block sm:min-w-[4.75rem] sm:text-right">
          <div className="text-lg font-bold leading-none tracking-tight text-foreground sm:text-xl">{clinic.distanceKm}</div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:mt-0.5">km away</div>
        </div>
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-3 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40">
        <Stat icon={Clock} label="Wait" value={`${clinic.waitMinutes}m`} />
        <Stat icon={Users} label="Queue" value={String(clinic.queueLength)} />
        <Stat icon={Car} label="Drive" value={`${clinic.driveMinutes}m`} />
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <QueueLoadDot load={clinic.queueLoad} />
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Footprints className="h-3 w-3" /> {clinic.walkMinutes}m
          </span>
        </div>
        {onSelect && (
          <button
            onClick={() => onSelect(clinic)}
            className={`group/btn inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] transition-all sm:w-auto ${
              recommended
                ? "btn-glow text-primary-foreground"
                : "border border-border bg-secondary text-foreground hover:border-primary/50 hover:text-primary"
            }`}
          >
            {actionLabel}
            <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center gap-0.5 bg-card px-1 py-2.5 text-center">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <div className="text-sm font-bold text-foreground">{value}</div>
      <div className="max-w-full truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</div>
    </div>
  );
}
s