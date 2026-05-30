"use client";

import { CSSProperties, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * BorderBeam — бегущий по периметру карточки огонёк-glow (свежий приём из 21st.dev,
 * адаптирован под бренд). Кладётся внутрь relative+overflow-hidden+rounded карточки.
 * color: лайм (#B6FF00) для «решений/выгод», оранж (#FC5C02) для «боли/алертов».
 */
interface BorderBeamProps {
  lightWidth?: number;
  duration?: number;
  color?: string;
  borderWidth?: number;
  delay?: number;
  className?: string;
}

export function BorderBeam({
  lightWidth = 140,
  duration = 7,
  color = "#B6FF00",
  borderWidth = 1.5,
  delay = 0,
  className,
}: BorderBeamProps) {
  const pathRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const div = pathRef.current;
      if (div) div.style.setProperty("--path", `path("M 0 0 H ${div.offsetWidth} V ${div.offsetHeight} H 0 V 0")`);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div
      ref={pathRef}
      style={{ "--border-width": `${borderWidth}px` } as CSSProperties}
      className={cn(
        "absolute inset-0 z-0 h-full w-full rounded-[inherit] pointer-events-none",
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect]",
        "[mask:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]",
        "border-[length:var(--border-width)] border-transparent",
        className
      )}
    >
      <motion.div
        className="absolute inset-0 aspect-square"
        style={{
          width: `${lightWidth}px`,
          offsetPath: "var(--path)",
          background: `radial-gradient(ellipse at center, ${color}, transparent 60%, transparent)`,
        } as CSSProperties}
        animate={{ offsetDistance: ["0%", "100%"] }}
        transition={{ duration, repeat: Infinity, ease: "linear", delay }}
      />
    </div>
  );
}
