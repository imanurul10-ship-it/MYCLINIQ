import type { Severity } from "./clinics";
import {
  Thermometer,
  Brain,
  HeartPulse,
  Wind,
  Stethoscope,
  Activity,
  Droplet,
  Eye,
  Pill as PillIcon,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type SymptomId =
  | "fever"
  | "headache"
  | "chest_pain"
  | "cough"
  | "breathing"
  | "fatigue"
  | "nausea"
  | "dizziness"
  | "abdominal"
  | "rash";

export interface SymptomMeta {
  id: SymptomId;
  label: string;
  icon: LucideIcon;
  hint: string;
}

export const SYMPTOMS: SymptomMeta[] = [
  { id: "fever", label: "Fever", icon: Thermometer, hint: "Elevated temperature" },
  { id: "headache", label: "Headache", icon: Brain, hint: "Pain in head or neck" },
  { id: "chest_pain", label: "Chest Pain", icon: HeartPulse, hint: "Pressure or sharp pain" },
  { id: "cough", label: "Cough", icon: Stethoscope, hint: "Dry or productive" },
  { id: "breathing", label: "Breathlessness", icon: Wind, hint: "Difficulty breathing" },
  { id: "fatigue", label: "Fatigue", icon: Activity, hint: "Low energy / tired" },
  { id: "nausea", label: "Nausea", icon: Droplet, hint: "Queasy or vomiting" },
  { id: "dizziness", label: "Dizziness", icon: Eye, hint: "Lightheaded / spinning" },
  { id: "abdominal", label: "Abdominal Pain", icon: Zap, hint: "Stomach discomfort" },
  { id: "rash", label: "Skin Rash", icon: PillIcon, hint: "Redness or irritation" },
];

export type PregnancyStatus = "pregnant" | "not_pregnant" | "not_applicable";

export interface TriageAnswers {
  pregnancy?: PregnancyStatus;
  trimester?: "first" | "second" | "third";
  medications?: "yes" | "no";
  durationDays?: "less_1" | "1_3" | "3_7" | "more_7";
  temperature?: "normal" | "mild" | "high" | "very_high";
  breathing?: "none" | "mild" | "severe";
  painIntensity?: "mild" | "moderate" | "severe";
  // expanded
  age?: "under_12" | "12_17" | "18_39" | "40_64" | "65_plus";
  conditions?: "none" | "diabetes" | "hypertension" | "heart" | "asthma" | "other";
  recentTravel?: "yes" | "no";
  appetite?: "normal" | "reduced" | "none";
  hydration?: "good" | "low" | "very_low";
  sleep?: "normal" | "poor" | "insomnia";
  symptomTrend?: "improving" | "stable" | "worsening";
  allergies?: "none" | "drug" | "food" | "environmental";
  vaccinationCurrent?: "yes" | "no" | "unsure";
}

export interface TriageResult {
  severity: Severity;
  action: string;
  description: string;
  isEmergency: boolean;
}

export function evaluateTriage(
  symptoms: SymptomId[],
  answers: TriageAnswers,
): TriageResult {
  const hasChest = symptoms.includes("chest_pain");
  const hasBreathing =
    symptoms.includes("breathing") || answers.breathing === "severe";

  // Critical combo
  if (hasChest && hasBreathing) {
    return {
      severity: "high",
      isEmergency: true,
      action: "Seek Immediate Medical Attention",
      description:
        "Your symptoms may indicate a medical emergency. Call emergency services or go to the nearest emergency room now.",
    };
  }

  if (
    answers.painIntensity === "severe" ||
    answers.temperature === "very_high" ||
    answers.breathing === "severe" ||
    answers.hydration === "very_low" ||
    (answers.age === "65_plus" && answers.symptomTrend === "worsening")
  ) {
    return {
      severity: "high",
      isEmergency: false,
      action: "Seek Urgent Care",
      description:
        "Your condition needs prompt medical attention. Visit an urgent care clinic within the next few hours.",
    };
  }

  if (
    answers.temperature === "high" ||
    answers.durationDays === "more_7" ||
    answers.painIntensity === "moderate" ||
    answers.breathing === "mild" ||
    answers.symptomTrend === "worsening" ||
    answers.appetite === "none"
  ) {
    return {
      severity: "medium",
      isEmergency: false,
      action: "Visit Clinic",
      description:
        "Schedule a visit with a clinic today. Your symptoms warrant a professional assessment.",
    };
  }

  return {
    severity: "low",
    isEmergency: false,
    action: "Monitor at Home",
    description:
      "Your symptoms appear mild. Rest, stay hydrated, and monitor your condition. Seek care if it worsens.",
  };
}
