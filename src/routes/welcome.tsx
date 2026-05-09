import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";

import { useT } from "@/lib/i18n";
import { User, Users, ArrowRight, ShieldCheck, Stethoscope, Activity, Sparkles } from "lucide-react";

export const Route = createFileRoute("/welcome")({
  component: Welcome,
  head: () => ({ meta: [{ title: "Welcome · MyClinIQ" }] }),
});

function Welcome() {
  const t = useT();
  const setMode = useApp((s) => s.setMode);
  const completeOnboarding = useApp((s) => s.completeOnboarding);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<"self" | "guardian" | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    setMode(selected);
    completeOnboarding();
    navigate({ to: user ? "/" : "/auth" });
  };

  return (
    <div className="min-h-screen w-full bg-surface">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col overflow-hidden bg-background">
        {/* DRAMATIC HERO with massive centered logo */}
        <div
          className="relative overflow-hidden px-6 pb-4 pt-6 text-foreground"
          style={{ background: "var(--gradient-onboard)" }}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent/40 blur-3xl" />
          <div className="pointer-events-none absolute right-10 top-1/3 h-40 w-40 rounded-full bg-primary/30 blur-2xl" />

          <div className="relative h-2" />


          <div className="logo-stage relative -mt-2 flex flex-col items-center justify-center pb-0 pt-0">
            <Logo size={280} withWordmark dramatic />
          </div>

          <div className="relative mt-3 flex flex-wrap justify-center gap-2">
            <Pill icon={Stethoscope}>{t("ai_triage")}</Pill>
            <Pill icon={Activity}>{t("smart_queue")}</Pill>
            <Pill icon={Sparkles}>Smart Routing</Pill>
          </div>
        </div>

        <div className="relative flex flex-1 flex-col px-6 pb-10 pt-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            <ShieldCheck className="mr-1 inline h-3 w-3" />
            Step 01 — {t("who_for")}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{t("who_for")}</h2>

          <div className="mt-5 space-y-3">
            <ModeOption
              active={selected === "self"}
              onClick={() => setSelected("self")}
              icon={User}
              title={t("self")}
              tag="Self"
              description={t("self_desc")}
            />
            <ModeOption
              active={selected === "guardian"}
              onClick={() => setSelected("guardian")}
              icon={Users}
              title={t("guardian")}
              tag="Guardian"
              description={t("guardian_desc")}
            />
          </div>

          <button
            disabled={!selected}
            onClick={handleContinue}
            className="btn-glow mt-auto flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
          >
            {t("continue")}
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-foreground">
            Prototype only · Not a medical diagnosis tool
          </p>
          <Link
            to="/admin-login"
            className="mt-3 text-center text-[11px] font-semibold text-primary underline-offset-4 hover:underline"
          >
            Clinic staff? Tap here to log in
          </Link>
        </div>
      </div>
    </div>
  );
}

function Pill({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold">
      <Icon className="h-3 w-3 text-accent" />
      {children}
    </span>
  );
}

function ModeOption({
  active,
  onClick,
  icon: Icon,
  title,
  tag,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof User;
  title: string;
  tag: string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-start gap-4 overflow-hidden rounded-2xl border p-4 text-left transition-all ${
        active
          ? "border-primary/60 bg-card shadow-[0_0_0_1px_oklch(0.55_0.22_265/0.5),0_0_30px_-8px_oklch(0.7_0.13_190/0.5)]"
          : "border-border bg-card hover:border-primary/30"
      }`}
    >
      <div
        className={`relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all ${
          active ? "btn-glow text-primary-foreground" : "bg-secondary text-foreground"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-base font-bold text-foreground">{title}</p>
          <span
            className={`rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-[0.14em] ${
              active ? "bg-accent/25 text-accent" : "bg-muted text-muted-foreground"
            }`}
          >
            {tag}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div
        className={`relative mt-1 h-5 w-5 flex-shrink-0 rounded-full border-2 transition-all ${
          active ? "border-primary bg-primary shadow-[0_0_12px_oklch(0.55_0.22_265/0.7)]" : "border-border"
        }`}
      >
        {active && (
          <svg viewBox="0 0 16 16" className="h-full w-full text-primary-foreground">
            <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </button>
  );
}
