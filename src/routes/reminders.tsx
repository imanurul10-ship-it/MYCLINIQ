import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp, todayKey } from "@/lib/store";
import { MEDICATIONS } from "@/lib/health-data";
import { useBookings, SESSION_LABELS, SESSION_TIMES, formatBookingDate, formatTime12h, seatsLeftFor, type Booking, type BookingSession } from "@/lib/bookings";
import { Bell, Calendar, Check, MapPin, Pill, Activity, HeartPulse, Hourglass, Sparkles, Pencil, X, Trash2, CalendarDays, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/reminders")({
  component: Reminders,
  head: () => ({ meta: [{ title: "Reminders · MyClinIQ" }] }),
});

function Reminders() {
  const medsTaken = useApp((s) => s.medsTaken);
  const toggleMedTaken = useApp((s) => s.toggleMedTaken);
  const today = todayKey();

  return (
    <AppShell>
      <header className="relative overflow-hidden px-5 pb-6 pt-10" style={{ background: "var(--gradient-hero)" }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Medication & appointments</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-foreground">Reminders</h1>
        <p className="mt-1 text-xs text-muted-foreground">Dose reminders and your upcoming clinic visits in one place.</p>
      </header>

      <main className="space-y-6 px-5 py-6">
        <ActiveQueueCard />

        <BookingsSection />

        <section>
          <SectionTitle icon={Pill}>Medication reminders</SectionTitle>
          <div className="space-y-2.5">
            {MEDICATIONS.map((m) => (
              <article key={m.id} className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{m.name} <span className="font-normal text-muted-foreground">· {m.dose}</span></p>
                    <p className="text-xs text-muted-foreground">{m.schedule}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/50 pt-3">
                  {m.times.map((time) => {
                    const taken = !!medsTaken[`${today}:${m.id}:${time}`];
                    return (
                      <button
                        key={time}
                        onClick={() => {
                          toggleMedTaken(m.id, time);
                          if (!taken) toast.success(`${m.name} marked as taken`, { description: `Dose at ${time}` });
                        }}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${taken ? "bg-success/20 text-success" : "border border-border bg-card text-foreground"}`}
                      >
                        {taken ? <Check className="h-3 w-3" /> : <Bell className="h-3 w-3" />} {time}
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>

        <RecoveryTracker />
      </main>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Active queue card                                                   */
/* ------------------------------------------------------------------ */

function ActiveQueueCard() {
  const queue = useApp((s) => s.queue);
  const cancelQueue = useApp((s) => s.cancelQueue);
  const [confirm, setConfirm] = useState(false);
  if (!queue) return null;

  return (
    <section>
      <SectionTitle icon={Activity}>Active queue</SectionTitle>
      <article className="glass rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Queue #{queue.number}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{queue.clinic?.name}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {queue.checkedIn ? "Checked in · " : ""}
              {queue.patientsAhead} ahead · ~{queue.estimatedMinutes} min
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link
            to="/queue"
            className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-foreground hover:border-primary/50"
          >
            Open queue
          </Link>
          {!queue.checkedIn && (
            confirm ? (
              <button
                onClick={() => {
                  cancelQueue();
                  setConfirm(false);
                  toast.success("Queue cancelled");
                }}
                className="flex-1 rounded-xl border border-destructive/60 bg-destructive/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-destructive"
              >
                Confirm cancel
              </button>
            ) : (
              <button
                onClick={() => setConfirm(true)}
                className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:border-destructive/50 hover:text-destructive"
              >
                Cancel
              </button>
            )
          )}
        </div>
        {queue.checkedIn && (
          <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <AlertCircle className="h-3 w-3" /> Already checked in — cancellation must be done at reception.
          </p>
        )}
      </article>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Bookings section                                                    */
/* ------------------------------------------------------------------ */

function BookingsSection() {
  const bookings = useBookings((s) => s.bookings);
  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "scheduled")
        .sort((a, b) => a.date.localeCompare(b.date)),
    [bookings],
  );

  return (
    <section>
      <SectionTitle icon={Calendar}>Upcoming bookings</SectionTitle>
      {upcoming.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-5 text-center">
          <CalendarDays className="mx-auto h-6 w-6 text-muted-foreground/60" />
          <p className="mt-2 text-xs font-semibold text-foreground">No bookings yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Book a visit and it'll show up here automatically.
          </p>
          <Link
            to="/visit"
            className="btn-glow mt-3 inline-flex rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-primary-foreground"
          >
            Book a visit
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {upcoming.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </section>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const update = useBookings((s) => s.update);
  const cancel = useBookings((s) => s.cancel);
  const remove = useBookings((s) => s.remove);
  const [editing, setEditing] = useState(false);
  const [cancelMode, setCancelMode] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelNote, setCancelNote] = useState("");
  const [date, setDate] = useState(booking.date);
  const [session, setSession] = useState<BookingSession>(booking.session);
  const [time, setTime] = useState(booking.time);

  const sessionInfo = SESSION_LABELS[booking.session];
  const days = useMemo(() => {
    const out: { iso: string; weekday: string; day: string; month: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      out.push({
        iso,
        weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
        day: String(d.getDate()),
        month: d.toLocaleDateString(undefined, { month: "short" }),
      });
    }
    return out;
  }, []);
  const slots = SESSION_TIMES[session];

  const CANCEL_REASONS = [
    "Schedule conflict",
    "Feeling better",
    "Switching clinic",
    "Personal emergency",
    "Other",
  ];

  const submitCancel = () => {
    if (!cancelReason) {
      toast.error("Please select a reason for cancellation");
      return;
    }
    cancel(booking.id);
    remove(booking.id);
    toast.success("Booking cancelled", {
      description: cancelReason + (cancelNote ? ` — ${cancelNote}` : ""),
    });
  };

  return (
    <article className="glass rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">{booking.clinic.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" /> {booking.clinic.address}
          </p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-primary">
            {formatBookingDate(booking.date)} · {formatTime12h(booking.time)}
          </p>
          <p className="text-[10px] text-muted-foreground">{sessionInfo.label} · {sessionInfo.sub}</p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-center">
          <Clock className="mx-auto h-3.5 w-3.5 text-primary" />
          <p className="mt-0.5 text-[10px] font-bold tracking-wider text-primary">{formatTime12h(booking.time)}</p>
        </div>
      </div>

      {editing && (
        <div className="mt-3 space-y-3 rounded-xl border border-border/60 bg-background/40 p-3">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-accent">Reschedule day</p>
            <div className="-mx-1 flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-1 pb-1">
              {days.map((d) => {
                const active = date === d.iso;
                return (
                  <button
                    key={d.iso}
                    onClick={() => { setDate(d.iso); setTime(""); }}
                    className={`flex min-w-[52px] snap-start flex-col items-center rounded-xl border px-2 py-2 text-foreground ${
                      active ? "border-primary bg-primary/15 text-primary" : "border-border/60 bg-card"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase opacity-80">{d.weekday}</span>
                    <span className="text-base font-bold leading-none">{d.day}</span>
                    <span className="text-[9px] uppercase opacity-70">{d.month}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-accent">Session</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(SESSION_LABELS) as BookingSession[]).map((s) => {
                const active = session === s;
                return (
                  <button
                    key={s}
                    onClick={() => { setSession(s); setTime(""); }}
                    className={`rounded-xl border px-2 py-2 text-[10px] font-bold uppercase tracking-wider ${
                      active ? "border-primary bg-primary/15 text-primary" : "border-border/60 bg-card text-foreground"
                    }`}
                  >
                    {SESSION_LABELS[s].label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-accent">Time slot</p>
            <div className="grid grid-cols-3 gap-1.5">
              {slots.map((t) => {
                const left = seatsLeftFor(date, t);
                const full = left === 0;
                const active = time === t;
                return (
                  <button
                    key={t}
                    disabled={full}
                    onClick={() => setTime(t)}
                    className={`rounded-lg border px-1.5 py-1.5 text-[10px] font-bold ${
                      full
                        ? "cursor-not-allowed border-border/40 bg-card/40 text-muted-foreground/50"
                        : active
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border/60 bg-card text-foreground"
                    }`}
                  >
                    {formatTime12h(t)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setDate(booking.date);
                setSession(booking.session);
                setTime(booking.time);
                setEditing(false);
              }}
              className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Discard
            </button>
            <button
              disabled={!time}
              onClick={() => {
                update(booking.id, { date, session, time });
                setEditing(false);
                toast.success("Booking updated");
              }}
              className="btn-glow flex-1 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-40"
            >
              Save changes
            </button>
          </div>
        </div>
      )}

      {cancelMode && !editing && (
        <div className="mt-3 space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-destructive">Cancel booking</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Pick a reason — this helps us improve scheduling.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CANCEL_REASONS.map((r) => {
              const active = cancelReason === r;
              return (
                <button
                  key={r}
                  onClick={() => setCancelReason(r)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
                    active ? "border-destructive bg-destructive/15 text-destructive" : "border-border bg-card text-foreground"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
          <textarea
            value={cancelNote}
            onChange={(e) => setCancelNote(e.target.value)}
            placeholder="Add details (optional)"
            rows={2}
            className="w-full resize-none rounded-xl border border-border bg-card p-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-destructive/60"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setCancelMode(false); setCancelReason(""); setCancelNote(""); }}
              className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Keep booking
            </button>
            <button
              onClick={submitCancel}
              disabled={!cancelReason}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-destructive/60 bg-destructive/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-destructive disabled:opacity-40"
            >
              <Trash2 className="h-3 w-3" /> Confirm cancel
            </button>
          </div>
        </div>
      )}

      {!editing && !cancelMode && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-foreground hover:border-primary/50"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
          <button
            onClick={() => setCancelMode(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:border-destructive/50 hover:text-destructive"
          >
            <X className="h-3 w-3" /> Cancel
          </button>
        </div>
      )}
    </article>
  );
}

function RecoveryTracker() {
  const day = 3;
  const total = 5;
  const pct = Math.round((day / total) * 100);
  const journey = [
    { day: 1, title: "Day 1 — Diagnosis", date: "15 Apr · Klinik Chow Kit", note: "Diagnosed URTI. Prescription issued. Rest advised.", state: "done" as const },
    { day: 2, title: "Day 2 — Medication Start", date: "16 Apr", note: "Started paracetamol + antihistamine. Fever subsiding.", state: "done" as const },
    { day: 3, title: "Day 3 — Today", date: "17 Apr (Now)", note: "Feeling better. Continue medication. Increase fluids.", state: "current" as const },
    { day: 4, title: "Day 4", date: "Expected", note: "Symptoms mostly resolved", state: "upcoming" as const },
    { day: 5, title: "Day 5 — Full Recovery", date: "Expected", note: "Resume normal activities, finish medication course.", state: "upcoming" as const },
  ];

  return (
    <section>
      <SectionTitle icon={Activity}>Recovery tracker</SectionTitle>
      <article className="glass rounded-2xl p-5">
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="52" stroke="oklch(0.7 0.18 175 / 0.18)" strokeWidth="8" fill="none" />
              <circle
                cx="60" cy="60" r="52"
                stroke="oklch(0.7 0.18 175)" strokeWidth="8" fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 326.7} 326.7`}
                style={{ filter: "drop-shadow(0 0 6px oklch(0.7 0.18 175 / 0.55))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-success">{day}</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Day</span>
            </div>
          </div>
          <h3 className="mt-3 text-lg font-bold text-foreground">Day {day} of Recovery</h3>
          <p className="text-xs text-muted-foreground">Upper Respiratory Tract Infection</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Diagnosed: 15 Apr 2025 · Dr. Amirul Hassan</p>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-foreground">Recovery Progress</span>
            <span className="font-bold text-success">{pct}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, oklch(0.7 0.18 175), oklch(0.78 0.16 188))", boxShadow: "0 0 10px oklch(0.7 0.18 175 / 0.6)" }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Day 1</span>
            <span>Day {total} Expected</span>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-success/30 bg-success/10 p-3 text-xs text-foreground">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 text-success" />
          <p>
            You should fully recover in approximately{" "}
            <span className="font-bold text-success">{total - day} more days</span> if you follow the treatment plan.
          </p>
        </div>

        <div className="mt-5">
          <p className="mb-2.5 text-sm font-bold text-foreground">Recovery Journey</p>
          <ol className="relative space-y-3 border-l border-border/60 pl-5">
            {journey.map((j) => {
              const Icon = j.state === "done" ? Check : j.state === "current" ? Hourglass : HeartPulse;
              const color = j.state === "done"
                ? "border-success bg-success/15 text-success"
                : j.state === "current"
                  ? "border-success bg-card text-success animate-pulse-glow"
                  : "border-border bg-card text-muted-foreground";
              return (
                <li key={j.day} className="relative">
                  <span className={`absolute -left-[27px] flex h-6 w-6 items-center justify-center rounded-full border-2 ${color}`}>
                    {j.state === "upcoming" ? <span className="text-[10px] font-bold">{j.day}</span> : <Icon className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <p className={`text-sm font-bold ${j.state === "current" ? "text-success" : "text-foreground"}`}>{j.title}</p>
                  <p className="text-[10px] text-muted-foreground">{j.date}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{j.note}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </article>
    </section>
  );
}

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon: typeof Pill }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="text-sm font-bold text-foreground">{children}</h2>
      <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
    </div>
  );
}
