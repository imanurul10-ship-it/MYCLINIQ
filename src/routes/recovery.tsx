import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Activity, Check, HeartPulse, Hourglass, Sparkles, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/recovery")({
  component: RecoveryPage,
  head: () => ({ meta: [{ title: "Recovery · MyClinIQ" }] }),
});

function RecoveryPage() {
  return (
    <AppShell>
      <header className="relative overflow-hidden px-5 pb-6 pt-10" style={{ background: "var(--gradient-hero)" }}>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Recovery Tracker</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-foreground">Your healing progress</h1>
        <p className="mt-1 text-xs text-muted-foreground">Track post-visit recovery so your doctor can adjust care plans.</p>
      </header>

      <main className="space-y-6 px-5 py-6">
        <RecoveryTracker />
      </main>
    </AppShell>
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
      <div className="mb-2.5 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground">Recovery tracker</h2>
        <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>
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
