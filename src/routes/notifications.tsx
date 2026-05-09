import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Bell, Calendar, Pill, CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  component: Notifications,
  head: () => ({ meta: [{ title: "Notifications · MyClinIQ" }] }),
});

const ITEMS = [
  { id: 1, icon: Calendar, tone: "primary", title: "Upcoming appointment", body: "Klinik Mediviron · Tomorrow 10:30 AM", time: "2h ago" },
  { id: 2, icon: Pill, tone: "accent", title: "Medication reminder", body: "Paracetamol 500mg · Take with water", time: "5h ago" },
  { id: 3, icon: CheckCircle2, tone: "success", title: "Visit summary ready", body: "Your March 12 consultation report is available.", time: "1d" },
  { id: 4, icon: AlertTriangle, tone: "warning", title: "Heatwave advisory", body: "High UV today. Stay hydrated, avoid 12–3pm sun.", time: "1d" },
] as const;

const toneClass: Record<string, string> = {
  primary: "bg-primary/15 text-primary",
  accent: "bg-accent/15 text-accent",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
};

function Notifications() {
  return (
    <AppShell>
      <header className="glass-strong sticky top-0 z-20 px-5 py-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="glass flex h-10 w-10 items-center justify-center rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight">Notifications</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Reminders · Alerts</p>
          </div>
          <Bell className="h-5 w-5 text-muted-foreground" />
        </div>
      </header>

      <main className="space-y-2.5 px-5 py-6">
        {ITEMS.map((n) => (
          <div key={n.id} className="glass flex items-start gap-3 rounded-2xl p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClass[n.tone]}`}>
              <n.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">{n.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
            </div>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{n.time}</span>
          </div>
        ))}
      </main>
    </AppShell>
  );
}
