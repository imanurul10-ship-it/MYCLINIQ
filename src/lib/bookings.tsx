import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Clinic } from "./clinics";

export type BookingSession = "morning" | "afternoon" | "evening";

export interface Booking {
  id: string;
  clinic: Clinic;
  date: string; // YYYY-MM-DD
  session: BookingSession;
  /** Specific consultation time, e.g. "09:30" (24h) */
  time: string;
  reason?: string;
  createdAt: string; // ISO
  status: "scheduled" | "cancelled" | "completed";
}

interface BookingStore {
  bookings: Booking[];
  add: (b: Omit<Booking, "id" | "createdAt" | "status"> & { id?: string }) => Booking;
  update: (id: string, patch: Partial<Pick<Booking, "date" | "session" | "time" | "status">>) => void;
  cancel: (id: string) => void;
  remove: (id: string) => void;
  byId: (id: string) => Booking | undefined;
}

function genId() {
  return `BK-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
}

export const SESSION_LABELS: Record<BookingSession, { label: string; sub: string }> = {
  morning: { label: "Morning", sub: "9:00 AM – 12:00 PM" },
  afternoon: { label: "Afternoon", sub: "1:00 PM – 4:00 PM" },
  evening: { label: "Evening", sub: "5:00 PM – 8:00 PM" },
};

/** All available consultation start times per session (30-min slots). */
export const SESSION_TIMES: Record<BookingSession, string[]> = {
  morning: ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"],
  afternoon: ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30"],
  evening: ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30"],
};

export function inferSession(time: string): BookingSession {
  const h = parseInt(time.split(":")[0] ?? "0", 10);
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export function formatTime12h(time: string): string {
  const [hStr, m] = time.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

/** Pseudo-random seats remaining for a slot (deterministic by date+time so UI is stable). */
export function seatsLeftFor(date: string, time: string): number {
  let seed = 0;
  const s = `${date}-${time}`;
  for (let i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) >>> 0;
  return seed % 10; // 0..9
}

export const useBookings = create<BookingStore>()(
  persist(
    (set, get) => ({
      bookings: [],
      add: (b) => {
        const booking: Booking = {
          id: b.id ?? genId(),
          clinic: b.clinic,
          date: b.date,
          session: b.session as BookingSession,
          time: b.time,
          reason: b.reason,
          createdAt: new Date().toISOString(),
          status: "scheduled",
        };
        set({ bookings: [booking, ...get().bookings.filter((x) => x.id !== booking.id)] });
        return booking;
      },
      update: (id, patch) =>
        set({
          bookings: get().bookings.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        }),
      cancel: (id) =>
        set({
          bookings: get().bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)),
        }),
      remove: (id) => set({ bookings: get().bookings.filter((b) => b.id !== id) }),
      byId: (id) => get().bookings.find((b) => b.id === id),
    }),
    { name: "myclinic-bookings" },
  ),
);

export function formatBookingDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}
