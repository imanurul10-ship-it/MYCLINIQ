import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Severity } from "./clinics";
import type { Clinic } from "./clinics";
import type { TriageResult } from "./triage";
import type { Profile } from "./auth";

/**
 * Medical Certificate (MC) — issued under a registered clinic + doctor.
 * Layout, certification text, doctor & clinic data are NOT user-editable.
 * Users may only view, download, and verify.
 */

export interface MCDoctor {
  name: string;
  qualification: string;
  registrationNumber: string;
}

export interface MCClinic {
  name: string;
  address: string;
}

export interface MedicalCertificate {
  id: string; // MC-YYYY-NNNNNN
  status: "draft" | "approved";
  issuedAt: string; // ISO
  patient: {
    fullName: string;
    icNumber: string;
  };
  examination: {
    date: string; // ISO date (yyyy-mm-dd)
    symptoms: string[];
    severity: Severity;
    condition: string; // human-readable diagnosis line
  };
  rest: {
    days: number;
    startDate: string; // yyyy-mm-dd
    endDate: string; // yyyy-mm-dd
  };
  doctor: MCDoctor;
  clinic: MCClinic;
}

interface CertStore {
  certificates: MedicalCertificate[];
  add: (mc: MedicalCertificate) => void;
  remove: (id: string) => void;
  byId: (id: string) => MedicalCertificate | undefined;
}

export const useCertificates = create<CertStore>()(
  persist(
    (set, get) => ({
      certificates: [],
      add: (mc) =>
        set({ certificates: [mc, ...get().certificates.filter((c) => c.id !== mc.id)] }),
      remove: (id) => set({ certificates: get().certificates.filter((c) => c.id !== id) }),
      byId: (id) => get().certificates.find((c) => c.id === id),
    }),
    { name: "myclinic-certificates" },
  ),
);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const SYMPTOM_LABELS: Record<string, string> = {
  fever: "Fever",
  headache: "Headache",
  chest_pain: "Chest pain",
  cough: "Cough",
  breathing: "Breathlessness",
  fatigue: "Fatigue",
  nausea: "Nausea",
  dizziness: "Dizziness",
  abdominal: "Abdominal pain",
  rash: "Skin rash",
};

export function symptomLabel(id: string) {
  return SYMPTOM_LABELS[id] ?? id.replace(/_/g, " ");
}

/** Mild → 1 day, Moderate → 2 days (3 if worsening), Severe → 3-5 days */
export function restDaysFor(severity: Severity, worsening = false): number {
  if (severity === "high") return worsening ? 5 : 3;
  if (severity === "medium") return worsening ? 3 : 2;
  return 1;
}

export function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function toISODate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatLongDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Stable, human-friendly certificate ID — MC-2026-000123 */
export function generateCertificateId(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(100000 + Math.random() * 899999);
  return `MC-${year}-${seq}`;
}

/** Pick a deterministic doctor for a clinic (mock authority directory). */
export function doctorForClinic(clinicName: string): MCDoctor {
  const roster: MCDoctor[] = [
    { name: "Dr. Aishah Rahman", qualification: "MBBS (UM), MMed (Family Medicine)", registrationNumber: "MMC 54321" },
    { name: "Dr. Daniel Lim Wei Jian", qualification: "MD (UKM), MRCP (UK)", registrationNumber: "MMC 60187" },
    { name: "Dr. Priya Subramaniam", qualification: "MBBS (UMS), MMed (Internal Medicine)", registrationNumber: "MMC 47210" },
    { name: "Dr. Faizal Hakim", qualification: "MBBS (USM)", registrationNumber: "MMC 71902" },
  ];
  let h = 0;
  for (const ch of clinicName) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return roster[h % roster.length];
}

export const DEFAULT_CLINIC: MCClinic = {
  name: "MyClinIQ Telehealth Clinic",
  address: "Level 12, Menara MyClinIQ, Jalan Tun Razak, 50400 Kuala Lumpur",
};

export const DEFAULT_DOCTOR: MCDoctor = doctorForClinic(DEFAULT_CLINIC.name);

export function buildCondition(symptoms: string[], severity: Severity): string {
  if (symptoms.length === 0) {
    return severity === "high" ? "Acute medical illness" : severity === "medium" ? "Acute viral syndrome" : "Mild self-limiting illness";
  }
  const labels = symptoms.map(symptomLabel);
  const prefix = severity === "high" ? "Acute" : severity === "medium" ? "Moderate" : "Mild";
  if (labels.length === 1) return `${prefix} ${labels[0].toLowerCase()}`;
  return `${prefix} illness with ${labels.slice(0, -1).map((s) => s.toLowerCase()).join(", ")} and ${labels[labels.length - 1].toLowerCase()}`;
}

/** Build an MC from current visit state. Falls back to safe defaults so the user can always be issued one post-consultation. */
export function buildCertificateFromVisit(input: {
  result: TriageResult;
  symptoms: string[];
  worsening?: boolean;
  clinic?: Clinic | null;
  profile?: Pick<Profile, "full_name" | "ic_number" | "email"> | null;
}): MedicalCertificate {
  const { result, symptoms, worsening = false, clinic, profile } = input;
  const today = toISODate(new Date());
  const days = restDaysFor(result.severity, worsening);
  const condition = buildCondition(symptoms, result.severity);

  const mcClinic: MCClinic = clinic
    ? { name: clinic.name, address: `${clinic.address}, ${clinic.state}` }
    : DEFAULT_CLINIC;
  const doctor = clinic ? doctorForClinic(clinic.name) : DEFAULT_DOCTOR;

  const fullName =
    profile?.full_name?.trim() ||
    profile?.email?.split("@")[0] ||
    "Patient";
  const icNumber = profile?.ic_number?.trim() || "—";

  return {
    id: generateCertificateId(),
    status: "approved",
    issuedAt: new Date().toISOString(),
    patient: { fullName, icNumber },
    examination: {
      date: today,
      symptoms: [...symptoms],
      severity: result.severity,
      condition,
    },
    rest: {
      days,
      startDate: today,
      endDate: addDays(today, Math.max(0, days - 1)),
    },
    doctor,
    clinic: mcClinic,
  };
}
