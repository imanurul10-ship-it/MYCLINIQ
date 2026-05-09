import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { useBookings, SESSION_LABELS, SESSION_TIMES, formatTime12h, seatsLeftFor, inferSession, type BookingSession } from "@/lib/bookings";
import {
  SYMPTOMS,
  evaluateTriage,
  type SymptomId,
  type TriageAnswers,
} from "@/lib/triage";
import { CLINICS, getClinics, recommendClinic } from "@/lib/clinics";
import { useUserLocation } from "@/lib/use-user-location";
import { ClinicCard } from "@/components/ClinicCard";
import { MapView } from "@/components/MapView";
import { SeverityBadge } from "@/components/SeverityBadge";
import { SmartSymptomInput } from "@/components/SmartSymptomInput";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  List,
  Map as MapIcon,
  Phone,
  Baby,
  HeartPulse,
  Info,
  Sparkles,
  Activity,
  Zap,
  CalendarDays,
  Clock,
  CalendarCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";

const stepSchema = z.object({
  step: z.enum(["reason", "timing", "symptoms", "pregnancy", "questions", "reasonQuestions", "result", "clinics", "schedule", "confirmed"]).catch("reason"),
  view: z.enum(["list", "map"]).catch("list"),
  reason: z.enum(["general", "followup", "vaccine", "screening", "renewal"]).optional(),
  timing: z.enum(["now", "later"]).optional(),
});

type StepKey = "reason" | "timing" | "symptoms" | "pregnancy" | "questions" | "reasonQuestions" | "result" | "clinics" | "schedule" | "confirmed";
type ViewKey = "list" | "map";
type ReasonId = "general" | "followup" | "vaccine" | "screening" | "renewal";
type TimingId = "now" | "later";

/** Reasons that use the symptom-driven triage flow. Others get tailored questions. */
const SYMPTOM_REASONS: ReasonId[] = ["general", "followup"];

export const Route = createFileRoute("/visit")({
  validateSearch: stepSchema,
  component: Visit,
  head: () => ({ meta: [{ title: "Visit · MyClinIQ" }] }),
});

type SearchT = { step: StepKey; view: ViewKey; reason?: ReasonId; timing?: TimingId };

function Visit() {
  const { step, view, reason, timing } = Route.useSearch();
  const navigate = useNavigate({ from: "/visit" });
  const symptoms = useApp((s) => s.symptoms);
  const toggleSymptom = useApp((s) => s.toggleSymptom);
  const answers = useApp((s) => s.answers);
  const setAnswers = useApp((s) => s.setAnswers);
  const result = useApp((s) => s.result);
  const setResult = useApp((s) => s.setResult);
  const joinQueue = useApp((s) => s.joinQueue);
  const resetVisit = useApp((s) => s.resetVisit);
  const bodyRegions = useApp((s) => s.bodyRegions);
  const toggleBodyRegion = useApp((s) => s.toggleBodyRegion);
  const painLevel = useApp((s) => s.painLevel);
  const setPainLevel = useApp((s) => s.setPainLevel);

  // Local state for reason-specific questionnaires (vaccine, screening, renewal, mc)
  const [reasonAnswers, setReasonAnswers] = useState<Record<string, string | string[]>>({});
  // Local booking state — date & session selected when timing === "later"
  const [bookingDate, setBookingDate] = useState<string>("");
  const [bookingSession, setBookingSession] = useState<string>("");
  const [bookingTime, setBookingTime] = useState<string>("");
  const [bookedClinic, setBookedClinic] = useState<ReturnType<typeof recommendClinic> | null>(null);
  const addBooking = useBookings((s) => s.add);

  const goto = (s: StepKey) =>
    navigate({ search: (p: SearchT) => ({ ...p, step: s }) });

  const isSymptomFlow = !reason || SYMPTOM_REASONS.includes(reason);
  const isBooking = timing === "later";
  const ORDER: StepKey[] = isSymptomFlow
    ? isBooking
      ? ["reason", "timing", "symptoms", "pregnancy", "questions", "result", "clinics", "schedule", "confirmed"]
      : ["reason", "timing", "symptoms", "pregnancy", "questions", "result", "clinics"]
    : isBooking
      ? ["reason", "timing", "reasonQuestions", "clinics", "schedule", "confirmed"]
      : ["reason", "timing", "reasonQuestions", "clinics"];
  const stepIndex = ORDER.indexOf(step) === -1 ? 0 : ORDER.indexOf(step);
  const totalSteps = ORDER.length;
  const titleMap: Record<StepKey, string> = {
    reason: "Reason for Visit",
    timing: "When to Visit",
    symptoms: "Select Symptoms",
    pregnancy: "Pregnancy Status",
    questions: "Clinical Questions",
    reasonQuestions: reason ? REASON_TITLE[reason as ReasonId] : "Visit Details",
    result: "AI Assessment",
    clinics: "Choose Clinic",
    schedule: "Pick Date & Time",
    confirmed: "Booking Confirmed",
  };

  return (
    <AppShell>
      <header className="glass-strong sticky top-0 z-20 px-5 py-4">
        <div className="flex items-center gap-3">
          {step !== "reason" ? (
            <button
              onClick={() => {
                const i = ORDER.indexOf(step);
                if (i > 0) goto(ORDER[i - 1]);
                else goto("reason");
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <Link
              to="/"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Step {String(stepIndex + 1).padStart(2, "0")} of {String(totalSteps).padStart(2, "0")}
            </p>
            <p className="text-sm font-bold capitalize text-foreground">{titleMap[step as StepKey]}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 overflow-hidden rounded-full transition-colors ${
                i <= stepIndex ? "" : "bg-border/60"
              }`}
              style={
                i <= stepIndex
                  ? {
                      background: "var(--gradient-primary)",
                      boxShadow: "0 0 8px oklch(0.62 0.22 255 / 0.5)",
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </header>

      <main className="px-5 py-6 animate-fade-in" key={step}>
        {step === "reason" && (
          <ReasonStep
            onPick={(r) => {
              setReasonAnswers({});
              navigate({ search: (p: SearchT) => ({ ...p, reason: r, timing: undefined, step: "timing" }) });
            }}
          />
        )}
        {step === "timing" && reason && (
          <TimingStep
            reason={reason}
            value={timing}
            onPick={(t) => {
              const nextStep: StepKey = SYMPTOM_REASONS.includes(reason) ? "symptoms" : "reasonQuestions";
              navigate({ search: (p: SearchT) => ({ ...p, timing: t, step: nextStep }) });
            }}
          />
        )}
        {step === "reasonQuestions" && reason && !SYMPTOM_REASONS.includes(reason) && (
          <ReasonQuestionsStep
            reason={reason as Exclude<ReasonId, "general" | "followup">}
            answers={reasonAnswers}
            onChange={(patch) => setReasonAnswers((cur) => ({ ...cur, ...patch }))}
            onNext={() => {
              // Non-symptom reasons skip triage — default to a low-severity recommendation.
              setResult({
                severity: "low",
                isEmergency: false,
                action: REASON_ACTION[reason as ReasonId],
                description: REASON_DESCRIPTION[reason as ReasonId],
              });
              goto("clinics");
            }}
          />
        )}
        {step === "symptoms" && (
          <SymptomStep
            symptoms={symptoms}
            onToggle={toggleSymptom}
            onNext={() => goto("pregnancy")}
            onReset={resetVisit}
            bodyRegions={bodyRegions}
            onToggleRegion={toggleBodyRegion}
            pain={painLevel}
            setPain={setPainLevel}
          />
        )}
        {step === "pregnancy" && (
          <PregnancyStep
            answers={answers}
            onChange={setAnswers}
            onNext={() => goto("questions")}
          />
        )}
        {step === "questions" && (
          <QuestionStep
            answers={answers}
            symptoms={symptoms}
            onChange={setAnswers}
            onNext={() => {
              const r = evaluateTriage(symptoms, answers);
              setResult(r);
              goto("result");
            }}
          />
        )}
        {step === "result" && result && (
          <ResultStep result={result} onContinue={() => goto("clinics")} />
        )}
        {step === "clinics" && (
          <ClinicsStep
            view={view}
            setView={(v) =>
              navigate({ search: (p: SearchT) => ({ ...p, view: v }) })
            }
            severity={result?.severity ?? "low"}
            booking={isBooking}
            onJoin={(c) => {
              if (isBooking) {
                setBookedClinic(c);
                goto("schedule");
              } else {
                joinQueue(c);
                navigate({ to: "/queue" });
              }
            }}
          />
        )}
        {step === "schedule" && bookedClinic && (
          <ScheduleStep
            clinic={bookedClinic}
            date={bookingDate}
            session={bookingSession}
            time={bookingTime}
            onChangeDate={setBookingDate}
            onChangeSession={setBookingSession}
            onChangeTime={setBookingTime}
            onConfirm={() => {
              if (bookedClinic && bookingDate && bookingSession && bookingTime) {
                addBooking({
                  clinic: bookedClinic,
                  date: bookingDate,
                  session: bookingSession as "morning" | "afternoon" | "evening",
                  time: bookingTime,
                  reason: reason,
                });
              }
              goto("confirmed");
            }}
          />
        )}
        {step === "schedule" && !bookedClinic && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">No clinic selected. Please go back and choose one.</p>
            <button
              onClick={() => goto("clinics")}
              className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-primary-foreground"
            >
              Choose Clinic
            </button>
          </div>
        )}
        {step === "confirmed" && bookedClinic && (
          <ConfirmedStep
            clinic={bookedClinic}
            date={bookingDate}
            session={bookingSession}
            time={bookingTime}
            onDone={() => {
              resetVisit();
              setBookedClinic(null);
              setBookingDate("");
              setBookingSession("");
              setBookingTime("");
              navigate({ to: "/" });
            }}
          />
        )}
      </main>
    </AppShell>
  );
}

function SymptomStep({
  symptoms,
  onToggle,
  onNext,
  onReset,
  bodyRegions,
  onToggleRegion,
  pain,
  setPain,
}: {
  symptoms: SymptomId[];
  onToggle: (id: SymptomId) => void;
  onNext: () => void;
  onReset: () => void;
  bodyRegions: import("@/components/SmartSymptomInput").BodyRegion[];
  onToggleRegion: (r: import("@/components/SmartSymptomInput").BodyRegion) => void;
  pain: number;
  setPain: (n: number) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Pre-visit questionnaire</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Tap the 2D human body where it hurts, zoom if needed, set your pain level, and pick matching symptoms below.
        </p>
        <Link
          to="/ai-chat"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent hover:bg-accent/20"
        >
          <Sparkles className="h-3 w-3" /> Prefer to chat? Open AI Doctor
        </Link>
      </div>

      <SmartSymptomInput
        selected={bodyRegions}
        onToggleRegion={onToggleRegion}
        pain={pain}
        setPain={setPain}
      />

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Common symptoms · tap to add</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {SYMPTOMS.map((s) => {
          const active = symptoms.includes(s.id);
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => onToggle(s.id)}
              className={`group relative flex flex-col gap-2 overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                active
                  ? "border-primary/60 bg-card shadow-[0_0_0_1px_oklch(0.62_0.22_255/0.4),0_0_24px_-8px_oklch(0.55_0.22_285/0.5)]"
                  : "border-border/60 bg-card hover:border-primary/30"
              }`}
              style={
                active
                  ? {
                      backgroundImage:
                        "linear-gradient(135deg, oklch(0.62 0.2 252 / 0.1), oklch(0.55 0.22 290 / 0.04))",
                    }
                  : undefined
              }
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  active
                    ? "bg-primary/20 text-primary shadow-[0_0_14px_oklch(0.62_0.22_255/0.4)]"
                    : "bg-secondary text-muted-foreground group-hover:text-primary"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.hint}</p>
              </div>
              {active && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_10px_oklch(0.62_0.22_255/0.7)]">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onReset}
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Reset
        </button>
        <button
          disabled={symptoms.length === 0 && bodyRegions.length === 0 && pain === 0}
          onClick={onNext}
          className="btn-glow flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-primary-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function QuestionStep({
  answers,
  symptoms,
  onChange,
  onNext,
}: {
  answers: TriageAnswers;
  symptoms: SymptomId[];
  onChange: (a: TriageAnswers) => void;
  onNext: () => void;
}) {
  const isPregnant = answers.pregnancy === "pregnant";
  const showTemp = symptoms.includes("fever");
  const showBreathing =
    symptoms.includes("breathing") || symptoms.includes("chest_pain") || symptoms.includes("cough");
  const showPain =
    symptoms.includes("headache") || symptoms.includes("chest_pain") || symptoms.includes("abdominal");

  // Required fields
  const required: Array<keyof TriageAnswers> = [
    "age",
    "durationDays",
    "symptomTrend",
    "conditions",
    "appetite",
    "hydration",
    "sleep",
    "allergies",
  ];
  if (showTemp) required.push("temperature");
  if (showBreathing) required.push("breathing");
  if (showPain) required.push("painIntensity");
  if (isPregnant) required.push("trimester", "medications");

  const ok = required.every((k) => answers[k]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Clinical questions</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Detailed answers help our AI calibrate severity precisely.
        </p>
      </div>

      <Section title="About you">
        <Question
          label="Age range"
          value={answers.age}
          options={[
            { v: "under_12", l: "< 12" },
            { v: "12_17", l: "12–17" },
            { v: "18_39", l: "18–39" },
            { v: "40_64", l: "40–64" },
            { v: "65_plus", l: "65+" },
          ]}
          onChange={(v) => onChange({ age: v as TriageAnswers["age"] })}
          cols={3}
        />
        <Question
          label="Existing medical conditions"
          value={answers.conditions}
          options={[
            { v: "none", l: "None" },
            { v: "diabetes", l: "Diabetes" },
            { v: "hypertension", l: "Hypertension" },
            { v: "heart", l: "Heart disease" },
            { v: "asthma", l: "Asthma" },
            { v: "other", l: "Other" },
          ]}
          onChange={(v) => onChange({ conditions: v as TriageAnswers["conditions"] })}
        />
        <Question
          label="Known allergies"
          value={answers.allergies}
          options={[
            { v: "none", l: "None" },
            { v: "drug", l: "Drug" },
            { v: "food", l: "Food" },
            { v: "environmental", l: "Environmental" },
          ]}
          onChange={(v) => onChange({ allergies: v as TriageAnswers["allergies"] })}
        />
      </Section>

      <Section title="Current symptoms">
        <Question
          label="How many days have you had symptoms?"
          value={answers.durationDays}
          options={[
            { v: "less_1", l: "< 1 day" },
            { v: "1_3", l: "1–3 days" },
            { v: "3_7", l: "3–7 days" },
            { v: "more_7", l: "> 7 days" },
          ]}
          onChange={(v) => onChange({ durationDays: v as TriageAnswers["durationDays"] })}
        />
        <Question
          label="Are symptoms improving or worsening?"
          value={answers.symptomTrend}
          options={[
            { v: "improving", l: "Improving" },
            { v: "stable", l: "Stable" },
            { v: "worsening", l: "Worsening" },
          ]}
          onChange={(v) => onChange({ symptomTrend: v as TriageAnswers["symptomTrend"] })}
          cols={3}
        />
        {showTemp && (
          <Question
            label="Temperature range"
            value={answers.temperature}
            options={[
              { v: "normal", l: "Normal (<37.5°)" },
              { v: "mild", l: "Mild (37.5–38°)" },
              { v: "high", l: "High (38–39°)" },
              { v: "very_high", l: "Very high (>39°)" },
            ]}
            onChange={(v) => onChange({ temperature: v as TriageAnswers["temperature"] })}
          />
        )}
        {showBreathing && (
          <Question
            label="Breathing difficulty"
            value={answers.breathing}
            options={[
              { v: "none", l: "None" },
              { v: "mild", l: "Mild shortness" },
              { v: "severe", l: "Severe / Gasping" },
            ]}
            onChange={(v) => onChange({ breathing: v as TriageAnswers["breathing"] })}
            cols={3}
          />
        )}
        {showPain && (
          <Question
            label="Pain intensity (0–10)"
            value={answers.painIntensity}
            options={[
              { v: "mild", l: "Mild (1–3)" },
              { v: "moderate", l: "Moderate (4–6)" },
              { v: "severe", l: "Severe (7–10)" },
            ]}
            onChange={(v) => onChange({ painIntensity: v as TriageAnswers["painIntensity"] })}
            cols={3}
          />
        )}
      </Section>

      <Section title="General wellbeing">
        <Question
          label="Appetite in the last 24h"
          value={answers.appetite}
          options={[
            { v: "normal", l: "Normal" },
            { v: "reduced", l: "Reduced" },
            { v: "none", l: "None" },
          ]}
          onChange={(v) => onChange({ appetite: v as TriageAnswers["appetite"] })}
          cols={3}
        />
        <Question
          label="Hydration / fluid intake"
          value={answers.hydration}
          options={[
            { v: "good", l: "Good" },
            { v: "low", l: "Low" },
            { v: "very_low", l: "Very low" },
          ]}
          onChange={(v) => onChange({ hydration: v as TriageAnswers["hydration"] })}
          cols={3}
        />
        <Question
          label="Sleep quality"
          value={answers.sleep}
          options={[
            { v: "normal", l: "Normal" },
            { v: "poor", l: "Poor" },
            { v: "insomnia", l: "Insomnia" },
          ]}
          onChange={(v) => onChange({ sleep: v as TriageAnswers["sleep"] })}
          cols={3}
        />
      </Section>

      {isPregnant && (
        <Section title="Pregnancy details">
          <div
            className="rounded-xl border border-primary/30 px-3 py-2.5 text-[11px] font-medium text-primary"
            style={{
              backgroundImage:
                "linear-gradient(135deg, oklch(0.62 0.2 252 / 0.1), oklch(0.55 0.22 290 / 0.04))",
            }}
          >
            Pregnancy-safe questions added — care will be tailored.
          </div>
          <Question
            label="Which trimester are you in?"
            value={answers.trimester}
            options={[
              { v: "first", l: "1st (0–13 wk)" },
              { v: "second", l: "2nd (14–27 wk)" },
              { v: "third", l: "3rd (28+ wk)" },
            ]}
            onChange={(v) => onChange({ trimester: v as TriageAnswers["trimester"] })}
            cols={3}
          />
          <Question
            label="Currently taking prenatal medication?"
            value={answers.medications}
            options={[
              { v: "yes", l: "Yes" },
              { v: "no", l: "No" },
            ]}
            onChange={(v) => onChange({ medications: v as TriageAnswers["medications"] })}
          />
        </Section>
      )}

      <button
        disabled={!ok}
        onClick={onNext}
        className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-primary-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
      >
        Generate Assessment <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3.5">
      <div className="flex items-center gap-2">
        <span className="h-1 w-1 rounded-full bg-primary shadow-[0_0_6px_currentColor]" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
        <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>
      {children}
    </div>
  );
}

function Question({
  label,
  value,
  options,
  onChange,
  cols = 2,
}: {
  label: string;
  value: string | undefined;
  options: { v: string; l: string }[];
  onChange: (v: string) => void;
  cols?: 2 | 3;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
      <div className={`grid gap-2 ${cols === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {options.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              onClick={() => onChange(o.v)}
              className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                active
                  ? "border-primary/60 bg-primary/15 text-primary shadow-[0_0_14px_-2px_oklch(0.62_0.22_255/0.5)]"
                  : "border-border/60 bg-card text-foreground hover:border-primary/40"
              }`}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultStep({
  result,
  onContinue,
}: {
  result: NonNullable<ReturnType<typeof useApp.getState>["result"]>;
  onContinue: () => void;
}) {
  if (result.isEmergency) {
    return (
      <div
        className="-mx-5 -my-6 flex min-h-[80vh] flex-col items-center justify-center px-6 py-10 text-destructive-foreground"
        style={{ background: "var(--gradient-emergency)" }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -top-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-destructive blur-3xl" />
        </div>
        <div className="relative">
          <div className="animate-pulse-emergency mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive-foreground/15 backdrop-blur">
            <AlertTriangle className="h-12 w-12" strokeWidth={2.4} />
          </div>
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.3em] opacity-90">Critical alert</p>
          <h2 className="mt-2 text-center text-3xl font-bold leading-tight">Seek Immediate
            <br />Medical Attention</h2>
          <p className="mt-4 max-w-xs text-center text-sm leading-relaxed opacity-90">{result.description}</p>
          <a
            href="tel:999"
            className="mt-7 flex items-center justify-center gap-2 rounded-full bg-destructive-foreground px-7 py-3.5 text-sm font-bold text-destructive shadow-[0_8px_30px_-6px_oklch(0_0_0/0.5)]"
          >
            <Phone className="h-4 w-4" /> Call 999 Emergency
          </a>
          <button
            onClick={onContinue}
            className="mt-3 flex w-full items-center justify-center rounded-full border border-destructive-foreground/40 px-5 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            Show nearest emergency clinic
          </button>
        </div>
      </div>
    );
  }

  const sevAccent =
    result.severity === "high"
      ? { bg: "oklch(0.62 0.25 25 / 0.1)", border: "oklch(0.62 0.25 25 / 0.4)", glow: "oklch(0.62 0.25 25 / 0.4)" }
      : result.severity === "medium"
        ? { bg: "oklch(0.78 0.17 75 / 0.1)", border: "oklch(0.78 0.17 75 / 0.4)", glow: "oklch(0.78 0.17 75 / 0.35)" }
        : { bg: "oklch(0.7 0.18 155 / 0.1)", border: "oklch(0.7 0.18 155 / 0.4)", glow: "oklch(0.7 0.18 155 / 0.35)" };

  return (
    <div className="space-y-5 animate-scale-in">
      <div
        className="relative overflow-hidden rounded-2xl border p-5"
        style={{
          background: `linear-gradient(135deg, ${sevAccent.bg}, var(--card))`,
          borderColor: sevAccent.border,
          boxShadow: `0 0 30px -8px ${sevAccent.glow}`,
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${sevAccent.border}, transparent)` }}
        />
        <SeverityBadge severity={result.severity} />
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">{result.action}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{result.description}</p>
      </div>
      <div className="glass rounded-2xl p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Recommended next steps</p>
        <ul className="mt-3 space-y-2 text-sm text-foreground">
          <li className="flex gap-2.5"><Check className="h-4 w-4 mt-0.5 text-primary" /> Find a nearby clinic</li>
          <li className="flex gap-2.5"><Check className="h-4 w-4 mt-0.5 text-primary" /> Join the queue remotely</li>
          <li className="flex gap-2.5"><Check className="h-4 w-4 mt-0.5 text-primary" /> Arrive when it's almost your turn</li>
        </ul>
      </div>
      <button
        onClick={onContinue}
        className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-primary-foreground"
      >
        Find Nearby Clinics <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ClinicsStep({
  view,
  setView,
  severity,
  booking,
  onJoin,
}: {
  view: "list" | "map";
  setView: (v: "list" | "map") => void;
  severity: "low" | "medium" | "high";
  booking?: boolean;
  onJoin: (c: ReturnType<typeof recommendClinic>) => void;
}) {
  // Use real user GPS location to rank clinics by true distance
  const { loc: userLoc } = useUserLocation();
  const nearby = useMemo(() => getClinics(userLoc).slice(0, 30), [userLoc]);
  const recommended = useMemo(() => recommendClinic(nearby, severity), [nearby, severity]);
  const others = nearby.filter((c) => c.id !== recommended.id);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Nearby Clinics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {booking ? "Pick a clinic to book your appointment" : "Optimised for your location & severity"}
        </p>
      </div>

      <div className="inline-flex rounded-xl border border-border bg-card p-1">
        <button
          onClick={() => setView("list")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
            view === "list" ? "btn-glow text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <List className="h-3.5 w-3.5" /> List
        </button>
        <button
          onClick={() => setView("map")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
            view === "map" ? "btn-glow text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MapIcon className="h-3.5 w-3.5" /> Map
        </button>
      </div>

      {view === "map" ? (
        <MapView clinics={nearby} recommendedId={recommended.id} onSelect={onJoin} />
      ) : (
        <div className="space-y-4 pt-1">
          <ClinicCard
            clinic={recommended}
            recommended
            emergencyHighlight={severity === "high" && recommended.emergency}
            onSelect={onJoin}
          />
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Other options</p>
            {others.map((c) => (
              <ClinicCard
                key={c.id}
                clinic={c}
                emergencyHighlight={severity === "high" && c.emergency}
                onSelect={onJoin}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PregnancyStep({
  answers,
  onChange,
  onNext,
}: {
  answers: TriageAnswers;
  onChange: (a: TriageAnswers) => void;
  onNext: () => void;
}) {
  const value = answers.pregnancy;
  const options: { v: NonNullable<TriageAnswers["pregnancy"]>; l: string; d: string; icon: typeof Baby }[] = [
    { v: "pregnant", l: "Yes, I'm pregnant", d: "We'll ask pregnancy-safe questions", icon: Baby },
    { v: "not_pregnant", l: "No", d: "Standard triage flow", icon: HeartPulse },
    { v: "not_applicable", l: "Not applicable", d: "Prefer not to say / N/A", icon: Info },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Are you currently pregnant?</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This helps us tailor safe, accurate questions for your assessment.
        </p>
      </div>
      <div className="space-y-2.5">
        {options.map((o) => {
          const Icon = o.icon;
          const active = value === o.v;
          return (
            <button
              key={o.v}
              onClick={() => onChange({ pregnancy: o.v })}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                active
                  ? "border-primary/60 bg-card shadow-[0_0_0_1px_oklch(0.62_0.22_255/0.4),0_0_24px_-8px_oklch(0.55_0.22_285/0.5)]"
                  : "border-border/60 bg-card hover:border-primary/30"
              }`}
              style={
                active
                  ? {
                      backgroundImage:
                        "linear-gradient(135deg, oklch(0.62 0.2 252 / 0.08), oklch(0.55 0.22 290 / 0.04))",
                    }
                  : undefined
              }
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  active
                    ? "bg-primary/20 text-primary shadow-[0_0_14px_oklch(0.62_0.22_255/0.4)]"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${active ? "text-foreground" : "text-foreground"}`}>{o.l}</p>
                <p className="text-xs text-muted-foreground">{o.d}</p>
              </div>
              {active && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_10px_oklch(0.62_0.22_255/0.7)]">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="rounded-xl border border-border/60 bg-card/60 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        Your answer is private and used only to refine the on-device triage logic.
      </div>
      <button
        disabled={!value}
        onClick={onNext}
        className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-primary-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
      >
        Continue <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ReasonStep({
  onPick,
}: {
  onPick: (r: "general" | "followup" | "vaccine" | "screening" | "renewal") => void;
}) {
  const reasons: Array<{
    id: "general" | "followup" | "vaccine" | "screening" | "renewal";
    title: string;
    desc: string;
    icon: typeof HeartPulse;
    accent: string;
  }> = [
    { id: "general", title: "General Consultation", desc: "New symptoms, illness, or general health concern", icon: HeartPulse, accent: "from-primary/20 to-accent/10" },
    { id: "followup", title: "Follow-up Visit", desc: "Review previous treatment or test results", icon: Check, accent: "from-accent/20 to-primary/10" },
    { id: "vaccine", title: "Vaccination", desc: "Routine, travel or seasonal vaccines", icon: Sparkles, accent: "from-primary/20 to-primary/5" },
    { id: "screening", title: "Health Screening", desc: "Blood test, BP, cholesterol, full body check", icon: Activity, accent: "from-accent/20 to-accent/5" },
    { id: "renewal", title: "Medication Renewal", desc: "Refill an existing prescription", icon: List, accent: "from-primary/15 to-accent/10" },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Why are you visiting today?</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choose a reason — we'll tailor the questions and the booking flow.
        </p>
      </div>
      <div className="grid gap-3">
        {reasons.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              onClick={() => onPick(r.id)}
              className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br ${r.accent} p-4 text-left transition-all hover:border-primary/50 hover:shadow-[0_0_24px_-8px_oklch(0.62_0.22_255/0.5)]`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card/80 text-primary shadow-inner">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{r.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{r.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Reason-specific questionnaires (vaccine, screening, renewal, mc)
// ============================================================

const REASON_TITLE: Record<ReasonId, string> = {
  general: "Reason for Visit",
  followup: "Reason for Visit",
  vaccine: "Vaccination Details",
  screening: "Health Screening",
  renewal: "Medication Renewal",
};

const REASON_ACTION: Record<ReasonId, string> = {
  general: "Visit Clinic",
  followup: "Visit Clinic",
  vaccine: "Book Vaccination Appointment",
  screening: "Book Health Screening",
  renewal: "Book Medication Renewal",
};

const REASON_DESCRIPTION: Record<ReasonId, string> = {
  general: "Schedule a visit with a clinic.",
  followup: "Schedule a follow-up visit.",
  vaccine: "We'll route you to a clinic offering the vaccine you need. Bring your IC and any previous vaccination records.",
  screening: "We'll match you to a clinic that runs the screening package you selected. Fasting may be required for blood tests.",
  renewal: "Bring your existing prescription or medication packaging. A doctor will review before renewing.",
};

type ReasonField =
  | { id: string; label: string; type: "single"; options: { v: string; l: string }[]; cols?: 2 | 3; required?: boolean }
  | { id: string; label: string; type: "multi"; options: { v: string; l: string }[]; cols?: 2 | 3; required?: boolean }
  | { id: string; label: string; type: "text"; placeholder?: string; required?: boolean };

const REASON_FIELDS: Record<Exclude<ReasonId, "general" | "followup">, ReasonField[]> = {
  vaccine: [
    {
      id: "vaccineType",
      label: "Which vaccine do you need?",
      type: "single",
      required: true,
      options: [
        { v: "covid", l: "COVID-19 booster" },
        { v: "flu", l: "Influenza (flu)" },
        { v: "hpv", l: "HPV" },
        { v: "hepb", l: "Hepatitis B" },
        { v: "tetanus", l: "Tetanus" },
        { v: "travel", l: "Travel vaccine" },
        { v: "child", l: "Child immunisation" },
        { v: "other", l: "Other" },
      ],
    },
    {
      id: "vaccineFor",
      label: "Who is the vaccine for?",
      type: "single",
      required: true,
      cols: 3,
      options: [
        { v: "self", l: "Myself" },
        { v: "child", l: "My child" },
        { v: "elderly", l: "Elderly parent" },
      ],
    },
    {
      id: "pastVaccinated",
      label: "Have you received this vaccine before?",
      type: "single",
      required: true,
      cols: 3,
      options: [
        { v: "yes", l: "Yes" },
        { v: "no", l: "No" },
        { v: "unsure", l: "Not sure" },
      ],
    },
    {
      id: "lastDose",
      label: "When was your last dose (if any)?",
      type: "single",
      options: [
        { v: "never", l: "Never had it" },
        { v: "lt6m", l: "< 6 months ago" },
        { v: "6_12m", l: "6–12 months ago" },
        { v: "1_5y", l: "1–5 years ago" },
        { v: "gt5y", l: "> 5 years ago" },
      ],
    },
    {
      id: "allergyReaction",
      label: "Any past allergic reaction to a vaccine?",
      type: "single",
      required: true,
      cols: 3,
      options: [
        { v: "no", l: "No" },
        { v: "mild", l: "Mild" },
        { v: "severe", l: "Severe" },
      ],
    },
    {
      id: "currentlyUnwell",
      label: "Are you currently unwell (fever, infection)?",
      type: "single",
      required: true,
      cols: 2,
      options: [
        { v: "no", l: "No, I'm well" },
        { v: "yes", l: "Yes" },
      ],
    },
  ],
  screening: [
    {
      id: "screeningPackage",
      label: "Which screening do you want?",
      type: "multi",
      required: true,
      options: [
        { v: "blood", l: "Blood test (FBC)" },
        { v: "bp", l: "Blood pressure" },
        { v: "cholesterol", l: "Cholesterol / lipids" },
        { v: "diabetes", l: "Diabetes (HbA1c)" },
        { v: "fullbody", l: "Full body check" },
        { v: "ecg", l: "ECG / heart" },
        { v: "cancer", l: "Cancer screening" },
        { v: "std", l: "STD screening" },
      ],
    },
    {
      id: "lastScreening",
      label: "When was your last health screening?",
      type: "single",
      required: true,
      options: [
        { v: "never", l: "Never" },
        { v: "lt1y", l: "< 1 year ago" },
        { v: "1_3y", l: "1–3 years ago" },
        { v: "gt3y", l: "> 3 years ago" },
      ],
    },
    {
      id: "fastingOk",
      label: "Can you fast 8–12 hours before the test?",
      type: "single",
      required: true,
      cols: 3,
      options: [
        { v: "yes", l: "Yes" },
        { v: "no", l: "No" },
        { v: "unsure", l: "Need advice" },
      ],
    },
    {
      id: "familyHistory",
      label: "Any relevant family history?",
      type: "multi",
      options: [
        { v: "diabetes", l: "Diabetes" },
        { v: "hypertension", l: "Hypertension" },
        { v: "heart", l: "Heart disease" },
        { v: "cancer", l: "Cancer" },
        { v: "stroke", l: "Stroke" },
        { v: "none", l: "None" },
      ],
    },
    {
      id: "lifestyle",
      label: "Lifestyle factors (select all that apply)",
      type: "multi",
      options: [
        { v: "smoke", l: "Smoker" },
        { v: "alcohol", l: "Drink alcohol" },
        { v: "sedentary", l: "Mostly sedentary" },
        { v: "active", l: "Exercise regularly" },
        { v: "none", l: "None" },
      ],
    },
  ],
  renewal: [
    {
      id: "medName",
      label: "Name of medication to renew",
      type: "text",
      required: true,
      placeholder: "e.g. Metformin 500mg",
    },
    {
      id: "medCondition",
      label: "What condition is it for?",
      type: "single",
      required: true,
      options: [
        { v: "diabetes", l: "Diabetes" },
        { v: "hypertension", l: "Hypertension" },
        { v: "cholesterol", l: "Cholesterol" },
        { v: "asthma", l: "Asthma" },
        { v: "thyroid", l: "Thyroid" },
        { v: "mental", l: "Mental health" },
        { v: "other", l: "Other" },
      ],
    },
    {
      id: "lastRefill",
      label: "When did you last refill it?",
      type: "single",
      required: true,
      options: [
        { v: "lt1m", l: "< 1 month ago" },
        { v: "1_3m", l: "1–3 months ago" },
        { v: "3_6m", l: "3–6 months ago" },
        { v: "gt6m", l: "> 6 months ago" },
      ],
    },
    {
      id: "doseChange",
      label: "Any changes in your symptoms or dosage?",
      type: "single",
      required: true,
      cols: 3,
      options: [
        { v: "no", l: "No, same as before" },
        { v: "better", l: "Feeling better" },
        { v: "worse", l: "Worse / side effects" },
      ],
    },
    {
      id: "stockLeft",
      label: "How many days of medication left?",
      type: "single",
      required: true,
      cols: 3,
      options: [
        { v: "0", l: "Run out" },
        { v: "lt7", l: "< 7 days" },
        { v: "gt7", l: "> 7 days" },
      ],
    },
    {
      id: "sideEffects",
      label: "Any side effects to mention?",
      type: "text",
      placeholder: "Optional — e.g. dizziness, nausea",
    },
  ],
};

function ReasonQuestionsStep({
  reason,
  answers,
  onChange,
  onNext,
}: {
  reason: Exclude<ReasonId, "general" | "followup">;
  answers: Record<string, string | string[]>;
  onChange: (patch: Record<string, string | string[]>) => void;
  onNext: () => void;
}) {
  const fields = REASON_FIELDS[reason];
  const ok = fields.every((f) => {
    if (!f.required) return true;
    const val = answers[f.id];
    if (f.type === "multi") return Array.isArray(val) && val.length > 0;
    return typeof val === "string" && val.trim().length > 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{REASON_TITLE[reason]}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{REASON_DESCRIPTION[reason]}</p>
      </div>

      <Section title="Tell us a bit more">
        {fields.map((f) => {
          if (f.type === "text") {
            return (
              <div key={f.id}>
                <p className="mb-2 text-sm font-semibold text-foreground">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </p>
                <input
                  type="text"
                  value={(answers[f.id] as string) ?? ""}
                  onChange={(e) => onChange({ [f.id]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full rounded-xl border border-border/60 bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            );
          }
          if (f.type === "multi") {
            const selected = (answers[f.id] as string[]) ?? [];
            const cols = f.cols ?? 2;
            return (
              <div key={f.id}>
                <p className="mb-2 text-sm font-semibold text-foreground">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </p>
                <div className={`grid gap-2 ${cols === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                  {f.options.map((o) => {
                    const active = selected.includes(o.v);
                    return (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => {
                          const next = active ? selected.filter((x) => x !== o.v) : [...selected, o.v];
                          onChange({ [f.id]: next });
                        }}
                        className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                          active
                            ? "border-primary/60 bg-primary/15 text-primary shadow-[0_0_14px_-2px_oklch(0.62_0.22_255/0.5)]"
                            : "border-border/60 bg-card text-foreground hover:border-primary/40"
                        }`}
                      >
                        {o.l}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }
          // single
          return (
            <Question
              key={f.id}
              label={`${f.label}${f.required ? " *" : ""}`}
              value={answers[f.id] as string | undefined}
              options={f.options}
              onChange={(v) => onChange({ [f.id]: v })}
              cols={f.cols}
            />
          );
        })}
      </Section>

      <button
        disabled={!ok}
        onClick={onNext}
        className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-primary-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
      >
        Find Nearby Clinics <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ============================================================
// Timing step — Now (live queue) vs Later (book appointment)
// ============================================================

function TimingStep({
  reason,
  value,
  onPick,
}: {
  reason: ReasonId;
  value: TimingId | undefined;
  onPick: (t: TimingId) => void;
}) {
  const options: { v: TimingId; title: string; desc: string; icon: typeof Zap; accent: string }[] = [
    {
      v: "now",
      title: "Visit now",
      desc: "Join the live queue at a nearby clinic and head over today.",
      icon: Zap,
      accent: "from-primary/25 to-accent/10",
    },
    {
      v: "later",
      title: "Book for later",
      desc: "Pick a date and session — we'll reserve your slot.",
      icon: CalendarDays,
      accent: "from-accent/25 to-primary/10",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{REASON_TITLE[reason]}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">When would you like to visit?</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choose to walk in now or schedule an appointment for later.
        </p>
      </div>
      <div className="grid gap-3">
        {options.map((o) => {
          const Icon = o.icon;
          const active = value === o.v;
          return (
            <button
              key={o.v}
              onClick={() => onPick(o.v)}
              className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-gradient-to-br ${o.accent} p-4 text-left transition-all ${
                active
                  ? "border-primary/60 shadow-[0_0_24px_-8px_oklch(0.62_0.22_255/0.6)]"
                  : "border-border/60 hover:border-primary/50"
              }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card/80 text-primary shadow-inner">
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{o.title}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{o.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Schedule step — pick date + session for booked appointments
// ============================================================

function getNextDays(n: number) {
  const out: { iso: string; weekday: string; day: string; month: string }[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
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
}

const SESSIONS: { v: string; l: string; sub: string; icon: typeof Clock }[] = [
  { v: "morning", l: "Morning", sub: "9:00 AM – 12:00 PM", icon: Clock },
  { v: "afternoon", l: "Afternoon", sub: "1:00 PM – 4:00 PM", icon: Clock },
  { v: "evening", l: "Evening", sub: "5:00 PM – 8:00 PM", icon: Clock },
];

function ScheduleStep({
  clinic,
  date,
  session,
  time,
  onChangeDate,
  onChangeSession,
  onChangeTime,
  onConfirm,
}: {
  clinic: ReturnType<typeof recommendClinic>;
  date: string;
  session: string;
  time: string;
  onChangeDate: (d: string) => void;
  onChangeSession: (s: string) => void;
  onChangeTime: (t: string) => void;
  onConfirm: () => void;
}) {
  const days = useMemo(() => getNextDays(14), []);
  const sessionKey = (session || "morning") as BookingSession;
  const slots = SESSION_TIMES[sessionKey] ?? [];
  const ok = date && session && time;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Pick a date & time</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Booking at <span className="font-semibold text-foreground">{clinic.name}</span>
        </p>
      </div>

      {/* Date */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">1. Select date</p>
        <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
          {days.map((d, i) => {
            const active = date === d.iso;
            return (
              <button
                key={d.iso}
                onClick={() => { onChangeDate(d.iso); onChangeTime(""); }}
                className={`flex min-w-[68px] snap-start flex-col items-center rounded-2xl border px-3 py-3 transition-all ${
                  active
                    ? "border-primary bg-primary/15 text-primary shadow-[0_0_14px_-2px_oklch(0.62_0.22_255/0.5)]"
                    : "border-border/60 bg-card text-foreground hover:border-primary/40"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{d.weekday}</span>
                <span className="mt-0.5 text-xl font-bold leading-none">{d.day}</span>
                <span className="mt-1 text-[10px] uppercase tracking-wider opacity-70">
                  {i === 0 ? "Today" : d.month}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Session tabs */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">2. Select session</p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(SESSION_LABELS) as BookingSession[]).map((s) => {
            const active = session === s;
            return (
              <button
                key={s}
                onClick={() => { onChangeSession(s); onChangeTime(""); }}
                className={`rounded-xl border px-2 py-2.5 text-center transition-all ${
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/60 bg-card text-foreground hover:border-primary/40"
                }`}
              >
                <p className="text-[11px] font-bold">{SESSION_LABELS[s].label}</p>
                <p className="mt-0.5 text-[9px] uppercase tracking-wider opacity-70">{SESSION_LABELS[s].sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">3. Select time</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">All times in MYT</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {slots.map((t) => {
            const left = date ? seatsLeftFor(date, t) : 5;
            const full = left === 0;
            const active = time === t;
            return (
              <button
                key={t}
                disabled={full || !date}
                onClick={() => onChangeTime(t)}
                className={`rounded-xl border px-2 py-3 text-center transition-all ${
                  full
                    ? "cursor-not-allowed border-border/40 bg-card/40 text-muted-foreground/50"
                    : active
                      ? "border-primary bg-primary/15 text-primary shadow-[0_0_14px_-2px_oklch(0.62_0.22_255/0.5)]"
                      : "border-border/60 bg-card text-foreground hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-bold leading-tight">{formatTime12h(t)}</p>
                <p className={`mt-1 text-[10px] font-semibold ${full ? "text-destructive/70" : "text-success"}`}>
                  {full ? "Full" : `${left} seats left`}
                </p>
              </button>
            );
          })}
        </div>
        {!date && (
          <p className="mt-2 text-[11px] text-muted-foreground">Pick a date first to see available slots.</p>
        )}
      </div>

      <button
        disabled={!ok}
        onClick={onConfirm}
        className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-primary-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
      >
        Confirm Booking <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ============================================================
// Confirmed step — booking summary
// ============================================================

function ConfirmedStep({
  clinic,
  date,
  session,
  time,
  onDone,
}: {
  clinic: ReturnType<typeof recommendClinic>;
  date: string;
  session: string;
  time: string;
  onDone: () => void;
}) {
  const sessionKey = (session || inferSession(time || "09:00")) as BookingSession;
  const sessionLabel = SESSION_LABELS[sessionKey];
  const dateObj = date ? new Date(date) : null;
  const niceDate = dateObj
    ? dateObj.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : date;

  return (
    <div className="space-y-5 animate-scale-in">
      <div
        className="relative overflow-hidden rounded-2xl border border-primary/40 p-6 text-center"
        style={{
          background: "linear-gradient(135deg, oklch(0.62 0.2 252 / 0.12), oklch(0.55 0.22 290 / 0.06))",
          boxShadow: "0 0 30px -8px oklch(0.62 0.22 255 / 0.5)",
        }}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary shadow-[0_0_18px_oklch(0.62_0.22_255/0.5)]">
          <CalendarCheck className="h-8 w-8" strokeWidth={2.2} />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">Appointment booked!</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We've reserved your slot. You'll receive a reminder before your visit.
        </p>
      </div>

      <div className="glass rounded-2xl p-4 space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Clinic</p>
          <p className="mt-1 text-sm font-bold text-foreground">{clinic.name}</p>
          <p className="text-xs text-muted-foreground">{clinic.address}</p>
        </div>
        <div className="h-px bg-border/60" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Date</p>
          <p className="mt-1 text-sm font-bold text-foreground">{niceDate}</p>
        </div>
        <div className="h-px bg-border/60" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Time</p>
          <p className="mt-1 text-sm font-bold text-foreground">{time ? formatTime12h(time) : "—"}</p>
          <p className="text-xs text-muted-foreground">{sessionLabel.label} · {sessionLabel.sub}</p>
        </div>
      </div>

      <button
        onClick={onDone}
        className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-primary-foreground"
      >
        Done
      </button>
    </div>
  );
}
