// English-only. Tiny dictionary kept for places that already call useT().
export type Lang = "en";

export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "EN" },
];

type Entry = { en: string };
type Dict = Record<string, Entry>;

export const T: Dict = {
  app_name: { en: "MyClinIQ" },
  tagline: { en: "Intelligent Care for Every Patient" },
  welcome_title: { en: "Welcome to" },
  who_for: { en: "Who is this for?" },
  self: { en: "For myself" },
  guardian: { en: "For someone I care for" },
  self_desc: { en: "Triage your own symptoms and book a clinic visit." },
  guardian_desc: { en: "Manage visits for elderly parents, children, or dependents." },
  continue: { en: "Continue" },
  sign_in: { en: "Sign In" },
  sign_up: { en: "Sign Up" },
  email: { en: "Email" },
  password: { en: "Password" },
  full_name: { en: "Full name" },
  ic_number: { en: "IC Number" },
  phone: { en: "Phone" },
  good_morning: { en: "Good morning" },
  good_afternoon: { en: "Good afternoon" },
  good_evening: { en: "Good evening" },
  feeling_today: { en: "How are you feeling today?" },
  start_visit: { en: "Start a Visit" },
  ai_triage: { en: "AI Triage" },
  ai_doctor: { en: "AI Doctor" },
  smart_queue: { en: "Smart Queue" },
  appointments: { en: "Appointments" },
  records: { en: "Records" },
  family: { en: "Family" },
  emergency: { en: "Emergency" },
  staff_login: { en: "Staff Login" },
  staff_login_desc: { en: "Clinic staff tap here for the staff portal." },
  light: { en: "Light" },
  dark: { en: "Dark" },
  reminders: { en: "Reminders" },
  library: { en: "Library" },
  home: { en: "Home" },
  visit: { en: "Visit" },
  queue: { en: "Queue" },
  certificates: { en: "MC" },
  profile: { en: "Profile" },
  menu: { en: "Menu" },
  quick_actions: { en: "Quick Actions" },
  active_queue: { en: "Active Queue" },
  health_snapshot: { en: "Health Snapshot" },
  ai_insight: { en: "AI Insight" },
  all_systems_normal: { en: "All systems normal" },
  pre_visit_q: { en: "Pre-visit questionnaire" },
  pre_visit_desc: { en: "Tap the body where it hurts, set pain level, then pick symptoms." },
  prefer_chat: { en: "Prefer to chat? Open AI Doctor" },
  common_symptoms: { en: "Common symptoms · tap to add" },
  reset: { en: "Reset" },
  next: { en: "Continue" },
  choose_clinic: { en: "Choose Clinic" },
  nearby_clinics: { en: "Nearby Clinics" },
  optimised_for: { en: "Optimised for your location & severity" },
  list: { en: "List" },
  map: { en: "Map" },
  join_queue: { en: "Join Queue" },
  library_education: { en: "Library & Education" },
  health_intelligence: { en: "Health Intelligence" },
  tips: { en: "Tips" },
  news: { en: "News" },
  wellness: { en: "Wellness" },
  education: { en: "Education" },
  read_full: { en: "Read full article" },
  save: { en: "Save" },
  saved: { en: "Saved" },
  start_course: { en: "Start course" },
  medication: { en: "Medication" },
  appointment: { en: "Appointment" },
};

// Stub stores (kept so existing imports don't break) — always English.
export const useI18n = () => ({ lang: "en" as Lang, setLang: (_: Lang) => {} });

export function useT() {
  return (key: keyof typeof T) => T[key]?.en ?? key;
}
