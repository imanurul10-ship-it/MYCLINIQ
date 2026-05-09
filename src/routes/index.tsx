import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { LangToggle } from "@/components/LangToggle";
import { HeroCarousel } from "@/components/HeroCarousel";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import {
  ArrowRight,
  Stethoscope,
  Ticket,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Activity,
  Bell,
  Sparkles,
  TrendingUp,
  Calendar,
  FileCheck2,
  Users,
  GraduationCap,
  BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "MyClinIQ — Intelligent Care for Every Malaysian" },
      { name: "description", content: "AI triage, smart queues, and digital health records for every Malaysian." },
    ],
  }),
});

function Home() {
  const t = useT();
  const queue = useApp((s) => s.queue);
  const mode = useApp((s) => s.mode);
  const { profile } = useAuth();

  const [greet, setGreet] = useState<string | null>(null);
  useEffect(() => {
    const h = new Date().getHours();
    setGreet(h < 12 ? t("good_morning") : h < 18 ? t("good_afternoon") : t("good_evening"));
  }, [t]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <AppShell>
      <header
        className="relative overflow-hidden px-5 pb-5 pt-4"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 12% 0%, oklch(0.40 0.12 264 / 0.28), transparent 70%)," +
            "radial-gradient(ellipse 75% 50% at 88% 5%, oklch(0.45 0.18 18 / 0.22), transparent 70%)," +
            "linear-gradient(180deg, oklch(0.32 0.10 264 / 0.18) 0%, oklch(0.40 0.14 18 / 0.10) 55%, transparent 100%)",
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-12 h-52 w-52 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-14 -top-10 h-48 w-48 rounded-full bg-primary/25 blur-3xl" />

        <div className="relative flex items-center justify-end gap-2">
          <LangToggle compact />
          <Link to="/notifications" className="glass relative flex h-10 w-10 items-center justify-center rounded-full text-foreground/80">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-destructive shadow-[0_0_8px_oklch(0.62_0.25_25/0.9)]" />
          </Link>
        </div>

        <div className="logo-stage relative -mt-2 flex items-center justify-center">
          <Logo size={280} withWordmark dramatic />
        </div>

        <div className="relative mt-4">
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {greet ?? "\u00a0"}{firstName ? `, ${firstName}` : ""}
          </p>
          <h1 className="mt-1 text-[26px] font-bold leading-[1.1] tracking-tight text-primary">
            {t("feeling_today")}
          </h1>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            {mode === "guardian" ? "Guardian mode · active" : "Self mode · active"}
          </p>
        </div>

        {/* Real-photo hero carousel */}
        <div className="relative mt-4">
          <HeroCarousel />
        </div>
      </header>

      <main className="space-y-7 px-5 py-6">
        {queue && (
          <section className="animate-scale-in">
            <SectionTitle accent>Active Queue</SectionTitle>
            <Link
              to="/queue"
              className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-primary/30 bg-card p-4 transition-all hover:border-primary/50"
              style={{ backgroundImage: "linear-gradient(135deg, oklch(0.55 0.22 265 / 0.08), oklch(0.7 0.13 190 / 0.04))" }}
            >
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_8px_currentColor]" />
                  Your number
                </p>
                <p className="mt-1 text-[34px] font-bold leading-none tracking-tight text-foreground">{queue.number}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {queue.patientsAhead} ahead · ~{queue.estimatedMinutes}m
                  {queue.seat && <> · Seat {queue.seat.seat}</>}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-primary" />
            </Link>
          </section>
        )}

        <section>
          <SectionTitle>{t("quick_actions")}</SectionTitle>
          <div className="grid grid-cols-3 gap-2.5">
            <QuickAction to="/ai-chat" icon={Sparkles} label="AI Doctor" tone="accent" />
            <QuickAction to="/visit" icon={Stethoscope} label={t("ai_triage")} />
            <QuickAction to="/queue" icon={Ticket} label={t("smart_queue")} />
            <QuickAction to="/tips" icon={GraduationCap} label={t("library")} />
            <QuickAction to="/certificates" icon={FileCheck2} label="MC" />
            <QuickAction to="/reminders" icon={Bell} label={t("reminders")} tone="accent" />
            <QuickAction to="/emergency" icon={AlertTriangle} label={t("emergency")} tone="danger" />
          </div>
        </section>

        <section>
          <SectionTitle>{t("health_snapshot")}</SectionTitle>
          <div className="glass relative overflow-hidden rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/15 text-success shadow-[var(--shadow-glow-success)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{t("all_systems_normal")}</p>
                <p className="text-xs text-muted-foreground">Last visit: Mar 12 · Mild fever</p>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/50 pt-4">
              <Stat label="Visits" value="04" />
              <Stat label="Avg wait" value="18m" />
              <Stat label="Streak" value="42d" highlight />
            </div>
          </div>
        </section>

        <section>
          <SectionTitle>{t("ai_insight")}</SectionTitle>
          <div
            className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4"
            style={{ backgroundImage: "linear-gradient(135deg, oklch(0.7 0.13 190 / 0.1), oklch(0.55 0.22 265 / 0.04))" }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 shadow-[0_0_18px_oklch(0.7_0.13_190/0.4)]">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Wait times are 22% lower this morning</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Best time to visit nearby clinics is between 9–11 AM today.
                </p>
              </div>
            </div>
            <Link to="/tips" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary hover:text-primary-glow">
              <TrendingUp className="h-3 w-3" /> View library
            </Link>
          </div>
        </section>

        <p className="rounded-xl border border-border/40 bg-card/40 px-3 py-2.5 text-center text-[10px] leading-relaxed text-muted-foreground">
          MyClinIQ Prototype · Not a medical diagnosis tool
        </p>
      </main>
    </AppShell>
  );
}

function SectionTitle({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className={`h-1 w-1 rounded-full ${accent ? "bg-primary shadow-[0_0_6px_currentColor]" : "bg-muted-foreground/40"}`} />
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{children}</h2>
      <span className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-bold tracking-tight ${highlight ? "text-gradient-primary" : "text-foreground"}`}>{value}</div>
      <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  tone = "default",
}: {
  to: string;
  icon: typeof Stethoscope;
  label: string;
  tone?: "default" | "danger" | "accent";
}) {
  const danger = tone === "danger";
  const accent = tone === "accent";
  return (
    <Link
      to={to}
      className={`group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border p-3 transition-all active:scale-[0.97] ${
        danger
          ? "border-destructive/40 bg-card hover:border-destructive/60"
          : accent
            ? "border-accent/50 bg-card hover:border-accent/70"
            : "border-border/60 bg-card hover:border-primary/40"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
          danger
            ? "bg-destructive/15 text-destructive shadow-[0_0_14px_oklch(0.6_0.25_22/0.4)]"
            : accent
              ? "bg-accent/20 text-accent shadow-[0_0_18px_oklch(0.7_0.13_190/0.6)]"
              : "bg-primary/15 text-primary shadow-[0_0_14px_oklch(0.55_0.22_265/0.4)]"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </div>
      <span className={`text-center text-[10px] font-bold uppercase tracking-wider leading-tight ${danger ? "text-destructive" : accent ? "text-accent" : "text-foreground"}`}>
        {label}
      </span>
    </Link>
  );
}
