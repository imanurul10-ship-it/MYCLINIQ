import { ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";
import { useApp } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  const onboarded = useApp((s) => s.onboarded);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!onboarded) {
      navigate({ to: "/welcome" });
      return;
    }
    if (!user) {
      navigate({ to: "/auth" });
    }
  }, [onboarded, user, loading, navigate]);

  return (
    <div className="min-h-screen w-full bg-surface">
      <div
        className="bg-blue-maroon relative mx-auto min-h-screen w-full max-w-[440px] overflow-hidden pb-28"
        style={{
          boxShadow:
            "0 0 80px -20px oklch(0.5 0.22 265 / 0.25), 0 0 0 1px oklch(1 0 0 / 0.04)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ background: "var(--gradient-mesh)" }}
        />
        <div className="relative z-10">{children}</div>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
