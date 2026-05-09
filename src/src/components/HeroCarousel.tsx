import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

const SLIDES = [
  {
    title: "AI Triage in 60 seconds",
    subtitle: "Describe your symptoms, get a clinical-grade severity score.",
    cta: "Start triage",
    to: "/visit",
    img: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?auto=format&fit=crop&w=1200&q=70",
    overlay: "linear-gradient(135deg, rgba(10,24,61,0.85) 0%, rgba(37,99,235,0.55) 100%)",
  },
  {
    title: "Skip the wait",
    subtitle: "Hold your spot remotely with Smart Queue.",
    cta: "View queue",
    to: "/queue",
    img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=70",
    overlay: "linear-gradient(135deg, rgba(10,24,61,0.85) 0%, rgba(0,179,166,0.55) 100%)",
  },
  {
    title: "Family care, simplified",
    subtitle: "Manage records for parents, kids & spouse in one app.",
    cta: "Open profile",
    to: "/profile",
    img: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=70",
    overlay: "linear-gradient(135deg, rgba(10,24,61,0.8) 0%, rgba(124,58,237,0.5) 100%)",
  },
  {
    title: "Wellness library",
    subtitle: "Articles & tips curated for Malaysian families.",
    cta: "Read articles",
    to: "/tips",
    img: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=70",
    overlay: "linear-gradient(135deg, rgba(10,24,61,0.78) 0%, rgba(6,182,212,0.55) 100%)",
  },
] as const;

export function HeroCarousel() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]">
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${slide * 100}%)` }}
      >
        {SLIDES.map((s, i) => (
          <Link
            key={i}
            to={s.to}
            className="relative flex w-full shrink-0 items-end overflow-hidden text-white"
            style={{ minHeight: 200 }}
          >
            <img
              src={s.img}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              className="absolute inset-0 h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0" style={{ background: s.overlay }} />
            <div className="relative flex w-full items-end justify-between p-4">
              <div className="max-w-[70%]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-90">{s.cta}</p>
                <p className="mt-1 text-base font-bold leading-tight drop-shadow">{s.title}</p>
                <p className="mt-0.5 text-[11px] opacity-90">{s.subtitle}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === slide ? "w-6 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
