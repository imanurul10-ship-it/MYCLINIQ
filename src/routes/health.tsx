import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp, todayKey } from "@/lib/store";
import { MEDICATIONS, APPOINTMENTS, buildICS, formatApptDate, formatApptTime } from "@/lib/health-data";
import { Pill, Calendar, TrendingUp, Check, Bell, MapPin, Download, Activity } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/health")({
  component: Health,
  head: () => ({ meta: [{ title: "Health · MediQ" }] }),
});

const symptomData = [
  { d: "Mon", v: 2 },
  { d: "Tue", v: 1 },
  { d: "Wed", v: 3 },
  { d: "Thu", v: 2 },
  { d: "Fri", v: 4 },
  { d: "Sat", v: 1 },
  { d: "Sun", v: 0 },
];

const visits = [
  { date: "Mar 12, 2024", symptoms: "Fever, Cough", diagnosis: "Viral infection", clinic: "Bangsar Health" },
  { date: "Jan 28, 2024", symptoms: "Headache", diagnosis: "Tension headache", clinic: "Mid Valley Urgent" },
  { date: "Nov 04, 2023", symptoms: "Sore throat", diagnosis: "Pharyngitis", clinic: "Bangsar Health" },
];

const colorMap: Record<string, string> = {
  primary: "bg-primary/15 text-primary shadow-[0_0_14px_oklch(0.62_0.22_255/0.4)]",
  success: "bg-success/15 text-success shadow-[var(--shadow-glow-success)]",
  warning: "bg-warning/15 text-warning shadow-[var(--shadow-glow-warning)]",
};

function Health() {
  const max = Math.max(...symptomData.map((s) => s.v), 1);
  const medsTaken = useApp((s) => s.medsTaken);
  const toggleMedTaken = useApp((s) => s.toggleMedTaken);
  const today = todayKey();

  const totalDoses = MEDICATIONS.reduce((acc, m) => acc + m.times.length, 0);
  const takenToday = MEDICATIONS.reduce(
    (acc, m) => acc + m.times.filter((t) => medsTaken[`${today}:${m.id}:${t}`]).length,
    0,
  );

  const handleDownloadIcs = (apptId: string) => {
    const appt = APPOINTMENTS.find((a) => a.id === apptId);
    if (!appt) return;
    const url = buildICS(appt);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${appt.title.replace(/\s+/g, "-").toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Calendar event downloaded", {
      description: "Open the .ics file to add it to your calendar.",
    });
  };

  const adherencePct = totalDoses ? Math.round((takenToday / totalDoses) * 100) : 0;

  return (
    <AppShell>
      <header className="relative overflow-hidden px-5 pb-6 pt-10" style={{ background: "var(--gradient-hero)" }}>
        <div className="pointer-events-none absolute -right-16 -top-10 h-48 w-48 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        <p className="relative text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Health Dashboard</p>
        <h1 className="relative mt-1 text-[28px] font-bold tracking-tight text-foreground">Your Wellbeing</h1>
        <div className="relative mt-4 flex items-center gap-3">
          <div className="glass flex-1 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Daily adherence</p>
            <p className="mt-0.5 text-xl font-bold text-gradient-primary">{adherencePct}%</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full"
                style={{ width: `${adherencePct}%`, background: "var(--gradient-primary)", boxShadow: "0 0 8px oklch(0.62 0.22 255 / 0.7)" }}
              />
            </div>
          </div>
          <div className="glass flex-1 rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Today</p>
            <p className="mt-0.5 text-xl font-bold text-foreground">{takenToday}/{totalDoses}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">doses taken</p>
          </div>
        </div>
      </header>

      <main className="space-y-7 px-5 py-6">
        {/* Upcoming appointments */}
        <section>
          <SectionTitle icon={Calendar}>Upcoming Appointments</SectionTitle>
          <div className="space-y-2.5">
            {APPOINTMENTS.map((a) => (
              <article
                key={a.id}
                className="glass relative overflow-hidden rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{a.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.doctor}</p>
                  </div>
                  <div className="rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-center shadow-[0_0_14px_-4px_oklch(0.62_0.22_255/0.5)]">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-primary">
                      {formatApptDate(a.startsAt).split(" ")[0]}
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {formatApptDate(a.startsAt).split(" ").slice(1).join(" ")}
                    </p>
                    <p className="text-[10px] font-medium text-primary/80">{formatApptTime(a.startsAt)}</p>
                  </div>
                </div>
                <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {a.clinic}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleDownloadIcs(a.id)}
                    className="btn-glow flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-primary-foreground"
                  >
                    <Download className="h-3.5 w-3.5" /> Add to calendar
                  </button>
                  <button
                    onClick={() => toast("Reminder set", { description: "We'll notify you 1 hour before." })}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-foreground hover:border-primary/40 hover:text-primary"
                  >
                    <Bell className="h-3.5 w-3.5" /> Remind
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Medication reminders */}
        <section>
          <SectionTitle icon={Pill}>Medication Reminders</SectionTitle>
          <div className="space-y-2.5">
            {MEDICATIONS.map((m) => (
              <div
                key={m.id}
                className="glass rounded-2xl p-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorMap[m.color]}`}>
                    <Pill className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">
                      {m.name} <span className="font-normal text-muted-foreground">· {m.dose}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{m.schedule}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border/50 pt-3">
                  {m.times.map((t) => {
                    const key = `${today}:${m.id}:${t}`;
                    const taken = !!medsTaken[key];
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          toggleMedTaken(m.id, t);
                          if (!taken) toast.success(`${m.name} marked as taken`, { description: `Dose at ${t}` });
                        }}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                          taken
                            ? "bg-success/20 text-success shadow-[var(--shadow-glow-success)]"
                            : "border border-border bg-card text-foreground hover:border-primary/40 hover:text-primary"
                        }`}
                      >
                        {taken ? <Check className="h-3 w-3" /> : <Bell className="h-3 w-3" />} {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Symptom history (glowing chart) */}
        <section>
          <SectionTitle icon={TrendingUp}>Symptom History</SectionTitle>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-end justify-between gap-2 pt-2">
              {symptomData.map((s) => (
                <div key={s.d} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-28 w-full items-end">
                    <div
                      className="relative w-full rounded-t-md transition-all"
                      style={{
                        height: `${(s.v / max) * 100}%`,
                        minHeight: s.v === 0 ? "2px" : undefined,
                        background: "var(--gradient-primary)",
                        boxShadow: s.v > 0 ? "0 0 12px oklch(0.62 0.22 255 / 0.6)" : undefined,
                      }}
                    >
                      <div className="shimmer absolute inset-0 rounded-t-md" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.d}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">This week</p>
                <p className="text-base font-bold text-foreground">13 reports</p>
              </div>
              <div className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-success shadow-[var(--shadow-glow-success)]">
                ↓ 22% vs last
              </div>
            </div>
          </div>
        </section>

        {/* Past visits */}
        <section>
          <SectionTitle icon={Activity}>Past Visits</SectionTitle>
          <div className="space-y-2.5">
            {visits.map((v) => (
              <div key={v.date} className="glass rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{v.diagnosis}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{v.symptoms}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {v.date.split(",")[0]}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">@ {v.clinic}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon: typeof Pill }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary drop-shadow-[0_0_6px_oklch(0.62_0.22_255/0.6)]" />
      <h2 className="text-sm font-bold text-foreground">{children}</h2>
      <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
    </div>
  );
}
