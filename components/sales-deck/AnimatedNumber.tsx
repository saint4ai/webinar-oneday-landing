"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { PulsingBorder } from "@paper-design/shaders-react";

interface AnimatedNumberProps {
  value: number;
  suffix?: string;
  duration?: number;
  withBorder?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
}

/**
 * Анимированная цифра-герой с counter-up + pulsing border (опц).
 * Используется для «900+», «₸ 11.5М», «250+» и подобных шок-цифр.
 *
 * Брендовая палитра pulse-border: Acid Green + Orange + White (из CSS vars).
 */
export function AnimatedNumber({
  value,
  suffix = "+",
  duration = 1.8,
  withBorder = true,
  size = "lg",
  label,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    let rafId = 0;
    const tick = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.floor(value * eased));
      if (progress < 1) rafId = requestAnimationFrame(tick);
      else setDisplayed(value);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [inView, value, duration]);

  const sizes = {
    sm: { num: "clamp(56px, 5vw, 88px)", padding: "20px 28px" },
    md: { num: "clamp(72px, 7vw, 120px)", padding: "28px 40px" },
    lg: { num: "clamp(100px, 10vw, 180px)", padding: "32px 56px" },
    xl: { num: "clamp(140px, 14vw, 260px)", padding: "40px 72px" },
  };

  return (
    <div ref={ref} className="relative inline-flex flex-col items-center">
      {/* Pulse border на фоне цифры */}
      {withBorder && inView && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <PulsingBorder
            colors={["#B6FF00", "#FF5A1F", "#B6FF00", "#FFFFFF"]}
            colorBack="#00000000"
            speed={1.2}
            roundness={0.25}
            thickness={0.06}
            softness={0.5}
            intensity={3.5}
            spots={4}
            spotSize={0.15}
            pulse={0.15}
            smoke={0.3}
            smokeSize={3}
            scale={1.1}
            style={{
              width: "110%",
              height: "110%",
              borderRadius: "16px",
            }}
          />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 12 }}
        animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10"
        style={{
          padding: sizes[size].padding,
          background: "rgba(5, 5, 5, 0.6)",
          backdropFilter: "blur(8px)",
          borderRadius: "14px",
          border: "1px solid rgba(182, 255, 0, 0.15)",
        }}
      >
        <div
          className="font-bold leading-[0.95] tracking-[-0.05em] text-[#B6FF00]"
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: sizes[size].num,
            textShadow: "0 0 60px rgba(182, 255, 0, 0.4)",
          }}
        >
          {displayed.toLocaleString("ru-RU")}
          <span style={{ fontSize: "0.55em" }}>{suffix}</span>
        </div>
      </motion.div>

      {label && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-4 font-mono text-[11px] tracking-[0.2em] uppercase text-white/55 text-center max-w-[300px]"
        >
          {label}
        </motion.div>
      )}
    </div>
  );
}
