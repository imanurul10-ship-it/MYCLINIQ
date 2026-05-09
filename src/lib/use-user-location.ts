import { useEffect, useState } from "react";
import { DEFAULT_USER_LOCATION } from "./clinics";

export type UserLoc = { lat: number; lng: number };

/**
 * Returns the user's real geolocation (high accuracy).
 * Falls back to KL center until a fix is received.
 */
export function useUserLocation(): { loc: UserLoc; ready: boolean; error: string | null } {
  const [loc, setLoc] = useState<UserLoc>(DEFAULT_USER_LOCATION);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setReady(true);
      },
      (err) => setError(err.message || "Could not get location"),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setReady(true);
      },
      (err) => setError(err.message || "Location error"),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { loc, ready, error };
}
