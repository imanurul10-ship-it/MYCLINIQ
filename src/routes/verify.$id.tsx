import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useCertificates, formatLongDate } from "@/lib/certificates";
import { ArrowLeft, ShieldCheck, ShieldAlert, FileCheck2 } from "lucide-react";

export const Route = createFileRoute("/verify/$id")({
  component: VerifyPage,
  head: ({ params }) => ({
    meta: [
      { title: `Verify ${params.id} · MyClinIQ` },
      { name: "description", content: "Verify the authenticity of a MyClinIQ medical certificate." },
    ],
  }),
});

function VerifyPage() {
  const { id } = Route.useParams();
  const mc = useCertificates((s) => s.byId(id));
  const isValid = !!mc && mc.status === "approved";

  return (
    <AppShell>
      <header className="glass-strong sticky top-0 z-20 px-5 py-4">
        <div className="flex items-center gap-3">
          <Link
            to="/certificates"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:border-primary/50 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Verification</p>
            <p className="text-sm font-bold text-foreground">Certificate {id}</p>
          </div>
          <FileCheck2 className="h-5 w-5 text-primary" />
        </div>
      </header>

      <main className="space-y-5 px-5 py-6">
        <div
          className={`relative overflow-hidden rounded-2xl border p-5 ${
            isValid ? "border-success/40 bg-success/10" : "border-destructive/40 bg-destructive/10"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                isValid ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
              }`}
            >
              {isValid ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isValid ? "text-success" : "text-destructive"}`}>
                {isValid ? "Valid certificate" : "Not found"}
              </p>
              <p className="mt-0.5 text-base font-bold text-foreground">
                {isValid ? "This certificate is authentic." : "This certificate could not be verified on this device."}
              </p>
              {!isValid && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Certificates are stored on the device of the issuing patient. Ask the patient to share the original.
                </p>
              )}
            </div>
          </div>
        </div>

        {mc && (
          <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
            <Row label="Patient" value={mc.patient.fullName || "—"} />
            <Row label="IC / ID" value={mc.patient.icNumber || "—"} />
            <Row label="Issuing Clinic" value={mc.clinic.name} />
            <Row label="Attending Doctor" value={mc.doctor.name} />
            <Row label="Reg. No." value={mc.doctor.registrationNumber} />
            <Row label="Date of Examination" value={formatLongDate(mc.examination.date)} />
            <Row
              label="Period of Leave"
              value={`${formatLongDate(mc.rest.startDate)} – ${formatLongDate(mc.rest.endDate)} (${mc.rest.days} day${mc.rest.days === 1 ? "" : "s"})`}
            />
            <Row label="Diagnosis" value={mc.examination.condition} />
            <Row label="Status" value={mc.status === "approved" ? "Approved · Final" : "Draft · Pending"} />
          </section>
        )}

        <Link
          to="/certificates"
          className="block rounded-xl border border-border bg-card px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-foreground hover:border-primary/50"
        >
          Back to certificates
        </Link>
      </main>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="text-right text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
