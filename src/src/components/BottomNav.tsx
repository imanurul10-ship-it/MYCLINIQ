import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Ticket, BookOpen, User, LayoutGrid, Stethoscope, Bell, FileCheck2, X, Sparkles, CalendarClock, Pill, HeartPulse } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";

const tabs = [
  { to: "/", labelKey: "home", icon: Home, exact: true },
  { to: "/queue", labelKey: "queue", icon: Ticket, exact: false },
  { key: "menu", labelKey: "menu", icon: LayoutGrid },
  { to: "/tips", labelKey: "library", icon: BookOpen, exact: false },
  { to: "/profile", labelKey: "profile", icon: User, exact: false },
] as const;

// Semicircle menu: center = Visit, left arc = bookings + meds, right arc = MC + recovery
// Angles measured from +x axis, going counter-clockwise (negative = upper half).
type RadialItem = { to: string; label: string; icon: any; angle: number; primary?: boolean };
const radialItems: RadialItem[] = [
  { to: "/visit", label: "Visit", icon: Stethoscope, angle: -90, primary: true },
  { to: "/bookings", label: "Bookings", icon: CalendarClock, angle: -140 },
  { to: "/meds", label: "Meds", icon: Pill, angle: -170 },
  { to: "/certificates", label: "MC", icon: FileCheck2, angle: -40 },
  { to: "/recovery", label: "Recovery", icon: HeartPulse, angle: -10 },
];

export function BottomNav() {
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close menu whenever route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Draggable floating chat button
  const FAB_SIZE = { w: 130, h: 56 };
  const [fabPos, setFabPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean; pointerId: number } | null>(null);

  // Initialize position bottom-right once we have window
  useEffect(() => {
    if (fabPos) return;
    if (typeof window === "undefined") return;
    setFabPos({
      x: window.innerWidth - FAB_SIZE.w - 16,
      y: window.innerHeight - FAB_SIZE.h - 110,
    });
  }, [fabPos]);

  // Keep within viewport on resize
  useEffect(() => {
    const onResize = () => {
      setFabPos((p) => {
        if (!p) return p;
        return {
          x: Math.min(Math.max(8, p.x), window.innerWidth - FAB_SIZE.w - 8),
          y: Math.min(Math.max(8, p.y), window.innerHeight - FAB_SIZE.h - 8),
        };
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!fabPos) return;
    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: fabPos.x,
      origY: fabPos.y,
      moved: false,
      pointerId: e.pointerId,
    };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > 5) d.moved = true;
    if (d.moved) {
      setFabPos({
        x: Math.min(Math.max(8, d.origX + dx), window.innerWidth - FAB_SIZE.w - 8),
        y: Math.min(Math.max(8, d.origY + dy), window.innerHeight - FAB_SIZE.h - 8),
      });
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && !d.moved) {
      navigate({ to: "/ai-chat" });
    }
  };

  return (
    <>
      {/* Floating AI Doctor — draggable */}
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { dragRef.current = null; }}
        className="fixed z-50 flex touch-none items-center gap-2 rounded-full bg-gradient-to-r from-accent to-primary px-4 py-2.5 text-white shadow-[0_8px_24px_-4px_oklch(0.55_0.22_22/0.55)] transition-transform active:scale-95"
        style={{
          left: fabPos ? `${fabPos.x}px` : undefined,
          top: fabPos ? `${fabPos.y}px` : undefined,
          right: fabPos ? undefined : "1rem",
          bottom: fabPos ? undefined : "110px",
          width: `${FAB_SIZE.w}px`,
          height: `${FAB_SIZE.h}px`,
          touchAction: "none",
          cursor: "grab",
        }}
        aria-label="Talk to Dr. Clinic (drag to move)"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur">
          <Sparkles className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-accent">?</span>
        </span>
        <span className="text-left text-[11px] font-bold leading-tight">
          Talk to <br />Dr. Clinic!
        </span>
      </button>

      {/* Menu drawer (left side, full-height) */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />
          {/* Semicircular dome menu: full-width, anchored to bottom */}
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center">
            <div
              className="pointer-events-auto relative animate-float-up"
              style={{
                width: "100vw",
                height: "50vw",
                maxHeight: "320px",
              }}
            >
              {/* Red halo glow behind primary button (top center of semicircle) */}
              <div
                className="pointer-events-none absolute left-1/2 -translate-x-1/2"
                style={{
                  top: "10%",
                  width: "40%",
                  height: "40%",
                  background:
                    "radial-gradient(50% 50% at 50% 50%, oklch(0.65 0.25 22 / 0.55) 0%, oklch(0.65 0.25 22 / 0.18) 45%, transparent 70%)",
                  filter: "blur(8px)",
                }}
              />

              {/* Semicircle surface */}
              <div
                className="absolute inset-0 overflow-hidden border border-white/15 bg-white/40 dark:border-white/10 dark:bg-black/30"
                style={{
                  borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
                  backdropFilter: "blur(28px) saturate(160%)",
                  WebkitBackdropFilter: "blur(28px) saturate(160%)",
                  boxShadow:
                    "0 1px 0 0 oklch(1 0 0 / 0.35) inset, 0 -1px 0 0 oklch(1 0 0 / 0.08) inset, 0 24px 60px -20px oklch(0 0 0 / 0.4)",
                }}
              />
              {/* Subtle inner gradient overlay */}
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden opacity-90 dark:opacity-100"
                style={{
                  borderRadius: "50% 50% 0 0 / 100% 100% 0 0",
                  background:
                    "radial-gradient(80% 80% at 50% 100%, oklch(0.65 0.25 22 / 0.18) 0%, transparent 55%), linear-gradient(180deg, transparent 0%, oklch(0 0 0 / 0.15) 100%)",
                }}
              />

              {radialItems.map((item) => {
                const Icon = item.icon;
                // Evenly spaced along the semicircular arc (20° to 160°)
                const angleMap: Record<string, number> = {
                  Bookings: 160,
                  Meds: 125,
                  Visit: 90,
                  Recovery: 55,
                  MC: 20,
                };
                const deg = angleMap[item.label] ?? 90;
                const rad = (deg * Math.PI) / 180;
                // Container is 2:1 (W:H). Place items on arc of radius ~0.72*H from bottom-center.
                const xPct = 50 + 36 * Math.cos(rad);
                const yPct = 100 - 72 * Math.sin(rad);
                return (
                  <Link
                    key={item.to}
                    to={item.to.split("#")[0]}
                    hash={item.to.includes("#") ? item.to.split("#")[1] : undefined}
                    onClick={() => setMenuOpen(false)}
                    className="absolute flex flex-col items-center gap-1.5"
                    style={{
                      left: `${xPct}%`,
                      top: `${yPct}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <span
                      className={`flex items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 ${
                        item.primary
                          ? "h-[68px] w-[68px] text-white"
                          : "h-[56px] w-[56px] text-foreground dark:text-white"
                      }`}
                      style={
                        item.primary
                          ? {
                              background:
                                "radial-gradient(circle at 38% 30%, oklch(0.78 0.20 22) 0%, oklch(0.60 0.24 22) 55%, oklch(0.48 0.22 20) 100%)",
                              boxShadow:
                                "0 0 32px 4px oklch(0.62 0.25 22 / 0.55), 0 10px 28px -6px oklch(0.55 0.24 22 / 0.5), 0 0 0 1px oklch(1 0 0 / 0.35) inset, 0 2px 0 0 oklch(1 0 0 / 0.4) inset",
                            }
                          : {
                              background:
                                "linear-gradient(160deg, oklch(1 0 0 / 0.22) 0%, oklch(1 0 0 / 0.06) 100%)",
                              boxShadow:
                                "0 6px 18px -6px oklch(0 0 0 / 0.35), 0 0 0 1px oklch(1 0 0 / 0.35) inset, 0 1px 0 0 oklch(1 0 0 / 0.4) inset",
                              backdropFilter: "blur(10px)",
                              WebkitBackdropFilter: "blur(10px)",
                            }
                      }
                    >
                      <Icon className={item.primary ? "h-7 w-7" : "h-[22px] w-[22px]"} strokeWidth={1.9} />
                    </span>
                    <span className="text-[11px] font-medium tracking-wide text-foreground dark:text-white/95">
                      {item.label}
                    </span>
                  </Link>
                );
              })}

              {/* Close button — glass circle on the flat base */}
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="absolute left-1/2 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full text-foreground dark:text-white transition-transform hover:scale-105 active:scale-95"
                style={{
                  bottom: "max(0.75rem, env(safe-area-inset-bottom))",
                  background:
                    "linear-gradient(160deg, oklch(1 0 0 / 0.22) 0%, oklch(1 0 0 / 0.06) 100%)",
                  boxShadow:
                    "0 6px 18px -6px oklch(0 0 0 / 0.4), 0 0 0 1px oklch(1 0 0 / 0.35) inset, 0 1px 0 0 oklch(1 0 0 / 0.4) inset",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
              >
                <X className="h-5 w-5" strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </>
      )}

      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[440px] -translate-x-1/2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <div className="glass-strong relative overflow-hidden rounded-2xl">
          <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="flex items-center justify-around px-2 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              if ("key" in tab) {
                return (
                  <button
                    key="menu"
                    type="button"
                    onClick={() => setMenuOpen(true)}
                    className={`group relative flex min-w-[56px] shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-colors ${menuOpen ? "text-primary" : "text-muted-foreground"}`}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                    <span className="text-[9px] font-semibold tracking-wide whitespace-nowrap">{t(tab.labelKey)}</span>
                  </button>
                );
              }
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  activeOptions={{ exact: tab.exact }}
                  className="group relative flex min-w-[56px] shrink-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-muted-foreground transition-colors data-[status=active]:text-primary"
                >
                  <span className="pointer-events-none absolute inset-x-3 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition-all duration-300 group-data-[status=active]:scale-x-100 group-data-[status=active]:opacity-100" />
                  <Icon
                    className="h-[18px] w-[18px] transition-all group-data-[status=active]:drop-shadow-[0_0_6px_oklch(0.62_0.22_255/0.7)]"
                    strokeWidth={2}
                  />
                  <span className="text-[9px] font-semibold tracking-wide whitespace-nowrap">{t(tab.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
