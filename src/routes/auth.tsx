import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

import { useT } from "@/lib/i18n";
import { ArrowRight, Mail, Lock, User as UserIcon, Phone, IdCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in · MyClinIQ" }] }),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signUpSchema = z.object({
  full_name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(72),
  ic_number: z.string().min(6).max(20),
  phone: z.string().min(7).max(20),
});

function AuthPage() {
  const t = useT();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    ic_number: "",
    phone: "",
  });

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const parsed = signInSchema.safeParse({ email: form.email.trim().toLowerCase(), password: form.password });
        if (!parsed.success) {
          toast.error("Please enter a valid email and password (min 6 chars).");
          return;
        }
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) {
          if (error.message.toLowerCase().includes("invalid")) {
            toast.error("Wrong email or password. New here? Tap Sign Up.", { duration: 5000 });
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Welcome back!");
        navigate({ to: "/" });
      } else {
        const parsed = signUpSchema.safeParse({
          ...form,
          email: form.email.trim().toLowerCase(),
        });
        if (!parsed.success) {
          toast.error("Please fill all fields correctly.");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: parsed.data.full_name,
              ic_number: parsed.data.ic_number,
              phone: parsed.data.phone,
            },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Account created. You're signed in.");
        navigate({ to: "/" });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface">
      <div className="bg-blue-maroon relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col overflow-hidden">
        {/* Soft layered glows */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl animate-pulse-glow" />
        <div className="pointer-events-none absolute -left-24 top-10 h-[26rem] w-[26rem] rounded-full bg-accent/25 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-50"
          style={{ background: "radial-gradient(80% 60% at 50% 0%, oklch(0.45 0.16 264 / 0.35), transparent 70%)" }}
        />

        <div className="relative h-4" />


        {/* Single full logo (no duplicated text) */}
        <div className="logo-stage relative flex flex-col items-center pb-0 pt-0">
          <Logo size={280} withWordmark dramatic />
        </div>

        <div className="relative flex-1 px-6 pb-10 pt-6">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            {mode === "signin" ? t("sign_in") : t("sign_up")}
          </h2>

          <div className="mt-4 flex justify-center">
            <div className="inline-flex rounded-full border border-border bg-card/60 p-1 text-xs font-bold backdrop-blur">
              <button
                onClick={() => setMode("signin")}
                className={`rounded-full px-5 py-1.5 transition ${mode === "signin" ? "btn-glow text-primary-foreground" : "text-muted-foreground"}`}
              >
                {t("sign_in")}
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`rounded-full px-5 py-1.5 transition ${mode === "signup" ? "btn-glow text-primary-foreground" : "text-muted-foreground"}`}
              >
                {t("sign_up")}
              </button>
            </div>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-3">
            {mode === "signup" && (
              <Field icon={UserIcon} placeholder={t("full_name")} value={form.full_name} onChange={onChange("full_name")} />
            )}
            <Field icon={Mail} type="email" placeholder={t("email")} value={form.email} onChange={onChange("email")} autoComplete="email" />
            <Field icon={Lock} type="password" placeholder={t("password")} value={form.password} onChange={onChange("password")} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
            {mode === "signup" && (
              <>
                <Field icon={IdCard} placeholder={t("ic_number")} value={form.ic_number} onChange={onChange("ic_number")} />
                <Field icon={Phone} placeholder={t("phone")} value={form.phone} onChange={onChange("phone")} />
              </>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-glow mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{mode === "signin" ? t("sign_in") : t("sign_up")} <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-[10px] leading-relaxed text-muted-foreground">
            By continuing you agree to MyClinIQ's terms.
            <br />Prototype · Not a medical diagnosis tool.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
}: {
  icon: typeof Mail;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}) {
  return (
    <label className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5 transition focus-within:border-primary/50">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
      />
    </label>
  );
}
