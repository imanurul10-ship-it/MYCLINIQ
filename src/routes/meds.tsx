import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp, todayKey } from "@/lib/store";
import { MEDICATIONS } from "@/lib/health-data";
import { Bell, Check, Pill, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/meds")({
  component: MedsPage,
  head: () => ({ meta: [{ title: "Medication Reminders · MyClinIQ" }] }),
});

function MedsPage() {
  const medsTaken = useApp((s) => s.medsTaken);
  const toggleMedTaken = useApp((s) => s.toggleMedTaken);
  const today = todayKey();

  return (
    <AppShell>
      <header className="relative overflow-hidden px-5 pb-6 pt-10" style={{ background: "var(--gradient-hero)" }}>
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Stay on track</p>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-foreground">Medication reminders</h1>
        <p className="mt-1 text-xs text-muted-foreground">Tap each dose as you take it.</p>
      </header>

      <main className="space-y-4 px-5 py-6">
        <div className="mb-2.5 flex items-center gap-2">
          <Pill className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Today's doses</h2>
          <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        </div>
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
      </main>
    </AppShell>
  );
}
