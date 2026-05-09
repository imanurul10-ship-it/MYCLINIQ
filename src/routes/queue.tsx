import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { QRTicket } from "@/components/QRTicket";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useCertificates, buildCertificateFromVisit } from "@/lib/certificates";
import { useEffect, useState } from "react";
import {
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  MapPin,
  QrCode,
  Armchair,
  Compass,
  Activity,
  FileCheck2,
} from "lucide-react";
import { SeatPicker } from "@/components/SeatPicker";

export const Route = createFileRoute("/queue")({
  component: Queue,
  head: () => ({ meta: [{ title: "Queue · MediQ" }] }),
});

function Queue() {
  const queue = useApp((s) => s.queue);
  const decrement = useApp((s) => s.decrementQueue);
  const checkIn = useApp((s) => s.checkIn);
  const delay = useApp((s) => s.delayQueue);
  const assignSeat = useApp((s) => s.assignSeat);
  const symptoms = useApp((s) => s.symptoms);
  const result = useApp((s) => s.result);
  const answers = useApp((s) => s.answers);
  const { profile } = useAuth();
  const addCert = useCertificates((s) => s.add);
  const navigate = useNavigate({ from: "/queue" });
  const [tick, setTick] = useState(0);
  const [showSeatPicker, setShowSeatPicker] = useState(false);
  const [autoIssuedMcId, setAutoIssuedMcId] = useState<string | null>(null);

  const consultationDone = !!queue && queue.checkedIn && queue.patientsAhead === 0;

  // Auto-issue an MC the moment consultation completes, so EVERY visit is stored.
  useEffect(() => {
    if (!consultationDone || !result || autoIssuedMcId) return;
    const mc = buildCertificateFromVisit({
      result,
      symptoms,
      worsening: answers.symptomTrend === "worsening",
      clinic: queue?.clinic ?? null,
      profile,
    });
    addCert(mc);
    setAutoIssuedMcId(mc.id);
  }, [consultationDone, result, autoIssuedMcId, symptoms, answers.symptomTrend, queue, profile, addCert]);

  const handleViewCertificate = () => {
    if (autoIssuedMcId) navigate({ to: "/certificates", search: { id: autoIssuedMcId } });
  };

  useEffect(() => {
    if (!queue) return;
    const id = setInterval(() => {
      decrement();
      setTick((t) => t + 1);
    }, 4000);
    return () => clearInterval(id);
  }, [queue, decrement]);

  if (!queue) {
    return (
      <AppShell>
        <header className="px-5 pb-5 pt-10" style={{ background: "var(--gradient-hero)" }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Queue</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">No active queue</h1>
        </header>
        <main className="px-5 py-12 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-[var(--shadow-card)]">
            <Users className="h-9 w-9" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Start a visit to join a clinic queue.</p>
          <Link
            to="/visit"
            className="btn-glow mt-5 inline-flex rounded-xl px-5 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground"
          >
            Start a Visit
          </Link>
        </main>
      </AppShell>
    );
  }

  const completion = new Date(Date.now() + queue.estimatedMinutes * 60_000);
  const completionStr = completion.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const seat = queue.seat;

  return (
    <AppShell>
      <header
        className="relative overflow-hidden px-5 pb-9 pt-10 text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
        {/* glow orbs */}
        <div className="pointer-events-none absolute -right-20 -top-10 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
        <div className="shimmer pointer-events-none absolute inset-0" />

        <div className="relative">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-90">Your queue number</p>
          <div className="mt-2 flex items-end gap-3">
            <span
              className="text-[clamp(52px,18vw,80px)] font-bold leading-none tracking-tight"
              style={{ textShadow: "0 0 40px oklch(1 0 0 / 0.3), 0 4px 20px oklch(0 0 0 / 0.4)" }}
            >
              {queue.number}
            </span>
            {queue.checkedIn && (
              <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-success/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-success-foreground shadow-[var(--shadow-glow-success)]">
                <CheckCircle2 className="h-3 w-3" /> Checked In
              </span>
            )}
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs opacity-90">
            <MapPin className="h-3 w-3" /> {queue.clinic?.name}
          </p>
        </div>
      </header>

      <main className="-mt-6 space-y-4 px-5">
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} label="Patients ahead" value={String(queue.patientsAhead)} highlight={queue.patientsAhead === 0} />
          <StatCard icon={Clock} label="Est. completion" value={completionStr} />
        </div>

        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground">Estimated wait</span>
            <span className="text-base font-bold text-gradient-primary">{queue.estimatedMinutes} min</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="relative h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.max(5, 100 - (queue.patientsAhead / Math.max(queue.clinic?.queueLength ?? 1, 1)) * 100)}%`,
                background: "var(--gradient-primary)",
                boxShadow: "0 0 12px oklch(0.62 0.22 255 / 0.7)",
              }}
            >
              <div className="shimmer absolute inset-0" />
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success shadow-[0_0_6px_currentColor]" />
            Live · running late moves you 5 numbers backwards · tick #{tick}
          </p>
        </div>

        {consultationDone && (
          <div
            className="relative overflow-hidden rounded-2xl border border-success/40 p-4"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.7 0.18 155 / 0.14), oklch(0.55 0.22 285 / 0.04))",
              boxShadow: "var(--shadow-glow-success)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/20 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Consultation complete</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  {result
                    ? autoIssuedMcId
                      ? "Your medical certificate has been issued and saved to your records."
                      : "Issuing your medical certificate…"
                    : "Complete an AI triage to auto-issue an MC for this visit."}
                </p>
              </div>
            </div>
            {result ? (
              <button
                onClick={handleViewCertificate}
                disabled={!autoIssuedMcId}
                className="btn-glow mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
              >
                <FileCheck2 className="h-3.5 w-3.5" /> View Medical Certificate
              </button>
            ) : (
              <Link
                to="/visit"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-primary/50"
              >
                Start AI triage
              </Link>
            )}
          </div>
        )}

        {/* Assigned seat / Picker */}
        {seat ? (
          <div
            className="relative overflow-hidden rounded-2xl border border-primary/40 p-4"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.62 0.2 252 / 0.12), oklch(0.55 0.22 290 / 0.05)), var(--card)",
              boxShadow: "0 0 30px -8px oklch(0.55 0.22 285 / 0.4)",
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, oklch(0.62 0.22 255), transparent)" }}
            />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="btn-glow flex h-12 w-12 items-center justify-center rounded-xl text-primary-foreground">
                  <Armchair className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Your assigned seat</p>
                  <p className="mt-0.5 text-[clamp(20px,8vw,30px)] font-bold tracking-tight text-foreground">{seat.seat}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSeatPicker(true)}
                className="text-[11px] font-bold uppercase tracking-wider text-primary hover:text-primary-glow"
              >
                Change
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 px-3 py-2.5 backdrop-blur">
              <Compass className="h-4 w-4 text-primary" />
              <div className="flex-1 text-xs">
                <p className="font-bold text-foreground">{seat.floor} → {seat.direction}</p>
                <p className="text-[11px] text-muted-foreground">Follow zone {seat.zone} signage from reception</p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSeatPicker(true)}
            className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-primary/50 bg-card/40 p-4 text-left transition-all hover:border-primary hover:bg-card hover:shadow-[0_0_24px_-8px_oklch(0.62_0.22_255/0.5)]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-[0_0_14px_oklch(0.62_0.22_255/0.4)]">
              <Armchair className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Reserve your waiting seat</p>
              <p className="text-xs text-muted-foreground">Pick a zone and seat with directions</p>
            </div>
            <span className="btn-glow rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Pick
            </span>
          </button>
        )}

        {/* QR Code */}
        <div className="glass rounded-2xl p-5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Check-in code</p>
          <div className="mx-auto mt-3 flex w-fit items-center justify-center">
            <QRTicket
              size={176}
              payload={{
                v: 1,
                type: "myclinIQ-checkin",
                ticket: queue.number,
                clinic: queue.clinic ?? "unknown",
                seat: queue.seat?.seat ?? null,
                issuedAt: Date.now(),
              }}
              label="Scan at front desk"
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Show this at the front desk</p>
          {!queue.checkedIn ? (
            <button
              onClick={checkIn}
              className="btn-glow mt-4 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-primary-foreground"
            >
              <QrCode className="h-4 w-4" />
              Scan to Check In
            </button>
          ) : (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-success/15 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-success shadow-[var(--shadow-glow-success)]">
              <CheckCircle2 className="h-4 w-4" /> You're checked in
            </div>
          )}
        </div>

        {!queue.checkedIn && (
          <button
            onClick={delay}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-warning"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Running late? Move 5 numbers back
          </button>
        )}
      </main>

      {/* Seat picker sheet */}
      {showSeatPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-md animate-fade-in">
          <div className="glass-strong flex h-[92vh] w-full max-w-[440px] animate-scale-in flex-col rounded-t-3xl p-5 pb-0">
            <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-muted" />
            <div className="mb-4 flex shrink-0 items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight text-foreground">Choose your seat</h3>
              <button
                onClick={() => setShowSeatPicker(false)}
                className="rounded-full px-2 py-1 text-xs font-bold uppercase text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+2rem)]">
              <SeatPicker
                onConfirm={(s) => {
                  assignSeat(s);
                  setShowSeatPicker(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`glass relative overflow-hidden rounded-2xl p-4 ${
        highlight ? "shadow-[var(--shadow-glow-success)]" : ""
      }`}
    >
      {highlight && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(135deg, oklch(0.7 0.18 155 / 0.1), transparent)",
          }}
        />
      )}
      <Icon className={`relative h-4 w-4 ${highlight ? "text-success" : "text-primary"}`} />
      <p
        className={`relative mt-2 text-2xl font-bold tracking-tight ${
          highlight ? "text-success" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="relative text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
    </div>
  );
}

function FakeQR({ seed }: { seed: string }) {
  const cells: boolean[] = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < 144; i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    cells.push((h & 1) === 1);
  }
  return (
    <svg viewBox="0 0 12 12" className="h-full w-full">
      <rect width="12" height="12" fill="white" />
      {cells.map((on, i) => {
        const x = i % 12;
        const y = Math.floor(i / 12);
        const inCorner =
          (x < 3 && y < 3) || (x > 8 && y < 3) || (x < 3 && y > 8);
        if (inCorner || !on) return null;
        return <rect key={i} x={x} y={y} width="1" height="1" fill="black" />;
      })}
      {[
        [0, 0],
        [9, 0],
        [0, 9],
      ].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width="3" height="3" fill="black" />
          <rect x={x + 0.5} y={y + 0.5} width="2" height="2" fill="white" />
          <rect x={x + 1} y={y + 1} width="1" height="1" fill="black" />
        </g>
      ))}
    </svg>
  );
}
