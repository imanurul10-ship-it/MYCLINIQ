import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { LangToggle } from "@/components/LangToggle";
import { Bell, Globe, Lock, ChevronRight, HelpCircle, FileText, LogOut, User, Users, IdCard, Phone, Mail, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: Profile,
  head: () => ({ meta: [{ title: "Profile · MyClinIQ" }] }),
});

function Profile() {
  const mode = useApp((s) => s.mode);
  const setMode = useApp((s) => s.setMode);
  const resetOnboarding = useApp((s) => s.resetOnboarding);
  const { user, profile, updateProfile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    ic_number: "",
    phone: "",
    address: "",
    blood_type: "",
    allergies: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        ic_number: profile.ic_number ?? "",
        phone: profile.phone ?? "",
        address: profile.address ?? "",
        blood_type: profile.blood_type ?? "",
        allergies: profile.allergies ?? "",
        emergency_contact_name: profile.emergency_contact_name ?? "",
        emergency_contact_phone: profile.emergency_contact_phone ?? "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setBusy(true);
    const { error } = await updateProfile(form);
    setBusy(false);
    if (error) toast.error(error);
    else {
      toast.success("Profile updated");
      setEdit(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  const initials = (profile?.full_name ?? user?.email ?? "U")
    .split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <AppShell>
      <header className="relative overflow-hidden px-5 pb-7 pt-8" style={{ background: "var(--gradient-hero)" }}>
        <div className="pointer-events-none absolute -right-16 -top-10 h-48 w-48 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative mb-5 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">My Profile</p>
          <LangToggle compact />
        </div>

        <div className="relative flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-primary-foreground"
            style={{ background: "var(--gradient-primary)", boxShadow: "0 0 30px -6px oklch(0.7 0.13 190 / 0.6)" }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              onBlur={async () => {
                if ((form.full_name ?? "") !== (profile?.full_name ?? "")) {
                  const { error } = await updateProfile({ full_name: form.full_name });
                  if (error) toast.error(error);
                  else toast.success("Name updated");
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              placeholder={loading ? "Loading…" : "Add your name"}
              aria-label="Full name"
              className="w-full truncate bg-transparent text-xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-b focus:border-primary/50"
            />
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
              <span className="h-1 w-1 rounded-full bg-current shadow-[0_0_6px_currentColor]" /> Verified
            </span>
          </div>
        </div>
      </header>

      <main className="space-y-7 px-5 py-6">
        <section>
          <div className="mb-2.5 flex items-center justify-between">
            <SectionTitle>Personal Details</SectionTitle>
            <button
              onClick={() => (edit ? handleSave() : setEdit(true))}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : edit ? <Save className="h-3 w-3" /> : null}
              {edit ? "Save" : "Edit"}
            </button>
          </div>
          <div className="glass space-y-2 rounded-2xl p-3">
            <ProfileField icon={User} label="Full name" value={form.full_name} edit={edit} onChange={(v) => setForm({ ...form, full_name: v })} />
            <ProfileField icon={IdCard} label="IC number" value={form.ic_number} edit={edit} onChange={(v) => setForm({ ...form, ic_number: v })} />
            <ProfileField icon={Phone} label="Phone" value={form.phone} edit={edit} onChange={(v) => setForm({ ...form, phone: v })} />
            <ProfileField icon={Mail} label="Email" value={user?.email ?? ""} edit={false} onChange={() => {}} />
            <ProfileField icon={FileText} label="Address" value={form.address} edit={edit} onChange={(v) => setForm({ ...form, address: v })} />
          </div>
        </section>

        <section>
          <SectionTitle>Medical</SectionTitle>
          <div className="glass space-y-2 rounded-2xl p-3">
            <ProfileField label="Blood type" value={form.blood_type} edit={edit} onChange={(v) => setForm({ ...form, blood_type: v })} placeholder="e.g. O+" />
            <ProfileField label="Allergies" value={form.allergies} edit={edit} onChange={(v) => setForm({ ...form, allergies: v })} placeholder="None / list" />
            <ProfileField label="Emergency contact" value={form.emergency_contact_name} edit={edit} onChange={(v) => setForm({ ...form, emergency_contact_name: v })} />
            <ProfileField label="Emergency phone" value={form.emergency_contact_phone} edit={edit} onChange={(v) => setForm({ ...form, emergency_contact_phone: v })} />
          </div>
        </section>

        <section>
          <SectionTitle>Mode</SectionTitle>
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-1.5">
            <ModeBtn
              active={mode === "self"}
              onClick={async () => {
                if (mode === "self") return;
                setMode("self");
                await signOut();
                toast("Switched to Self mode — please sign in to continue");
                navigate({ to: "/auth" });
              }}
              icon={User}
            >
              Self
            </ModeBtn>
            <ModeBtn
              active={mode === "guardian"}
              onClick={async () => {
                if (mode === "guardian") return;
                setMode("guardian");
                await signOut();
                toast("Switched to Guardian mode — please sign in to continue");
                navigate({ to: "/auth" });
              }}
              icon={Users}
            >
              Guardian
            </ModeBtn>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Switching mode signs you out so the right account can be linked.
          </p>
        </section>

        <section>
          <SectionTitle>Settings</SectionTitle>
          <div className="glass overflow-hidden rounded-2xl">
            <Row icon={Bell} label="Notifications" value="On" />
            <Row icon={Globe} label="Language" value="EN / BM / 中文" />
            <Row icon={Lock} label="Privacy" value="" />
            <Row icon={HelpCircle} label="Help & Support" value="" last />
          </div>
        </section>

        <section>
          <SectionTitle>Clinic Staff?</SectionTitle>
          <Link to="/admin-login" className="flex items-center justify-between rounded-2xl border border-dashed border-border bg-card/40 p-3.5 text-sm hover:border-primary/50 hover:bg-card">
            <span className="text-muted-foreground">Open the <span className="font-bold text-foreground">Front Desk Portal</span></span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </section>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-card px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>

        <button
          onClick={resetOnboarding}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          Restart onboarding
        </button>

        <p className="rounded-xl border border-border/40 bg-card/40 px-3 py-2.5 text-center text-[10px] leading-relaxed text-muted-foreground">
          MyClinIQ Prototype v1.0 · Not a medical diagnosis tool
        </p>
      </main>
    </AppShell>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className="h-1 w-1 rounded-full bg-primary shadow-[0_0_6px_currentColor]" />
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{children}</h2>
      <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
  edit,
  onChange,
  placeholder,
}: {
  icon?: typeof User;
  label: string;
  value: string;
  edit: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2">
      {Icon && (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-foreground">
          <Icon className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        {edit ? (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        ) : (
          <p className="truncate text-sm font-semibold text-foreground">{value || <span className="text-muted-foreground/70">—</span>}</p>
        )}
      </div>
    </div>
  );
}

function ModeBtn({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof User; children: React.ReactNode; }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold uppercase tracking-wider transition-all ${
        active ? "btn-glow text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function Row({ icon: Icon, label, value, last }: { icon: typeof Bell; label: string; value: string; last?: boolean; }) {
  return (
    <button className={`flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-primary/5 ${last ? "" : "border-b border-border/50"}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1 text-left text-sm font-semibold text-foreground">{label}</span>
      {value && <span className="text-xs text-muted-foreground">{value}</span>}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
