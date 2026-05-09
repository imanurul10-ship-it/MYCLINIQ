import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  Users,
  AlertCircle,
  ShieldCheck,
  ArmchairIcon,
  Clock,
  AlertTriangle,
  X,
  Info,
  LayoutDashboard,
  Zap,
  CalendarDays,
  FileText,
  TimerReset,
  Filter,
  Stethoscope,
  Syringe,
  HeartPulse,
  ClipboardCheck,
  FileCheck2,
  BarChart3,
} from "lucide-react";
import { SeverityBadge } from "@/components/SeverityBadge";
import type { Severity } from "@/lib/clinics";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
  head: () => ({ meta: [{ title: "Front Desk Admin · MyClinIQ" }] }),
});

/* ------------------------------------------------------------------ */
/* Types & data                                                        */
/* ------------------------------------------------------------------ */

type ReasonId = "general" | "followup" | "vaccine" | "screening" | "renewal";
type Mode = "walkin" | "booking";
type Status = "Waiting" | "Checked In" | "In Consult" | "Late" | "Forfeited" | "Completed";

interface Patient {
  id: string;
  number: string;
  name: string;
  symptoms: string;
  severity: Severity;
  status: Status;
  waitMinutes: number;
  /** minutes past called time; positive = late */
  lateMinutes: number;
  seat: string;
  zone: string;
  reason: ReasonId;
  mode: Mode;
  /** booking date (YYYY-MM-DD) — only relevant when mode === "booking" */
  bookingDate?: string;
  bookingSession?: "morning" | "afternoon" | "evening";
  /** how many positions they've been pushed back due to lateness */
  pushedBack: number;
  /** when consultation finished — for Records */
  visitedOn?: string;
}

const REASON_META: Record<ReasonId, { label: string; icon: typeof Stethoscope; tint: string }> = {
  general: { label: "General Consult", icon: Stethoscope, tint: "text-primary bg-primary/10" },
  followup: { label: "Follow-up", icon: HeartPulse, tint: "text-accent bg-accent/10" },
  vaccine: { label: "Vaccination", icon: Syringe, tint: "text-success bg-success/10" },
  screening: { label: "Screening", icon: ClipboardCheck, tint: "text-warning-foreground bg-warning/15" },
  renewal: { label: "Rx Renewal", icon: FileCheck2, tint: "text-primary bg-primary/10" },
};

const INITIAL_PATIENTS: Patient[] = [
  { id: "1", number: "A102", name: "Aiman Syazwan", symptoms: "Fever, Cough", severity: "medium", status: "Checked In", waitMinutes: 12, lateMinutes: 0, seat: "A-12", zone: "L2 West", reason: "general", mode: "walkin", pushedBack: 0 },
  { id: "2", number: "A103", name: "Lim Wei Ming", symptoms: "Chest pain, Breathing difficulty", severity: "high", status: "Waiting", waitMinutes: 4, lateMinutes: 0, seat: "A-03", zone: "L2 West", reason: "general", mode: "walkin", pushedBack: 0 },
  { id: "3", number: "B204", name: "Nurul Aina", symptoms: "Headache", severity: "low", status: "Late", waitMinutes: 0, lateMinutes: 8, seat: "B-08", zone: "L1 East", reason: "followup", mode: "booking", bookingDate: "2026-05-02", bookingSession: "morning", pushedBack: 0 },
  { id: "4", number: "A104", name: "Rajesh Kumar", symptoms: "High fever (39.2°)", severity: "high", status: "Checked In", waitMinutes: 6, lateMinutes: 0, seat: "A-15", zone: "L2 West", reason: "general", mode: "walkin", pushedBack: 0 },
  { id: "5", number: "C301", name: "Sophia Tan", symptoms: "Sore throat", severity: "low", status: "Late", waitMinutes: 0, lateMinutes: 16, seat: "C-04", zone: "L1 South", reason: "general", mode: "booking", bookingDate: "2026-05-02", bookingSession: "afternoon", pushedBack: 0 },
  { id: "6", number: "B205", name: "David Wong", symptoms: "Persistent cough (8d)", severity: "medium", status: "In Consult", waitMinutes: 0, lateMinutes: 0, seat: "B-11", zone: "L1 East", reason: "followup", mode: "walkin", pushedBack: 0 },
  { id: "7", number: "V101", name: "Mei Ling Chong", symptoms: "Annual flu shot", severity: "low", status: "Waiting", waitMinutes: 9, lateMinutes: 0, seat: "V-02", zone: "L1 North", reason: "vaccine", mode: "booking", bookingDate: "2026-05-02", bookingSession: "morning", pushedBack: 0 },
  { id: "8", number: "S210", name: "Hassan Ibrahim", symptoms: "Health screening package", severity: "low", status: "Checked In", waitMinutes: 18, lateMinutes: 0, seat: "S-01", zone: "L3", reason: "screening", mode: "booking", bookingDate: "2026-05-02", bookingSession: "afternoon", pushedBack: 0 },
  { id: "9", number: "R140", name: "Priya Nair", symptoms: "Hypertension Rx renewal", severity: "low", status: "Waiting", waitMinutes: 22, lateMinutes: 0, seat: "R-05", zone: "L1 South", reason: "renewal", mode: "walkin", pushedBack: 0 },
  // Past records
  { id: "h1", number: "A089", name: "Kavitha Devi", symptoms: "Migraine consult", severity: "medium", status: "Completed", waitMinutes: 0, lateMinutes: 0, seat: "—", zone: "—", reason: "general", mode: "walkin", pushedBack: 0, visitedOn: "2026-04-29" },
  { id: "h2", number: "B071", name: "Ahmad Faizal", symptoms: "Diabetes follow-up", severity: "low", status: "Completed", waitMinutes: 0, lateMinutes: 0, seat: "—", zone: "—", reason: "followup", mode: "booking", pushedBack: 0, visitedOn: "2026-04-28" },
  { id: "h3", number: "V044", name: "Tan Siew Ling", symptoms: "MMR booster", severity: "low", status: "Completed", waitMinutes: 0, lateMinutes: 0, seat: "—", zone: "—", reason: "vaccine", mode: "booking", pushedBack: 0, visitedOn: "2026-04-27" },
];

/* ------------------------------------------------------------------ */
/* Late penalty rule — pure queue pushback, no payment                 */
/*   ≤10 min  → grace                                                  */
/*   11–20 min → push back 3 numbers                                   */
/*   21–30 min → push back 6 numbers                                   */
/*   31–45 min → push back 10 numbers                                  */
/*   >45 min   → forfeit ticket                                        */
/* ------------------------------------------------------------------ */

function calcPushback(lateMin: number, severity: Severity): {
  positions: number;
  action: string;
  tone: "ok" | "warn" | "danger";
  forfeit: boolean;
} {
  if (severity === "high") return { positions: 0, action: "Emergency · no penalty", tone: "ok", forfeit: false };
  if (lateMin <= 10) return { positions: 0, action: "Within 10-min grace period", tone: "ok", forfeit: false };
  if (lateMin <= 20) return { positions: 3, action: "Pushed back 3 positions", tone: "warn", forfeit: false };
  if (lateMin <= 30) return { positions: 6, action: "Pushed back 6 positions", tone: "warn", forfeit: false };
  if (lateMin <= 45) return { positions: 10, action: "Pushed back 10 positions", tone: "warn", forfeit: false };
  return { positions: 0, action: "Ticket forfeited · must re-register", tone: "danger", forfeit: true };
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

type TabKey = "overview" | "walkin" | "bookings" | "records" | "penalty" | "analyse";

const TABS: { v: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { v: "overview", label: "Overview", icon: LayoutDashboard },
  { v: "analyse", label: "Analyse", icon: BarChart3 },
  { v: "walkin", label: "Walk-in", icon: Zap },
  { v: "bookings", label: "Bookings", icon: CalendarDays },
  { v: "records", label: "Records", icon: FileText },
  { v: "penalty", label: "Late", icon: TimerReset },
];

/* ------------------------------------------------------------------ */

function AdminDashboard() {
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [showPolicy, setShowPolicy] = useState(false);
  const [tab, setTab] = useState<TabKey>("overview");
  const [search, setSearch] = useState("");

  const active = useMemo(
    () => patients.filter((p) => p.status !== "Completed" && p.status !== "Forfeited"),
    [patients],
  );

  const stats = {
    total: active.length,
    walkin: active.filter((p) => p.mode === "walkin").length,
    booking: active.filter((p) => p.mode === "booking").length,
    high: active.filter((p) => p.severity === "high").length,
    late: active.filter((p) => p.status === "Late").length,
  };

  const applyPushback = (id: string) => {
    setPatients((ps) =>
      ps.map((p) => {
        if (p.id !== id) return p;
        const rule = calcPushback(p.lateMinutes, p.severity);
        toast.success(rule.forfeit ? "Ticket forfeited" : "Queue updated", {
          description: `${p.name} (${p.number}) · ${rule.action}`,
        });
        return {
          ...p,
          pushedBack: p.pushedBack + rule.positions,
          waitMinutes: p.waitMinutes + rule.positions * 4,
          status: rule.forfeit ? "Forfeited" : "Waiting",
          lateMinutes: rule.forfeit ? p.lateMinutes : 0,
        };
      }),
    );
  };

  const waivePushback = (id: string) => {
    setPatients((ps) =>
      ps.map((p) => (p.id === id ? { ...p, pushedBack: 0, status: "Waiting", lateMinutes: 0 } : p)),
    );
    toast("Penalty waived");
  };

  const filterBySearch = (list: Patient[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.number.toLowerCase().includes(q) ||
        p.seat.toLowerCase().includes(q) ||
        p.symptoms.toLowerCase().includes(q),
    );
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-blue-maroon mx-auto min-h-screen w-full max-w-7xl">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <Link
              to="/admin-login"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Staff Portal · Admin
              </p>
              <h1 className="text-base font-bold text-foreground">Front Desk Dashboard</h1>
            </div>
            <button
              onClick={() => setShowPolicy(true)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-bold text-foreground hover:border-primary/40"
            >
              <Info className="h-3 w-3" /> Late policy
            </button>
            <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-[11px] font-semibold text-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
              Live
            </div>
          </div>

          {/* Tabs nav */}
          <nav className="-mx-1 flex gap-1 overflow-x-auto px-3 pb-3 sm:px-5 lg:px-7">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.v;
              return (
                <button
                  key={t.v}
                  onClick={() => setTab(t.v)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-[0_0_14px_-2px_oklch(0.62_0.22_255/0.6)]"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </header>

        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {tab === "overview" && (
            <OverviewTab
              stats={stats}
              patients={active}
              onJump={(t) => setTab(t)}
            />
          )}

          {tab !== "overview" && (
            <>
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-[var(--shadow-card)]">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={tab === "analyse" ? "Search analytics..." : "Search patient, queue number, seat, or symptom..."}
                  className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {tab === "analyse" && (
                <div className="space-y-4">
                  <SectionHeader icon={BarChart3} title="Analyse" subtitle="Trends · patient flow, peak hours & symptom patterns" count={active.length} />
                  <div className="grid gap-4 lg:grid-cols-2">
                    <PatientFlowChart />
                    <PeakHoursChart />
                    <SymptomPatternsChart />
                  </div>
                </div>
              )}

              {tab === "walkin" && (
                <WalkinTab
                  patients={filterBySearch(active.filter((p) => p.mode === "walkin"))}
                  onApply={applyPushback}
                  onWaive={waivePushback}
                />
              )}
              {tab === "bookings" && (
                <BookingsTab
                  patients={filterBySearch(active.filter((p) => p.mode === "booking"))}
                  onApply={applyPushback}
                  onWaive={waivePushback}
                />
              )}
              {tab === "records" && (
                <RecordsTab patients={filterBySearch(patients.filter((p) => p.status === "Completed" || p.status === "Forfeited"))} />
              )}
              {tab === "penalty" && (
                <PenaltyTab
                  patients={filterBySearch(patients.filter((p) => p.status === "Late" || p.pushedBack > 0))}
                  onApply={applyPushback}
                  onWaive={waivePushback}
                />
              )}
            </>
          )}
        </div>

        {showPolicy && <PolicyModal onClose={() => setShowPolicy(false)} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

function OverviewTab({
  stats,
  patients,
  onJump,
}: {
  stats: { total: number; walkin: number; booking: number; high: number; late: number };
  patients: Patient[];
  onJump: (t: TabKey) => void;
}) {
  const byReason = useMemo(() => {
    const counts: Record<ReasonId, number> = { general: 0, followup: 0, vaccine: 0, screening: 0, renewal: 0 };
    for (const p of patients) counts[p.reason]++;
    return counts;
  }, [patients]);

  const bySeverity = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0 };
    for (const p of patients) c[p.severity]++;
    return c;
  }, [patients]);

  const byStatus = useMemo(() => {
    const c: Record<string, number> = { Waiting: 0, "Checked In": 0, "In Consult": 0, Late: 0 };
    for (const p of patients) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [patients]);

  const avgWait = useMemo(() => {
    if (!patients.length) return 0;
    return Math.round(patients.reduce((s, p) => s + p.waitMinutes, 0) / patients.length);
  }, [patients]);

  return (
    <>
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        <Stat label="Active" value={stats.total} icon={Users} onClick={() => onJump("walkin")} />
        <Stat label="Walk-ins" value={stats.walkin} icon={Zap} onClick={() => onJump("walkin")} />
        <Stat label="Bookings" value={stats.booking} icon={CalendarDays} onClick={() => onJump("bookings")} />
        <Stat label="Late" value={stats.late} icon={Clock} tone="warning" onClick={() => onJump("penalty")} />
        <Stat label="Critical" value={stats.high} icon={AlertCircle} tone="warning" />
        <Stat label="Avg wait" value={`${avgWait}m`} icon={TimerReset} />
      </div>

      {/* Unified statistics panel */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <LayoutDashboard className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Live statistics</h2>
            <p className="text-[10px] text-muted-foreground">All metrics derived from the active queue</p>
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <BarBlock
            title="By visit reason"
            subtitle="Active patients per reason"
            rows={(Object.keys(REASON_META) as ReasonId[]).map((r) => ({
              label: REASON_META[r].label,
              value: byReason[r],
              tone: "primary",
            }))}
          />
          <BarBlock
            title="By status"
            subtitle="Where each patient is right now"
            rows={Object.entries(byStatus).map(([k, v]) => ({
              label: k,
              value: v,
              tone: k === "Late" ? "danger" : k === "In Consult" ? "success" : "primary",
            }))}
          />
          <BarBlock
            title="By severity"
            subtitle="Triage breakdown"
            rows={[
              { label: "Critical", value: bySeverity.high, tone: "danger" },
              { label: "Moderate", value: bySeverity.medium, tone: "warn" },
              { label: "Low", value: bySeverity.low, tone: "success" },
            ]}
          />
          <BarBlock
            title="Walk-in vs Booking"
            subtitle="Mode of arrival"
            rows={[
              { label: "Walk-in", value: stats.walkin, tone: "primary" },
              { label: "Booking", value: stats.booking, tone: "success" },
            ]}
          />
        </div>
      </section>

      {/* Quick view */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-foreground">Quick view</h2>
        <p className="text-[11px] text-muted-foreground">Top 5 in current queue.</p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {[...patients]
            .sort((a, b) => {
              if (a.status === "Late" && b.status !== "Late") return -1;
              if (b.status === "Late" && a.status !== "Late") return 1;
              const w = { high: 0, medium: 1, low: 2 };
              return w[a.severity] - w[b.severity];
            })
            .slice(0, 6)
            .map((p) => (
              <PatientCard key={p.id} p={p} compact />
            ))}
        </div>
      </section>

    </>
  );
}

/* ------------------------------------------------------------------ */
/* Trend charts — historical / aggregated mock data                    */
/* ------------------------------------------------------------------ */

const FLOW_DATA = [
  { hour: "8", value: 28 }, { hour: "9", value: 42 }, { hour: "10", value: 64 },
  { hour: "11", value: 92 }, { hour: "12", value: 88 }, { hour: "13", value: 78 },
  { hour: "14", value: 60 }, { hour: "15", value: 52 }, { hour: "16", value: 44 },
  { hour: "17", value: 38 }, { hour: "18", value: 30 }, { hour: "19", value: 22 },
];

function PatientFlowChart() {
  const max = Math.max(...FLOW_DATA.map((d) => d.value));
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <LayoutDashboard className="h-3.5 w-3.5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Patient Flow</h2>
          <p className="text-[10px] text-muted-foreground">Today · hourly check-ins</p>
        </div>
      </div>
      <div className="mt-4 flex h-40 items-end gap-1.5">
        {FLOW_DATA.map((d) => {
          const h = Math.round((d.value / max) * 140);
          const peak = d.value >= max * 0.85;
          const med = d.value >= max * 0.6 && !peak;
          const color = peak
            ? "oklch(0.62 0.24 25)"
            : med
              ? "oklch(0.62 0.22 255)"
              : "oklch(0.75 0.14 250)";
          return (
            <div key={d.hour} className="flex flex-1 flex-col items-center justify-end gap-1 h-full">
              <span className="text-[9px] font-semibold text-foreground">{d.value}</span>
              <div
                className="w-full rounded-t-md shadow-[inset_0_-2px_0_rgba(0,0,0,0.15)] transition-all"
                style={{ height: `${h}px`, backgroundColor: color, minHeight: "4px" }}
                title={`${d.hour}:00 — ${d.value} patients`}
              />
              <span className="text-[9px] font-semibold text-muted-foreground">{d.hour}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const PEAK_DATA = [
  { hour: "8 AM", value: 25 }, { hour: "9 AM", value: 50 }, { hour: "10 AM", value: 88 },
  { hour: "11 AM", value: 95 }, { hour: "12 PM", value: 70 }, { hour: "1 PM", value: 62 },
  { hour: "2 PM", value: 78 }, { hour: "3 PM", value: 58 }, { hour: "4 PM", value: 35 },
  { hour: "5 PM", value: 22 },
];

function PeakHoursChart() {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-warning/15 text-warning-foreground">
          <Clock className="h-3.5 w-3.5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Peak Hours</h2>
          <p className="text-[10px] text-muted-foreground">Average occupancy this week</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {PEAK_DATA.map((d) => {
          const peak = d.value >= 85;
          const high = d.value >= 65 && !peak;
          const color = peak
            ? "linear-gradient(90deg, oklch(0.7 0.2 25), oklch(0.6 0.24 22))"
            : high
              ? "linear-gradient(90deg, oklch(0.68 0.2 270), oklch(0.6 0.22 260))"
              : "linear-gradient(90deg, oklch(0.78 0.12 250), oklch(0.7 0.16 255))";
          return (
            <div key={d.hour} className="flex items-center gap-2.5">
              <span className="w-12 text-[10px] font-semibold text-muted-foreground">{d.hour}</span>
              <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${d.value}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const SYMPTOM_DATA = [
  { name: "Headache", count: 342, change: "+12%", up: true },
  { name: "Fever", count: 256, change: "-5%", up: false },
  { name: "Cough", count: 198, change: "+8%", up: true },
  { name: "Abdominal Pain", count: 145, change: "+3%", up: true },
  { name: "Skin Rash", count: 89, change: "+22%", up: true },
  { name: "Chest Pain", count: 67, change: "-2%", up: false },
];

function SymptomPatternsChart() {
  const max = Math.max(...SYMPTOM_DATA.map((d) => d.count));
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] lg:col-span-2">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
          <HeartPulse className="h-3.5 w-3.5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Symptom Patterns</h2>
          <p className="text-[10px] text-muted-foreground">Top reported symptoms · last 30 days</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {SYMPTOM_DATA.map((s, i) => (
          <div key={s.name}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold text-muted-foreground w-3">{i + 1}</span>
                <span className="text-xs font-bold text-foreground truncate">{s.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold ${s.up ? "text-destructive" : "text-success"}`}>{s.change}</span>
                <span className="text-xs font-bold text-foreground tabular-nums w-10 text-right">{s.count}</span>
              </div>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(s.count / max) * 100}%`,
                  background: s.up
                    ? "linear-gradient(90deg, oklch(0.7 0.2 25), oklch(0.6 0.24 22))"
                    : "linear-gradient(90deg, oklch(0.7 0.18 255), oklch(0.6 0.22 265))",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* BarBlock — reusable horizontal bar chart bound to real data         */
/* ------------------------------------------------------------------ */

function BarBlock({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: { label: string; value: number; tone: "primary" | "success" | "warn" | "danger" }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((s, r) => s + r.value, 0);
  const toneBg: Record<string, string> = {
    primary: "linear-gradient(90deg, oklch(0.7 0.16 255), oklch(0.62 0.2 270))",
    success: "linear-gradient(90deg, oklch(0.74 0.15 165), oklch(0.66 0.14 175))",
    warn: "linear-gradient(90deg, oklch(0.78 0.17 70), oklch(0.72 0.19 50))",
    danger: "linear-gradient(90deg, oklch(0.7 0.2 25), oklch(0.62 0.24 18))",
  };
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground">{title}</h3>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground">total {total}</span>
      </div>
      <div className="mt-2.5 space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-2.5">
            <span className="w-20 shrink-0 truncate text-[10px] font-semibold text-muted-foreground">
              {r.label}
            </span>
            <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(r.value / max) * 100}%`, background: toneBg[r.tone] }}
              />
            </div>
            <span className="w-6 text-right text-[10px] font-bold tabular-nums text-foreground">
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/* Walk-in tab — grouped by reason                                     */
/* ------------------------------------------------------------------ */

function WalkinTab({
  patients,
  onApply,
  onWaive,
}: {
  patients: Patient[];
  onApply: (id: string) => void;
  onWaive: (id: string) => void;
}) {
  const grouped = groupByReason(patients);
  return (
    <div className="space-y-6">
      <SectionHeader icon={Zap} title="Walk-in patients" subtitle="Live queue · grouped by visit reason" count={patients.length} />
      {patients.length === 0 ? (
        <EmptyState message="No walk-in patients in the active queue." />
      ) : (
        (Object.keys(REASON_META) as ReasonId[]).map((r) =>
          grouped[r].length > 0 ? (
            <ReasonGroup key={r} reason={r} patients={grouped[r]} onApply={onApply} onWaive={onWaive} />
          ) : null,
        )
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bookings tab — grouped by reason                                    */
/* ------------------------------------------------------------------ */

function BookingsTab({
  patients,
  onApply,
  onWaive,
}: {
  patients: Patient[];
  onApply: (id: string) => void;
  onWaive: (id: string) => void;
}) {
  const grouped = groupByReason(patients);
  return (
    <div className="space-y-6">
      <SectionHeader icon={CalendarDays} title="Booked appointments" subtitle="Scheduled patients · grouped by visit reason" count={patients.length} />
      {patients.length === 0 ? (
        <EmptyState message="No scheduled bookings." />
      ) : (
        (Object.keys(REASON_META) as ReasonId[]).map((r) =>
          grouped[r].length > 0 ? (
            <ReasonGroup key={r} reason={r} patients={grouped[r]} onApply={onApply} onWaive={onWaive} showBooking />
          ) : null,
        )
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Records — full history                                              */
/* ------------------------------------------------------------------ */

function RecordsTab({ patients }: { patients: Patient[] }) {
  const [reasonFilter, setReasonFilter] = useState<ReasonId | "all">("all");
  const filtered = reasonFilter === "all" ? patients : patients.filter((p) => p.reason === reasonFilter);

  return (
    <div className="space-y-4">
      <SectionHeader icon={FileText} title="Patient medical records" subtitle="All past visits · filterable by visit reason" count={patients.length} />

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <FilterChip active={reasonFilter === "all"} onClick={() => setReasonFilter("all")} label="All" />
        {(Object.keys(REASON_META) as ReasonId[]).map((r) => (
          <FilterChip key={r} active={reasonFilter === r} onClick={() => setReasonFilter(r)} label={REASON_META[r].label} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No records match this filter." />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((p) => {
            const meta = REASON_META[p.reason];
            const Icon = meta.icon;
            return (
              <article key={p.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.tint}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{p.symptoms}</p>
                      </div>
                      <SeverityBadge severity={p.severity} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <span>#{p.number}</span>
                      <span>· {meta.label}</span>
                      <span>· {p.mode === "walkin" ? "Walk-in" : "Booking"}</span>
                      {p.visitedOn && <span>· {p.visitedOn}</span>}
                      <span className="ml-auto rounded-full bg-success/15 px-2 py-0.5 text-success">{p.status}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Penalty tab — pure pushback, no payment                             */
/* ------------------------------------------------------------------ */

function PenaltyTab({
  patients,
  onApply,
  onWaive,
}: {
  patients: Patient[];
  onApply: (id: string) => void;
  onWaive: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <SectionHeader icon={TimerReset} title="Late arrivals" subtitle="Patients past 10-min grace · automatic queue pushback" count={patients.length} />
      <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3.5 text-[11px] leading-relaxed text-warning-foreground">
        <p className="font-bold uppercase tracking-wider">Pushback rule</p>
        <p className="mt-1">
          Within 10 min: grace · 11–20 min: <b>−3 places</b> · 21–30 min: <b>−6 places</b> ·
          31–45 min: <b>−10 places</b> · &gt;45 min: <b>ticket forfeited</b>. Critical patients are exempt.
        </p>
      </div>

      {patients.length === 0 ? (
        <EmptyState message="Nobody is late right now 🎉" />
      ) : (
        <div className="space-y-2.5">
          {patients.map((p) => (
            <PatientCard key={p.id} p={p} onApply={() => onApply(p.id)} onWaive={() => onWaive(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared building blocks                                              */
/* ------------------------------------------------------------------ */

function groupByReason(patients: Patient[]): Record<ReasonId, Patient[]> {
  const out: Record<ReasonId, Patient[]> = { general: [], followup: [], vaccine: [], screening: [], renewal: [] };
  for (const p of patients) out[p.reason].push(p);
  return out;
}

function ReasonGroup({
  reason,
  patients,
  onApply,
  onWaive,
  showBooking,
}: {
  reason: ReasonId;
  patients: Patient[];
  onApply: (id: string) => void;
  onWaive: (id: string) => void;
  showBooking?: boolean;
}) {
  const meta = REASON_META[reason];
  const Icon = meta.icon;
  return (
    <section>
      <div className="mb-2.5 flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.tint}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-[13px] font-bold text-foreground">{meta.label}</h3>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
          {patients.length}
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>
      <div className="space-y-2.5">
        {patients.map((p) => (
          <PatientCard
            key={p.id}
            p={p}
            onApply={() => onApply(p.id)}
            onWaive={() => onWaive(p.id)}
            showBooking={showBooking}
          />
        ))}
      </div>
    </section>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  count,
}: {
  icon: typeof LayoutDashboard;
  title: string;
  subtitle: string;
  count: number;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
        {count} total
      </span>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}

function PolicyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Front Desk Policy</p>
            <h2 className="mt-1 text-lg font-bold">Late Arrival — Queue Pushback</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          When a called patient doesn't arrive within the grace window, their queue position is pushed back automatically.
          No payments are involved. Critical-severity patients are always exempt.
        </p>
        <div className="mt-4 space-y-2">
          <PolicyRow range="0–10 min late" rule="Grace period — keep position" tone="ok" />
          <PolicyRow range="11–20 min" rule="Pushed back 3 positions" tone="warn" />
          <PolicyRow range="21–30 min" rule="Pushed back 6 positions" tone="warn" />
          <PolicyRow range="31–45 min" rule="Pushed back 10 positions" tone="warn" />
          <PolicyRow range=">45 min" rule="Ticket forfeited · must re-register" tone="danger" />
        </div>
        <p className="mt-4 rounded-xl border border-border bg-secondary px-3 py-2.5 text-[11px] text-muted-foreground">
          Senior staff may waive a pushback for valid reasons (transport, caregiver duties, etc.).
        </p>
      </div>
    </div>
  );
}

function PolicyRow({ range, rule, tone }: { range: string; rule: string; tone: "ok" | "warn" | "danger" }) {
  const map = {
    ok: "bg-success/10 text-success border-success/30",
    warn: "bg-warning/10 text-warning-foreground border-warning/40",
    danger: "bg-destructive/10 text-destructive border-destructive/40",
  };
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3 ${map[tone]}`}>
      <div className="flex-1">
        <p className="text-xs font-bold">{range}</p>
        <p className="text-[11px] opacity-80">{rule}</p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone = "default",
  onClick,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
  tone?: "default" | "warning" | "danger";
  onClick?: () => void;
}) {
  const map = {
    default: "text-primary bg-primary/10",
    warning: "text-warning-foreground bg-warning/15",
    danger: "text-destructive bg-destructive/15",
  };
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="rounded-2xl border border-border bg-card p-4 text-left shadow-[var(--shadow-card)] transition-colors enabled:hover:border-primary/40"
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${map[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </button>
  );
}

function PatientCard({
  p,
  onApply,
  onWaive,
  compact,
  showBooking,
}: {
  p: Patient;
  onApply?: () => void;
  onWaive?: () => void;
  compact?: boolean;
  showBooking?: boolean;
}) {
  const isHigh = p.severity === "high";
  const isLate = p.status === "Late";
  const isForfeited = p.status === "Forfeited";
  const rule = calcPushback(p.lateMinutes, p.severity);
  const reason = REASON_META[p.reason];

  return (
    <div
      className={`rounded-2xl border bg-card p-4 transition-all ${
        isForfeited
          ? "border-muted-foreground/40 bg-muted/30 opacity-70"
          : isLate
            ? "border-warning/50 bg-warning/[0.04] shadow-[0_0_0_1px_oklch(0.78_0.16_75/0.25)]"
            : isHigh
              ? "border-destructive/40 bg-destructive/[0.03] shadow-[0_0_0_1px_oklch(0.6_0.24_25/0.15)]"
              : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl text-[11px] font-bold leading-tight ${
            isHigh ? "bg-destructive text-destructive-foreground" : "bg-secondary text-foreground"
          }`}
        >
          {p.number}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.symptoms}</p>
            </div>
            <SeverityBadge severity={p.severity} />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${reason.tint}`}>
              <reason.icon className="h-3 w-3" /> {reason.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
              {p.mode === "walkin" ? <Zap className="h-3 w-3" /> : <CalendarDays className="h-3 w-3" />}
              {p.mode === "walkin" ? "Walk-in" : "Booking"}
            </span>
            {showBooking && p.bookingDate && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {p.bookingDate} · {p.bookingSession}
              </span>
            )}
          </div>

          {!compact && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isLate
                    ? "bg-warning/20 text-warning-foreground"
                    : isForfeited
                      ? "bg-muted text-muted-foreground"
                      : p.status === "Waiting"
                        ? "bg-warning/15 text-warning-foreground"
                        : p.status === "Checked In"
                          ? "bg-primary/10 text-primary"
                          : "bg-success/15 text-success"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {p.status}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <ArmchairIcon className="h-3 w-3" /> Seat {p.seat} · {p.zone}
              </span>
              <span className="ml-auto text-[11px] text-muted-foreground">
                {p.status === "In Consult"
                  ? "Now"
                  : isLate
                    ? `${p.lateMinutes}m LATE`
                    : `${p.waitMinutes}m wait${p.pushedBack > 0 ? ` · −${p.pushedBack}` : ""}`}
              </span>
            </div>
          )}

          {!compact && (isLate || p.pushedBack > 0) && !isForfeited && (
            <div
              className={`mt-3 flex items-center gap-2 rounded-xl border p-2.5 ${
                rule.tone === "danger"
                  ? "border-destructive/40 bg-destructive/10"
                  : rule.tone === "warn"
                    ? "border-warning/40 bg-warning/10"
                    : "border-success/40 bg-success/10"
              }`}
            >
              <AlertTriangle
                className={`h-4 w-4 flex-shrink-0 ${
                  rule.tone === "danger" ? "text-destructive" : rule.tone === "warn" ? "text-warning-foreground" : "text-success"
                }`}
              />
              <div className="flex-1">
                <p className="text-[11px] font-bold">{rule.action}</p>
                {p.pushedBack > 0 && (
                  <p className="text-[10px] text-muted-foreground">Already pushed back {p.pushedBack} positions</p>
                )}
              </div>
              {isLate && p.pushedBack === 0 && onApply && (
                <button
                  onClick={onApply}
                  className="rounded-lg bg-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-background"
                >
                  Apply
                </button>
              )}
              {p.pushedBack > 0 && onWaive && (
                <button
                  onClick={onWaive}
                  className="rounded-lg border border-border bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground"
                >
                  Waive
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
