import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SymptomId, TriageAnswers, TriageResult } from "./triage";
import type { Clinic } from "./clinics";
import type { BodyRegion, AIResult } from "@/components/SmartSymptomInput";

export type Zone = "A" | "B" | "C" | "D";

export interface SeatAssignment {
  zone: Zone;
  seat: string; // e.g. "A-12"
  direction: string; // e.g. "Level 2 · West Wing"
  floor: string;
}

interface QueueState {
  number: string;
  patientsAhead: number;
  estimatedMinutes: number;
  checkedIn: boolean;
  clinic: Clinic | null;
  seat: SeatAssignment | null;
}

interface AppState {
  symptoms: SymptomId[];
  answers: TriageAnswers;
  result: TriageResult | null;
  queue: QueueState | null;
  mode: "self" | "guardian" | null;
  onboarded: boolean;
  /** key = `${YYYY-MM-DD}:${medId}:${HH:MM}` */
  medsTaken: Record<string, boolean>;
  bodyRegions: BodyRegion[];
  painLevel: number;
  aiDescription: string;
  aiResult: AIResult | null;
  toggleBodyRegion: (r: BodyRegion) => void;
  setPainLevel: (n: number) => void;
  setAIDescription: (s: string) => void;
  setAIResult: (r: AIResult | null) => void;
  setSymptoms: (s: SymptomId[]) => void;
  toggleSymptom: (s: SymptomId) => void;
  setAnswers: (a: TriageAnswers) => void;
  setResult: (r: TriageResult | null) => void;
  joinQueue: (clinic: Clinic) => void;
  decrementQueue: () => void;
  checkIn: () => void;
  delayQueue: () => void;
  assignSeat: (seat: SeatAssignment) => void;
  cancelQueue: () => void;
  resetVisit: () => void;
  setMode: (m: "self" | "guardian") => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  toggleMedTaken: (medId: string, time: string) => void;
}

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function genQueueNumber() {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 4));
  const n = 100 + Math.floor(Math.random() * 80);
  return `${letter}${n}`;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      symptoms: [],
      answers: {},
      result: null,
      queue: null,
      mode: null,
      onboarded: false,
      setSymptoms: (s) => set({ symptoms: s }),
      toggleSymptom: (s) => {
        const cur = get().symptoms;
        set({
          symptoms: cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
        });
      },
      setAnswers: (a) => set({ answers: { ...get().answers, ...a } }),
      setResult: (r) => set({ result: r }),
      joinQueue: (clinic) => {
        set({
          queue: {
            number: genQueueNumber(),
            patientsAhead: clinic.queueLength,
            estimatedMinutes: clinic.waitMinutes,
            checkedIn: false,
            clinic,
            seat: null,
          },
        });
      },
      decrementQueue: () => {
        const q = get().queue;
        if (!q) return;
        if (q.patientsAhead <= 0) return;
        const newAhead = Math.max(0, q.patientsAhead - 1);
        const newMin = Math.max(
          0,
          q.estimatedMinutes - Math.ceil(q.estimatedMinutes / Math.max(q.patientsAhead, 1)),
        );
        set({ queue: { ...q, patientsAhead: newAhead, estimatedMinutes: newMin } });
      },
      checkIn: () => {
        const q = get().queue;
        if (!q) return;
        set({ queue: { ...q, checkedIn: true } });
      },
      cancelQueue: () => set({ queue: null }),
      delayQueue: () => {
        const q = get().queue;
        if (!q) return;
        set({
          queue: {
            ...q,
            patientsAhead: q.patientsAhead + 5,
            estimatedMinutes: q.estimatedMinutes + 20,
          },
        });
      },
      assignSeat: (seat) => {
        const q = get().queue;
        if (!q) return;
        set({ queue: { ...q, seat } });
      },
      bodyRegions: [],
      painLevel: 0,
      aiDescription: "",
      aiResult: null,
      toggleBodyRegion: (r) => {
        const cur = get().bodyRegions;
        set({ bodyRegions: cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r] });
      },
      setPainLevel: (n) => set({ painLevel: n }),
      setAIDescription: (s) => set({ aiDescription: s }),
      setAIResult: (r) => set({ aiResult: r }),
      resetVisit: () => set({ symptoms: [], answers: {}, result: null, bodyRegions: [], painLevel: 0, aiDescription: "", aiResult: null }),
      setMode: (m) => set({ mode: m }),
      completeOnboarding: () => set({ onboarded: true }),
      resetOnboarding: () => set({ onboarded: false, mode: null }),
      medsTaken: {},
      toggleMedTaken: (medId, time) => {
        const key = `${todayKey()}:${medId}:${time}`;
        const cur = get().medsTaken;
        set({ medsTaken: { ...cur, [key]: !cur[key] } });
      },
    }),
    {
      name: "mediq-app",
      partialize: (s) => ({ mode: s.mode, onboarded: s.onboarded, medsTaken: s.medsTaken }),
    },
  ),
);
