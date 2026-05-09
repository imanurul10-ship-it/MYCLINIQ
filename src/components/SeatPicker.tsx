import { useMemo, useState } from "react";
import type { SeatAssignment, Zone } from "@/lib/store";
import { Compass, Check, Armchair, Star } from "lucide-react";

interface Props {
  onConfirm: (seat: SeatAssignment) => void;
  takenSeats?: string[];
  /** When provided, optionally show a date/time picker (for booking flow) */
  withBooking?: boolean;
  /** Optional special-requirement step before final confirm */
  onRequirementsChange?: (reqs: string[]) => void;
}

const ZONES: { id: Zone; name: string; direction: string; floor: string; accent: string }[] = [
  { id: "A", name: "Zone A", direction: "West Wing · General", floor: "Level 2", accent: "oklch(0.62 0.22 255 / 0.18)" },
  { id: "B", name: "Zone B", direction: "East Wing · Family", floor: "Level 1", accent: "oklch(0.7 0.18 155 / 0.18)" },
  { id: "C", name: "Zone C", direction: "South Atrium · Pediatrics", floor: "Level 1", accent: "oklch(0.78 0.17 75 / 0.18)" },
  { id: "D", name: "Zone D", direction: "North Wing · Quiet", floor: "Level 3", accent: "oklch(0.55 0.22 290 / 0.18)" },
];

const REQUIREMENTS = [
  { id: "wheelchair", label: "Wheelchair access" },
  { id: "visual", label: "Visual impairment" },
  { id: "infant", label: "With infant" },
  { id: "senior", label: "Senior / Elderly" },
  { id: "hearing", label: "Hearing impairment" },
  { id: "interpreter", label: "Language interpreter" },
];

// Seats 1-4 in each zone are flagged as priority seats (extra space, near reception).
const PRIORITY_SEATS = new Set([1, 2, 3, 4]);

export function SeatPicker({ onConfirm, takenSeats = [], onRequirementsChange }: Props) {
  const [zone, setZone] = useState<Zone>("A");
  const [seat, setSeat] = useState<string | null>(null);
  const [showReqs, setShowReqs] = useState(false);
  const [reqs, setReqs] = useState<string[]>([]);
  const taken = useMemo(() => new Set(takenSeats), [takenSeats]);
  const current = ZONES.find((z) => z.id === zone)!;

  const seats = useMemo(() => {
    const out: { id: string; num: number; taken: boolean; priority: boolean }[] = [];
    for (let i = 1; i <= 16; i++) {
      const id = `${zone}-${String(i).padStart(2, "0")}`;
      const isTaken =
        taken.has(id) || ((zone.charCodeAt(0) * 7 + i * 13) % 5 === 0 && i !== 12);
      out.push({ id, num: i, taken: isTaken, priority: PRIORITY_SEATS.has(i) });
    }
    return out;
  }, [zone, taken]);

  const toggleReq = (id: string) => {
    setReqs((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      onRequirementsChange?.(next);
      return next;
    });
  };

  const handleConfirm = () => {
    if (!seat) return;
    onConfirm({ zone, seat, direction: current.direction, floor: current.floor });
  };

  return (
    <div className="space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Choose zone</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {ZONES.map((z) => {
            const active = z.id === zone;
            return (
              <button
                key={z.id}
                onClick={() => { setZone(z.id); setSeat(null); }}
                className={`relative overflow-hidden rounded-2xl border p-3 text-left transition-all ${
                  active
                    ? "border-primary/60 shadow-[0_0_0_1px_oklch(0.62_0.22_255/0.4),0_0_24px_-8px_oklch(0.55_0.22_285/0.5)]"
                    : "border-border bg-card hover:border-primary/30"
                }`}
                style={{ background: active ? `linear-gradient(135deg, ${z.accent}, var(--card))` : undefined }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{z.floor}</span>
                  {active && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-bold text-foreground">{z.name}</p>
                <p className="text-[10px] leading-tight text-muted-foreground">{z.direction}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="flex items-center gap-3 rounded-2xl border border-primary/30 p-3"
        style={{ background: "linear-gradient(135deg, oklch(0.62 0.2 252 / 0.08), oklch(0.55 0.22 290 / 0.04))" }}
      >
        <div className="btn-glow flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground">
          <Compass className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Direction</p>
          <p className="text-xs font-bold text-foreground">{current.floor} → {current.direction}</p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Pick a seat</p>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <Legend swatch="border border-border bg-card" label="Free" />
            <Legend swatch="bg-warning" label="Priority" />
            <Legend swatch="bg-primary" label="You" />
            <Legend swatch="bg-muted" label="Taken" />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex justify-center">
            <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              ↑ Reception
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {seats.map((s) => {
              const isSelected = seat === s.id;
              return (
                <button
                  key={s.id}
                  disabled={s.taken}
                  onClick={() => setSeat(s.id)}
                  className={`relative aspect-square rounded-lg text-[10px] font-bold transition-all ${
                    s.taken
                      ? "cursor-not-allowed bg-muted text-muted-foreground/40"
                      : isSelected
                        ? "btn-glow text-primary-foreground"
                        : s.priority
                          ? "border border-warning/60 bg-warning/10 text-foreground hover:border-warning"
                          : "border border-border bg-card text-foreground hover:border-primary/50"
                  }`}
                  title={s.priority ? "Priority seat — extra space, near reception" : undefined}
                >
                  {s.priority && !s.taken && !isSelected && (
                    <Star className="absolute right-0.5 top-0.5 h-2.5 w-2.5 text-warning" fill="currentColor" />
                  )}
                  <Armchair className="mx-auto h-3.5 w-3.5" strokeWidth={2.2} />
                  <span className="mt-0.5 block">{s.id.split("-")[1]}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            <Star className="mr-1 inline h-2.5 w-2.5 text-warning" fill="currentColor" />
            Priority seats reserved for elderly, pregnant, disabled & guardians with infants.
          </p>
        </div>
      </div>

      {/* Optional special requirements (collapsible, before confirm) */}
      <div className="rounded-2xl border border-border bg-card p-3">
        <button
          type="button"
          onClick={() => setShowReqs((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Optional</p>
            <p className="text-xs font-bold text-foreground">Special requirements {reqs.length > 0 && <span className="text-accent">· {reqs.length} selected</span>}</p>
          </div>
          <span className="text-xs text-muted-foreground">{showReqs ? "Hide" : "Add"}</span>
        </button>
        {showReqs && (
          <div className="mt-3 flex flex-wrap gap-2">
            {REQUIREMENTS.map((r) => {
              const active = reqs.includes(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => toggleReq(r.id)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                    active ? "border-primary/70 bg-primary/15 text-primary" : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        disabled={!seat}
        onClick={handleConfirm}
        className="btn-glow flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-primary-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
      >
        {seat ? `Confirm seat ${seat}` : "Select a seat"}
      </button>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2 w-2 rounded-sm ${swatch}`} />
      {label}
    </span>
  );
}
