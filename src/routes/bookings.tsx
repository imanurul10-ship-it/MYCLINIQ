import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useBookings, SESSION_LABELS, SESSION_TIMES, formatBookingDate, formatTime12h, seatsLeftFor, type Booking, type BookingSession } from "@/lib/bookings";
import { Calendar, MapPin, Pencil, X, Trash2, CalendarDays, Clock, ArrowLeft, Repeat, Bell } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/bookings")({
  component: BookingsPage,
  head: () => ({ meta: [{ title: "Bookings · MyClinIQ" }] }),
});

function BookingsPage() {
  const bookings = useBookings((s) => s.bookings);
  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "scheduled")
        .sort((a, b) => a.date.localeCompare(b.date)),
    [bookings],
  );

  return (
    <AppShell>
      <header className="relative overflow-hidden px-5 pb-6 pt-10" style={{ background: "var(--gradient-hero)" }}>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Upcoming & follow-up</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-foreground">Bookings</h1>
        <p className="mt-1 text-xs text-muted-foreground">Your upcoming clinic visits and follow-up sessions.</p>
      </header>

      <main className="space-y-4 px-5 py-6">
        <div className="mb-2.5 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Upcoming bookings</h2>
          <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        </div>
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

        <FollowUpSection />
      </main>
    </AppShell>
  );
}

function FollowUpSection() {
  const sessions = [
    {
      id: "fu-1",
      title: "Post-treatment review",
      clinic: "Klinik Kesihatan Putrajaya Presint 9",
      date: "Tue, 12 May 2026",
      time: "10:30 AM",
      note: "Bring previous prescription and recovery notes.",
    },
    {
      id: "fu-2",
      title: "Wound dressing follow-up",
      clinic: "Klinik Kesihatan Presint 18",
      date: "Fri, 22 May 2026",
      time: "2:00 PM",
      note: "Nurse will assess healing progress.",
    },
  ];

  return (
    <section>
      <div className="mb-2.5 mt-2 flex items-center gap-2">
        <Repeat className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">Follow-up sessions</h2>
        <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>
      <div className="space-y-2.5">
        {sessions.map((s) => (
          <article key={s.id} className="glass rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{s.title}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {s.clinic}
                </p>
                <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {s.date} · {s.time}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{s.note}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
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

  const CANCEL_REASONS = ["Schedule conflict", "Feeling better", "Switching clinic", "Personal emergency", "Other"];

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
                    className={`flex min-w-[52px] snap-start flex-col items-center rounded-xl border px-2 py-2 text-foreground ${active ? "border-primary bg-primary/15 text-primary" : "border-border/60 bg-card"}`}
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
                    className={`rounded-xl border px-2 py-2 text-[10px] font-bold uppercase tracking-wider ${active ? "border-primary bg-primary/15 text-primary" : "border-border/60 bg-card text-foreground"}`}
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
                    className={`rounded-lg border px-1.5 py-1.5 text-[10px] font-bold ${full ? "cursor-not-allowed border-border/40 bg-card/40 text-muted-foreground/50" : active ? "border-primary bg-primary/15 text-primary" : "border-border/60 bg-card text-foreground"}`}
                  >
                    {formatTime12h(t)}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setDate(booking.date); setSession(booking.session); setTime(booking.time); setEditing(false); }}
              className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              Discard
            </button>
            <button
              disabled={!time}
              onClick={() => { update(booking.id, { date, session, time }); setEditing(false); toast.success("Booking updated"); }}
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
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${active ? "border-destructive bg-destructive/15 text-destructive" : "border-border bg-card text-foreground"}`}
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
