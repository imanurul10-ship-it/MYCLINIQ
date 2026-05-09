import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

/** Theme toggle only — the app is English-only. Component name kept for compatibility. */
export function LangToggle({ compact = false }: { compact?: boolean }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mycliniq-theme");
    const nextDark = saved === "dark";
    document.documentElement.classList.toggle("dark", nextDark);
    setDark(nextDark);
  }, []);

  const toggleTheme = () => {
    const nextDark = !dark;
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("mycliniq-theme", nextDark ? "dark" : "light");
    setDark(nextDark);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/85 px-3 py-1.5 font-bold shadow-sm backdrop-blur transition hover:border-primary/50 ${compact ? "text-[10px]" : "text-[11px]"}`}
    >
      {dark ? <Sun className="h-3.5 w-3.5 text-warning" /> : <Moon className="h-3.5 w-3.5 text-primary" />}
      <span className="uppercase tracking-wider">{dark ? "Light" : "Dark"}</span>
    </button>
  );
}
