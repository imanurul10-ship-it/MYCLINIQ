import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

/**
 * Functional QR ticket — encodes a JSON payload with queue/check-in info.
 * Renders to a real <canvas> via the qrcode library.
 */
export function QRTicket({
  payload,
  size = 200,
  label,
}: {
  payload: Record<string, unknown> | string;
  size?: number;
  label?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    const data = typeof payload === "string" ? payload : JSON.stringify(payload);
    setText(data);
    if (ref.current) {
      QRCode.toCanvas(ref.current, data, {
        width: size,
        margin: 1,
        color: {
          dark: "#0A183D",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
      }).catch(() => {});
    }
  }, [payload, size]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-2xl bg-white p-3 shadow-[0_0_40px_rgba(56,189,248,0.35)]">
        <canvas ref={ref} width={size} height={size} aria-label="Queue QR code" />
      </div>
      {label && <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>}
      <p className="max-w-[260px] truncate font-mono text-[9px] text-muted-foreground/80" title={text}>
        {text}
      </p>
    </div>
  );
}
