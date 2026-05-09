import { Minus, Plus, RotateCcw, X, Pencil, Eraser, MousePointer2, Trash2 } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import type { BodyRegion } from "./components/SmartSymptomInput";
import bodyFront from "@/assets/body-front.jpg";
import bodyBack from "@/assets/body-back.jpg";

type Spot = {
  id: BodyRegion;
  label: string;
  side: "front" | "back";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};

const SPOTS: Spot[] = [
  // Anatomical left/right = the subject's own left/right, not the viewer's.
  // FRONT view: model faces viewer -> viewer's LEFT side of image = model's RIGHT.
  { id: "head",          side: "front", label: "Head / face",            cx: 50, cy: 9,  rx: 5,  ry: 7 },
  { id: "neck",          side: "front", label: "Neck / throat",          cx: 50, cy: 17, rx: 3,  ry: 2 },
  { id: "rightShoulder", side: "front", label: "Right shoulder",         cx: 41, cy: 21, rx: 4,  ry: 3 },
  { id: "leftShoulder",  side: "front", label: "Left shoulder",          cx: 59, cy: 21, rx: 4,  ry: 3 },
  { id: "chest",         side: "front", label: "Chest",                  cx: 50, cy: 28, rx: 8,  ry: 5 },
  { id: "abdomen",       side: "front", label: "Upper abdomen / stomach",cx: 50, cy: 38, rx: 7,  ry: 4 },
  { id: "pelvis",        side: "front", label: "Pelvis / groin",         cx: 50, cy: 51, rx: 7,  ry: 4 },
  { id: "rightArm",      side: "front", label: "Right upper arm",        cx: 27, cy: 23, rx: 5,  ry: 3 },
  { id: "leftArm",       side: "front", label: "Left upper arm",         cx: 73, cy: 23, rx: 5,  ry: 3 },
  { id: "rightElbow",    side: "front", label: "Right elbow / forearm",  cx: 15, cy: 23, rx: 5,  ry: 2.5 },
  { id: "leftElbow",     side: "front", label: "Left elbow / forearm",   cx: 85, cy: 23, rx: 5,  ry: 2.5 },
  { id: "rightHand",     side: "front", label: "Right wrist / hand",     cx: 5,  cy: 23, rx: 4,  ry: 3 },
  { id: "leftHand",      side: "front", label: "Left wrist / hand",      cx: 95, cy: 23, rx: 4,  ry: 3 },
  { id: "rightLeg",      side: "front", label: "Right thigh",            cx: 44, cy: 65, rx: 4,  ry: 6 },
  { id: "leftLeg",       side: "front", label: "Left thigh",             cx: 56, cy: 65, rx: 4,  ry: 6 },
  { id: "rightKnee",     side: "front", label: "Right knee",             cx: 44, cy: 76, rx: 3,  ry: 2.5 },
  { id: "leftKnee",      side: "front", label: "Left knee",              cx: 56, cy: 76, rx: 3,  ry: 2.5 },
  { id: "rightFoot",     side: "front", label: "Right shin / foot",      cx: 44, cy: 90, rx: 3.5,ry: 6 },
  { id: "leftFoot",      side: "front", label: "Left shin / foot",       cx: 56, cy: 90, rx: 3.5,ry: 6 },
  // BACK view: model faces away -> viewer's LEFT side of image = model's LEFT.
  { id: "head",          side: "back", label: "Back of head",           cx: 50, cy: 10, rx: 5,  ry: 6 },
  { id: "neck",          side: "back", label: "Nape / neck",            cx: 50, cy: 17, rx: 3,  ry: 2 },
  { id: "leftShoulder",  side: "back", label: "Left shoulder blade",    cx: 41, cy: 22, rx: 4,  ry: 3 },
  { id: "rightShoulder", side: "back", label: "Right shoulder blade",   cx: 59, cy: 22, rx: 4,  ry: 3 },
  { id: "upperBack",     side: "back", label: "Upper back / spine",     cx: 50, cy: 30, rx: 8,  ry: 5 },
  { id: "lowerBack",     side: "back", label: "Lower back / lumbar",    cx: 50, cy: 42, rx: 7,  ry: 4 },
  { id: "pelvis",        side: "back", label: "Hip / buttock",          cx: 50, cy: 53, rx: 8,  ry: 5 },
  { id: "leftArm",       side: "back", label: "Left upper arm",         cx: 27, cy: 23, rx: 5,  ry: 3 },
  { id: "rightArm",      side: "back", label: "Right upper arm",        cx: 73, cy: 23, rx: 5,  ry: 3 },
  { id: "leftElbow",     side: "back", label: "Left elbow / forearm",   cx: 15, cy: 23, rx: 5,  ry: 2.5 },
  { id: "rightElbow",    side: "back", label: "Right elbow / forearm",  cx: 85, cy: 23, rx: 5,  ry: 2.5 },
  { id: "leftHand",      side: "back", label: "Left wrist / hand",      cx: 5,  cy: 23, rx: 4,  ry: 3 },
  { id: "rightHand",     side: "back", label: "Right wrist / hand",     cx: 95, cy: 23, rx: 4,  ry: 3 },
  { id: "leftLeg",       side: "back", label: "Left hamstring",         cx: 44, cy: 65, rx: 4,  ry: 6 },
  { id: "rightLeg",      side: "back", label: "Right hamstring",        cx: 56, cy: 65, rx: 4,  ry: 6 },
  { id: "leftKnee",      side: "back", label: "Left calf",              cx: 44, cy: 76, rx: 3,  ry: 2.5 },
  { id: "rightKnee",     side: "back", label: "Right calf",             cx: 56, cy: 76, rx: 3,  ry: 2.5 },
  { id: "leftFoot",      side: "back", label: "Left heel / ankle",      cx: 44, cy: 90, rx: 3.5,ry: 6 },
  { id: "rightFoot",     side: "back", label: "Right heel / ankle",     cx: 56, cy: 90, rx: 3.5,ry: 6 },
];

type Stroke = { points: { x: number; y: number }[]; size: number };

function nearestRegion(x: number, y: number, side: "front" | "back"): BodyRegion | null {
  let best: { id: BodyRegion; d: number } | null = null;
  for (const s of SPOTS) {
    if (s.side !== side) continue;
    const d = Math.hypot(x - s.cx, y - s.cy);
    if (!best || d < best.d) best = { id: s.id, d };
  }
  return best && best.d < 18 ? best.id : null;
}

function PhotoBody({
  src,
  side,
  selected,
  onToggle,
  onDrawRegion,
  zoom,
  alt,
  mode,
  brushSize,
}: {
  src: string;
  side: "front" | "back";
  selected: BodyRegion[];
  onToggle: (r: BodyRegion) => void;
  onDrawRegion: (r: BodyRegion) => void;
  zoom: number;
  alt: string;
  mode: "tap" | "draw" | "erase";
  brushSize: number;
}) {
  const spots = SPOTS.filter((s) => s.side === side);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const drawingRef = useRef<Stroke | null>(null);
  const [, setTick] = useState(0);

  // Reset strokes when switching side or src
  useEffect(() => { setStrokes([]); }, [side]);

  const toPct = (clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * 100, y: ((clientY - r.top) / r.height) * 100 };
  };

  const start = (clientX: number, clientY: number) => {
    if (mode !== "draw") return;
    const p = toPct(clientX, clientY);
    if (!p) return;
    drawingRef.current = { points: [p], size: brushSize };
    setStrokes((s) => [...s, drawingRef.current!]);
    setTick((t) => t + 1);
  };
  const move = (clientX: number, clientY: number) => {
    if (mode !== "draw" || !drawingRef.current) return;
    const p = toPct(clientX, clientY);
    if (!p) return;
    drawingRef.current.points.push(p);
    setTick((t) => t + 1);
  };
  const end = () => {
    if (!drawingRef.current) return;
    const stroke = drawingRef.current;
    drawingRef.current = null;
    // Map stroke center to nearest region and select it
    if (stroke.points.length > 0) {
      const cx = stroke.points.reduce((a, b) => a + b.x, 0) / stroke.points.length;
      const cy = stroke.points.reduce((a, b) => a + b.y, 0) / stroke.points.length;
      const r = nearestRegion(cx, cy, side);
      if (r && !selected.includes(r)) onDrawRegion(r);
    }
  };

  return (
    <div
      ref={wrapRef}
      className="relative inline-block touch-none select-none"
      style={{ width: `${Math.round(100 * zoom)}%`, minWidth: 240 }}
      onMouseDown={(e) => start(e.clientX, e.clientY)}
      onMouseMove={(e) => move(e.clientX, e.clientY)}
      onMouseUp={end}
      onMouseLeave={end}
      onTouchStart={(e) => { const t = e.touches[0]; start(t.clientX, t.clientY); }}
      onTouchMove={(e) => { const t = e.touches[0]; move(t.clientX, t.clientY); }}
      onTouchEnd={end}
    >
      <img src={src} alt={alt} className="block w-full rounded-xl" draggable={false} loading="lazy" />

      {/* Strokes layer */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
        {strokes.map((s, i) => (
          <polyline
            key={i}
            points={s.points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#E6332A"
            strokeWidth={s.size}
            strokeOpacity={0.65}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* Hotspots only when tap mode */}
      {mode === "tap" && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
          {spots.map((s, i) => {
            const active = selected.includes(s.id);
            return (
              <ellipse
                key={`${side}-${s.id}-${i}`}
                cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}
                fill={active ? "#E6332A" : "#1D5EFF"}
                opacity={active ? 0.55 : 0.18}
                stroke={active ? "#7A0F0A" : "#FFFFFF"}
                strokeWidth={active ? 0.6 : 0.3}
                vectorEffect="non-scaling-stroke"
                role="button"
                tabIndex={0}
                aria-label={s.label}
                onClick={() => onToggle(s.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onToggle(s.id); }}
                className="pointer-events-auto cursor-pointer transition-opacity hover:opacity-70 focus:outline-none"
              />
            );
          })}
        </svg>
      )}

      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white">
        {side}
      </div>
    </div>
  );
}

export function Body3D({ selected, onToggleRegion }: { selected: BodyRegion[]; onToggleRegion: (r: BodyRegion) => void }) {
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState<"front" | "back">("front");
  const [mode, setMode] = useState<"tap" | "draw" | "erase">("draw");
  const [brushSize, setBrushSize] = useState(3);
  const [clearKey, setClearKey] = useState(0);

  const selectedLabels = useMemo(() => {
    const seen = new Set<string>();
    return SPOTS.filter((p) => {
      const key = `${p.side}-${p.id}`;
      if (!selected.includes(p.id) || seen.has(key)) return false;
      seen.add(key);
      return p.side === view;
    });
  }, [selected, view]);

  const addRegion = (r: BodyRegion) => { if (!selected.includes(r)) onToggleRegion(r); };

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Real human body map</p>
          <p className="mt-0.5 text-sm font-bold text-foreground">Draw on the body where it hurts</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))} className="glass flex h-8 w-8 items-center justify-center rounded-full" aria-label="Zoom out"><Minus className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => setZoom((z) => Math.min(2.4, z + 0.15))} className="glass flex h-8 w-8 items-center justify-center rounded-full" aria-label="Zoom in"><Plus className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => setZoom(1)} className="glass flex h-8 w-8 items-center justify-center rounded-full" aria-label="Reset zoom"><RotateCcw className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {/* Mode + brush controls */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          <button onClick={() => setMode("draw")} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider ${mode === "draw" ? "btn-glow text-primary-foreground" : "text-muted-foreground"}`}><Pencil className="h-3 w-3" /> Draw</button>
          <button onClick={() => setMode("tap")} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider ${mode === "tap" ? "btn-glow text-primary-foreground" : "text-muted-foreground"}`}><MousePointer2 className="h-3 w-3" /> Tap</button>
        </div>
        {mode === "draw" && (
          <>
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2 py-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Brush</span>
              <input type="range" min={1} max={8} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="h-1 w-20 cursor-pointer" />
            </div>
            <button onClick={() => { setClearKey((k) => k + 1); selected.forEach((r) => onToggleRegion(r)); }} className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          </>
        )}
        <div className="ml-auto inline-flex rounded-xl border border-border bg-card p-1">
          <button onClick={() => setView("front")} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${view === "front" ? "btn-glow text-primary-foreground" : "text-muted-foreground"}`}>Front</button>
          <button onClick={() => setView("back")} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${view === "back" ? "btn-glow text-primary-foreground" : "text-muted-foreground"}`}>Back</button>
        </div>
      </div>

      <div className="mt-3 h-[520px] overflow-auto rounded-xl border border-border bg-surface-elevated p-2 text-center">
        <PhotoBody
          key={`${view}-${clearKey}`}
          src={view === "front" ? bodyFront : bodyBack}
          side={view}
          selected={selected}
          onToggle={onToggleRegion}
          onDrawRegion={addRegion}
          zoom={zoom}
          alt={view === "front" ? "Adult human body, front view" : "Adult human body, back view"}
          mode={mode}
          brushSize={brushSize}
        />
      </div>

      {selectedLabels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selectedLabels.map((part) => (
            <button key={`${part.side}-${part.id}`} onClick={() => onToggleRegion(part.id)} className="flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-[11px] font-bold text-destructive">
              {part.label} <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
