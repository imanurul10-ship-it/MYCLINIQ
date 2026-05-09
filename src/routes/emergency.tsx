import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Phone, ArrowLeft, MapPin } from "lucide-react";
import { CLINICS } from "@/lib/clinics";
import { ClinicCard } from "@/components/ClinicCard";

export const Route = createFileRoute("/emergency")({
  component: Emergency,
  head: () => ({ meta: [{ title: "Emergency · MediQ" }] }),
});

function Emergency() {
  const emergencyClinics = CLINICS.filter((c) => c.emergency).sort((a, b) => a.distanceKm - b.distanceKm);
  const nearest = emergencyClinics[0];

  return (
    <div className="min-h-screen bg-surface">
      <div className="relative mx-auto min-h-screen w-full max-w-[440px] overflow-hidden bg-background pb-10">
        <div
          className="relative overflow-hidden px-5 pb-9 pt-9 text-destructive-foreground"
          style={{ background: "var(--gradient-emergency)" }}
        >
          {/* glow + grid */}
          <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-destructive/40 blur-3xl" />
          <div className="shimmer pointer-events-none absolute inset-0" />

          <Link
            to="/"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-destructive-foreground/15 backdrop-blur"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="relative mt-4 flex items-center gap-3">
            <div className="animate-pulse-emergency flex h-16 w-16 items-center justify-center rounded-full bg-destructive-foreground/15 backdrop-blur">
              <AlertTriangle className="h-8 w-8" strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-90">Emergency Guide</p>
              <h1 className="text-2xl font-bold tracking-tight">When every minute counts</h1>
            </div>
          </div>

          <a
            href="tel:999"
            className="relative mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-destructive-foreground py-4 text-sm font-bold uppercase tracking-wider text-destructive shadow-[0_8px_30px_-6px_oklch(0_0_0/0.5)]"
          >
            <Phone className="h-4 w-4" />
            Call 999 Emergency
          </a>
        </div>

        <main className="relative space-y-6 px-5 py-6">
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-destructive">
              <span className="h-1 w-1 rounded-full bg-destructive shadow-[0_0_6px_currentColor]" />
              Critical symptoms
            </h2>
            <ul className="glass space-y-2 rounded-2xl p-4 text-sm text-foreground">
              {[
                "Chest pain with breathing difficulty",
                "Sudden numbness or paralysis",
                "Severe bleeding",
                "Loss of consciousness",
                "Severe allergic reaction",
              ].map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-destructive shadow-[0_0_6px_currentColor]" />
                  {s}
                </li>
              ))}
            </ul>
          </section>

          {nearest && (
            <section>
              <h2 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                <MapPin className="h-3 w-3" /> Nearest emergency clinic
              </h2>
              <ClinicCard clinic={nearest} emergencyHighlight actionLabel="Navigate" onSelect={() => {}} />
            </section>
          )}

          {emergencyClinics.slice(1).length > 0 && (
            <section>
              <h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Other emergency facilities
              </h2>
              <div className="space-y-3">
                {emergencyClinics.slice(1).map((c) => (
                  <ClinicCard key={c.id} clinic={c} actionLabel="Navigate" onSelect={() => {}} />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
