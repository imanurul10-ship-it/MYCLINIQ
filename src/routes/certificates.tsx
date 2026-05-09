import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { CertificateDocument } from "@/components/CertificateDocument";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import {
  useCertificates,
  doctorForClinic,
  DEFAULT_CLINIC,
  DEFAULT_DOCTOR,
  buildCondition,
  restDaysFor,
  formatLongDate,
  symptomLabel,
  buildCertificateFromVisit,
  type MedicalCertificate,
} from "@/lib/certificates";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  Plus,
  Trash2,
} from "lucide-react";

const search = z.object({
  id: z.string().optional(),
});

export const Route = createFileRoute("/certificates")({
  validateSearch: search,
  component: CertificatesPage,
  head: () => ({
    meta: [
      { title: "Medical Certificates · MyClinIQ" },
      { name: "description", content: "View, download and verify your digitally issued medical certificates." },
    ],
  }),
});

function CertificatesPage() {
  const { id } = Route.useSearch();
  const navigate = useNavigate({ from: "/certificates" });
  const certificates = useCertificates((s) => s.certificates);
  const byId = useCertificates((s) => s.byId);

  const selected = id ? byId(id) : undefined;

  if (selected) {
    return (
      <AppShell>
        <CertificateDetail
          mc={selected}
          onBack={() => navigate({ search: {} })}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="glass-strong sticky top-0 z-20 px-5 py-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Records
            </p>
            <p className="text-sm font-bold text-foreground">Medical Certificates</p>
          </div>
          <FileCheck2 className="h-5 w-5 text-primary" />
        </div>
      </header>

      <main className="space-y-6 px-5 py-6">
        <section>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Authority</p>
          <h2 className="mt-1 text-xl font-bold leading-tight tracking-tight text-foreground">
            Digitally issued under registered clinical authority
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Every certificate is linked to a consultation record, signed by an attending physician,
            and verifiable via QR. Certificates are view & download only — clinical content is not editable.
          </p>
        </section>

        <GenerateCard />

        <section>
          <div className="mb-2.5 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-primary shadow-[0_0_6px_currentColor]" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Issued certificates
            </h2>
            <span className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
          </div>

          {certificates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 text-center">
              <FileCheck2 className="mx-auto h-7 w-7 text-muted-foreground/60" />
              <p className="mt-2 text-sm font-semibold text-foreground">No certificates yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Complete a consultation, then generate an MC from the assessment.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {certificates.map((mc) => (
                <li key={mc.id}>
                  <Link
                    to="/certificates"
                    search={{ id: mc.id }}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/50"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-[0_0_14px_oklch(0.55_0.22_265/0.4)]">
                      <FileCheck2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{mc.id}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {mc.examination.condition} · {mc.rest.days} day{mc.rest.days === 1 ? "" : "s"}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground/80">
                        {formatLongDate(mc.rest.startDate)} – {formatLongDate(mc.rest.endDate)}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Generate                                                            */
/* ------------------------------------------------------------------ */

function GenerateCard() {
  const navigate = useNavigate({ from: "/certificates" });
  const symptoms = useApp((s) => s.symptoms);
  const result = useApp((s) => s.result);
  const queue = useApp((s) => s.queue);
  const answers = useApp((s) => s.answers);
  const { profile } = useAuth();
  const add = useCertificates((s) => s.add);

  const canGenerate = !!result;

  const preview = useMemo(() => {
    if (!result) return null;
    const days = restDaysFor(result.severity, answers.symptomTrend === "worsening");
    return {
      days,
      condition: buildCondition(symptoms, result.severity),
    };
  }, [result, symptoms, answers.symptomTrend]);

  const handleGenerate = () => {
    if (!result) return;
    const mc = buildCertificateFromVisit({
      result,
      symptoms,
      worsening: answers.symptomTrend === "worsening",
      clinic: queue?.clinic ?? null,
      profile,
    });
    add(mc);
    navigate({ search: { id: mc.id } });
  };

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card p-4"
      style={{ backgroundImage: "linear-gradient(135deg, oklch(0.55 0.22 265 / 0.08), oklch(0.7 0.13 190 / 0.04))" }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-[0_0_14px_oklch(0.55_0.22_265/0.4)]">
          <Plus className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Generate from latest consultation</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            {canGenerate
              ? `Auto-fills patient details, symptoms (${symptoms.length || "0"}), and rest duration based on your AI assessment.`
              : "Complete an AI triage first to generate an MC."}
          </p>
        </div>
      </div>

      {canGenerate && preview && (
        <div className="mt-3 rounded-xl border border-border/60 bg-background/40 p-3">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <Field label="Condition" value={preview.condition} />
            <Field label="Rest days" value={`${preview.days} day${preview.days === 1 ? "" : "s"}`} />
            <Field
              label="Clinic"
              value={queue?.clinic?.name ?? DEFAULT_CLINIC.name}
            />
            <Field
              label="Doctor"
              value={(queue?.clinic ? doctorForClinic(queue.clinic.name) : DEFAULT_DOCTOR).name}
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {!canGenerate && (
          <Link
            to="/visit"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-primary/50"
          >
            <Sparkles className="h-3.5 w-3.5" /> Start AI triage
          </Link>
        )}
        <button
          disabled={!canGenerate}
          onClick={handleGenerate}
          className="btn-glow inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
        >
          <FileCheck2 className="h-3.5 w-3.5" /> Generate MC
        </button>
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[11px] font-semibold text-foreground">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Detail / Preview                                                    */
/* ------------------------------------------------------------------ */

function CertificateDetail({ mc, onBack }: { mc: MedicalCertificate; onBack: () => void }) {
  const remove = useCertificates((s) => s.remove);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const verifyUrl = useMemo(() => {
    if (typeof window === "undefined") return `/verify/${mc.id}`;
    return `${window.location.origin}/verify/${mc.id}`;
  }, [mc.id]);

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <>
      <header className="glass-strong sticky top-0 z-20 px-5 py-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {mc.id}
            </p>
            <p className="text-sm font-bold text-foreground">Medical Certificate</p>
          </div>
          <ShieldCheck className="h-5 w-5 text-success" />
        </div>
      </header>

      <main className="px-5 py-6 print:hidden">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={handlePrint}
            className="btn-glow inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-primary-foreground"
          >
            <Download className="h-3.5 w-3.5" /> Download PDF
          </button>
          <Link
            to="/verify/$id"
            params={{ id: mc.id }}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground hover:border-primary/50"
          >
            <ShieldCheck className="h-3.5 w-3.5" /> Verify
          </Link>
          {confirmDelete ? (
            <button
              onClick={() => {
                remove(mc.id);
                onBack();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-destructive/60 bg-destructive/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Confirm delete
            </button>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-destructive/50 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>

        <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Preview · {mc.examination.symptoms.length} symptom{mc.examination.symptoms.length === 1 ? "" : "s"}
          {mc.examination.symptoms.length > 0 && ` · ${mc.examination.symptoms.map(symptomLabel).join(", ")}`}
        </p>

        <div className="overflow-x-auto">
          <div
            className="mc-print-root origin-top-left"
            style={{
              transform: "scale(0.42)",
              transformOrigin: "top left",
              width: "210mm",
              height: "calc(297mm * 0.42)",
            }}
          >
            <CertificateDocument mc={mc} verifyUrl={verifyUrl} />
          </div>
        </div>
      </main>

      {/* Hidden full-size doc used for print */}
      <div className="mc-print-root sr-only-print">
        <CertificateDocument mc={mc} verifyUrl={verifyUrl} />
      </div>

      <style>{`
        .sr-only-print { position: absolute; left: -10000px; top: 0; }
        @media print { .sr-only-print { position: static; left: 0; } }
      `}</style>
    </>
  );
}
