export interface Medication {
  id: string;
  name: string;
  dose: string;
  schedule: string; // e.g. "08:00, 20:00"
  times: string[]; // 24h "HH:MM"
  color: "primary" | "success" | "warning";
}

export const MEDICATIONS: Medication[] = [
  { id: "para", name: "Paracetamol", dose: "500mg", schedule: "Twice daily", times: ["08:00", "20:00"], color: "primary" },
  { id: "vitc", name: "Vitamin C", dose: "1000mg", schedule: "Morning", times: ["09:00"], color: "warning" },
  { id: "amox", name: "Amoxicillin", dose: "250mg", schedule: "Every 8h", times: ["07:00", "15:00", "23:00"], color: "success" },
];

export interface Appointment {
  id: string;
  title: string;
  doctor: string;
  clinic: string;
  /** ISO local string YYYY-MM-DDTHH:mm */
  startsAt: string;
  durationMinutes: number;
  address: string;
}

function inDays(days: number, hour: number, min = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, min, 0, 0);
  // local ISO without timezone offset for .ics generation
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    title: "Follow-up consultation",
    doctor: "Dr. Aishah Rahman",
    clinic: "Bangsar Health",
    startsAt: inDays(2, 10, 30),
    durationMinutes: 30,
    address: "12 Jalan Maarof, Bangsar, KL",
  },
  {
    id: "a2",
    title: "Annual health screening",
    doctor: "Dr. Daniel Lim",
    clinic: "Mid Valley Urgent Care",
    startsAt: inDays(9, 14, 0),
    durationMinutes: 60,
    address: "Lingkaran Syed Putra, KL",
  },
];

/** Build a downloadable .ics blob URL for one appointment */
export function buildICS(appt: Appointment): string {
  const start = new Date(appt.startsAt);
  const end = new Date(start.getTime() + appt.durationMinutes * 60 * 1000);
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}T${String(d.getUTCHours()).padStart(2, "0")}${String(d.getUTCMinutes()).padStart(2, "0")}00Z`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MediQ//Appointments//EN",
    "BEGIN:VEVENT",
    `UID:${appt.id}@mediq.app`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${appt.title} — ${appt.clinic}`,
    `DESCRIPTION:With ${appt.doctor} at ${appt.clinic}.`,
    `LOCATION:${appt.address}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT60M",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder — ${appt.title}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return URL.createObjectURL(new Blob([lines], { type: "text/calendar;charset=utf-8" }));
}

export function formatApptDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
export function formatApptTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
