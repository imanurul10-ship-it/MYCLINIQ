import { buildKKClinics } from "./kk-data";

export type QueueLoad = "Low" | "Medium" | "High";

export interface Clinic {
  id: string;
  name: string;
  address: string;
  state: string;
  distanceKm: number;
  waitMinutes: number;
  queueLength: number;
  queueLoad: QueueLoad;
  emergency: boolean;
  driveMinutes: number;
  walkMinutes: number;
  lat: number;
  lng: number;
  // legacy grid (unused, kept for back-compat)
  x: number;
  y: number;
}

// Default user location: Kuala Lumpur city center
export const DEFAULT_USER_LOCATION: { lat: number; lng: number } = {
  lat: 3.139,
  lng: 101.6869,
};

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(sa));
}

const RAW_KK = buildKKClinics();

export function getClinics(
  userLoc: { lat: number; lng: number } = DEFAULT_USER_LOCATION,
): Clinic[] {
  return RAW_KK.map((c) => {
    const distanceKm = +haversineKm(userLoc, { lat: c.lat, lng: c.lng }).toFixed(1);
    const driveMinutes = Math.max(3, Math.round(distanceKm * 2.2));
    const walkMinutes = Math.round(distanceKm * 12);
    return { ...c, distanceKm, driveMinutes, walkMinutes };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}

// Pre-built default list (sorted by distance from KL center)
export const CLINICS: Clinic[] = getClinics();

export type Severity = "low" | "medium" | "high";

export function recommendClinic(
  clinics: Clinic[],
  severity: Severity = "medium",
): Clinic {
  const severityWeight = severity === "high" ? 2.5 : severity === "medium" ? 1.5 : 1;
  const scored = clinics
    .map((c) => {
      const emergencyBonus = severity === "high" && c.emergency ? -15 : 0;
      const score = c.distanceKm * severityWeight * 4 + c.waitMinutes + emergencyBonus;
      return { c, score };
    })
    .sort((a, b) => a.score - b.score);
  return scored[0].c;
}
