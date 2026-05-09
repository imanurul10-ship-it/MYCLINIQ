import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Lock, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/admin-login")({
  component: AdminLogin,
  head: () => ({ meta: [{ title: "Staff Login · MyClinIQ" }] }),
});

const STAFF_ID_PATTERN = /^STF-\d{4,6}$/;

function AdminLogin() {
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState("STF-");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onIdChange = (v: string) => {
    const up = v.toUpperCase();
    // Always keep the STF- prefix locked in.
    if (!up.startsWith("STF-")) setStaffId("STF-");
    else setStaffId("STF-" + up.slice(4).replace(/[^0-9]/g, "").slice(0, 6));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!STAFF_ID_PATTERN.test(staffId)) {
      setError("Staff ID must be in format STF-#### (4–6 digits).");
      return;
    }
    if (pin.length < 4) {
      setError("Access PIN must be at least 4 digits.");
      return;
    }
    navigate({ to: "/admin" });
  };

  return (
    <div className="min-h-screen w-full bg-surface">
      <div className="bg-blue-maroon relative mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 top-12 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative">
          <Link
            to="/"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/60 text-muted-foreground backdrop-blur"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="mt-10 flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-elevated)]">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              Staff Portal
            </p>
            <h1 className="mt-2 text-2xl font-bold text-foreground">Front Desk Sign In</h1>
            <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
              Restricted to clinic staff. This is a separate account from patient sign-in.
            </p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off" className="mt-10 space-y-4">
            {/* Hidden honeypots to discourage browser autofill from sharing patient credentials */}
            <input type="text" name="prevent-autofill-username" autoComplete="username" className="hidden" tabIndex={-1} />
            <input type="password" name="prevent-autofill-password" autoComplete="current-password" className="hidden" tabIndex={-1} />

            <Field label="Staff ID" hint="Format: STF-#### (e.g. STF-1024)">
              <input
                value={staffId}
                onChange={(e) => onIdChange(e.target.value)}
                placeholder="STF-1024"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                inputMode="text"
                name="staff_id_field"
              />
            </Field>
            <Field label="Access PIN" hint="Issued separately from your patient account.">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 8))}
                placeholder="••••"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                autoComplete="new-password"
                inputMode="numeric"
                name="staff_pin_field"
              />
            </Field>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-[11px] text-destructive">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-glow flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold text-primary-foreground"
            >
              Sign in to Dashboard <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" />
            Demo mode · enter STF-#### and any 4+ digit PIN
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="rounded-xl border border-border bg-card/80 px-3.5 py-3 backdrop-blur transition-colors focus-within:border-primary">
        {children}
      </div>
      {hint && <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>}
    </label>
  );
}
