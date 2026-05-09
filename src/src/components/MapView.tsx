import { Clinic } from "@/lib/clinics";
import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Loader2, Navigation } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  clinics: Clinic[];
  recommendedId?: string;
  onSelect?: (c: Clinic) => void;
}

const KL_CENTER: [number, number] = [3.139, 101.6869];

function clinicLatLng(c: Clinic): [number, number] {
  return [c.lat, c.lng];
}

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const sa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(sa));
}

function pinIcon(color: string, label = "+") {
  return L.divIcon({
    className: "mycliniq-pin",
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;line-height:1;">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  });
}

export function MapView({ clinics, recommendedId, onSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyRef = useRef<L.Circle | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [selected, setSelected] = useState<Clinic | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const hasCenteredRef = useRef(false);

  // init map once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: KL_CENTER,
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Helper: place / update the user marker + accuracy circle
  const placeUser = (p: [number, number], acc: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(p);
    } else {
      userMarkerRef.current = L.marker(p, { icon: pinIcon("#3b82f6", "•") })
        .addTo(map)
        .bindPopup("You are here");
    }
    if (userAccuracyRef.current) {
      userAccuracyRef.current.setLatLng(p).setRadius(acc);
    } else {
      userAccuracyRef.current = L.circle(p, {
        radius: acc,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.12,
        weight: 1,
      }).addTo(map);
    }
  };

  // Real geolocation watch — high accuracy, no cache, longer timeout
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocError("Geolocation not supported on this device");
      return;
    }
    setLocating(true);
    // First, ask for a one-shot fix so the UI updates fast
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(p);
        setAccuracy(pos.coords.accuracy);
        setLocating(false);
        placeUser(p, pos.coords.accuracy);
      },
      (err) => {
        setLocating(false);
        setLocError(err.message || "Could not get your location");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );

    // Then, keep refining with a watch
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(p);
        setAccuracy(pos.coords.accuracy);
        placeUser(p, pos.coords.accuracy);
      },
      (err) => setLocError(err.message || "Location error"),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Re-rank clinics by real distance from user; nearest = recommended
  const ranked = useMemo(() => {
    if (!userPos) return clinics.map((c) => ({ ...c }));
    return clinics
      .map((c) => ({
        ...c,
        distanceKm: +haversineKm(userPos, [c.lat, c.lng]).toFixed(2),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [clinics, userPos]);

  const effectiveRecommendedId = userPos ? ranked[0]?.id : recommendedId;

  // refresh markers when clinics or recommended change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Only render the closest 80 to keep the map fast even with 400+ clinics
    const visible = ranked.slice(0, 80);
    visible.forEach((c) => {
      const isRec = c.id === effectiveRecommendedId;
      const color = isRec ? "#16a34a" : c.emergency ? "#dc2626" : "#0A1A4A";
      const pos = clinicLatLng(c);
      const marker = L.marker(pos, { icon: pinIcon(color, isRec ? "★" : "+") }).addTo(map);
      marker.bindPopup(
        `<div style="font-family:inherit"><strong>${c.name}${isRec ? " — Nearest" : ""}</strong><br/><span style="opacity:.75">${c.address || c.state}</span><br/>${c.distanceKm} km · ${c.waitMinutes}m wait · ${c.queueLoad} load</div>`,
      );
      marker.on("click", () => {
        setSelected(c);
        map.panTo(pos);
      });
      markersRef.current.push(marker);
    });

    // Fit bounds once when we first know the user location, then leave the map alone
    // so the user can pan/zoom freely without it snapping back.
    if (userPos && !hasCenteredRef.current && markersRef.current.length > 0) {
      const focus: L.Layer[] = markersRef.current.slice(0, 5);
      if (userMarkerRef.current) focus.push(userMarkerRef.current);
      const group = L.featureGroup(focus as L.Marker[]);
      map.fitBounds(group.getBounds().pad(0.3), { maxZoom: 15 });
      hasCenteredRef.current = true;
    }
  }, [ranked, effectiveRecommendedId, userPos]);

  const recenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (userPos) {
      map.flyTo(userPos, 15, { duration: 0.6 });
      return;
    }
    if (!navigator.geolocation) return;
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(p);
        setAccuracy(pos.coords.accuracy);
        setLocating(false);
        placeUser(p, pos.coords.accuracy);
        map.flyTo(p, 15, { duration: 0.6 });
      },
      (err) => {
        setLocating(false);
        setLocError(err.message || "Could not get your location");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative h-[340px] overflow-hidden rounded-2xl border border-border/60">
        <div ref={mapRef} className="absolute inset-0 z-0" />

        {/* Recenter / locate-me button */}
        <button
          type="button"
          onClick={recenter}
          aria-label="Center on my location"
          className="absolute bottom-3 right-3 z-[400] flex h-11 w-11 items-center justify-center rounded-full bg-background/95 text-primary shadow-[0_4px_12px_rgba(0,0,0,0.18)] ring-1 ring-border backdrop-blur transition-transform active:scale-95"
        >
          {locating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Crosshair className="h-5 w-5" strokeWidth={2.2} />
          )}
        </button>

        {/* Location status pill */}
        {(userPos || locError) && (
          <div className="pointer-events-none absolute left-3 top-3 z-[400] rounded-full bg-background/95 px-3 py-1 text-[11px] font-medium text-foreground shadow ring-1 ring-border backdrop-blur">
            {locError ? (
              <span className="text-destructive">⚠ {locError}</span>
            ) : (
              <span>
                📍 Live location
                {accuracy ? ` · ±${Math.round(accuracy)}m` : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {selected && (
        <div className="glass animate-float-up rounded-2xl p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-foreground">{selected.name}</h4>
              <p className="text-[11px] text-muted-foreground">
                {selected.distanceKm} km · {selected.waitMinutes}m wait · {selected.queueLoad} load
              </p>
            </div>
            {onSelect && (
              <button
                onClick={() => onSelect(selected)}
                className="btn-glow inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground"
              >
                <Navigation className="h-3 w-3" />
                Select
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
