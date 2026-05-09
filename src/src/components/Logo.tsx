import logoMark from "@/assets/logo-mark.png";
import logoMarkDark from "@/assets/logo-mark-dark.png";
import logoFull from "@/assets/logo-myclinic.png";
import logoFullDark from "@/assets/logo-myclinic-dark.png";

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  dramatic?: boolean;
  light?: boolean;
}

/**
 * MyClinIQ — auto-swaps to white variant in dark mode.
 */
export function Logo({ size = 40, withWordmark = false, dramatic = false }: LogoProps) {
  if (withWordmark) {
    const style = dramatic
      ? { width: size, maxWidth: "100%", height: "auto" as const }
      : { height: size * 1.1, width: "auto" as const };
    return (
      <div className={`inline-flex items-center justify-center ${dramatic ? "logo-dramatic" : ""}`}>
        <img
          src={logoFull}
          alt="MyClinIQ — Smart Care, Better Health"
          className="block object-contain dark:hidden"
          style={style}
          loading={dramatic ? undefined : "lazy"}
          draggable={false}
        />
        <img
          src={logoFullDark}
          alt="MyClinIQ — Smart Care, Better Health"
          className="hidden object-contain dark:block"
          style={style}
          loading={dramatic ? undefined : "lazy"}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${dramatic ? "logo-dramatic" : ""}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <img
          src={logoMark}
          alt="MyClinIQ"
          width={size}
          height={size}
          className="logo-svg block h-full w-full object-contain dark:hidden"
          loading={dramatic ? undefined : "lazy"}
          draggable={false}
        />
        <img
          src={logoMarkDark}
          alt="MyClinIQ"
          width={size}
          height={size}
          className="logo-svg hidden h-full w-full object-contain dark:block"
          loading={dramatic ? undefined : "lazy"}
          draggable={false}
        />
      </div>
    </div>
  );
}
