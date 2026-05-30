"use client";

import { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface CounterStatProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  delay?: number;
  /** Длительность анимации счёта в сек */
  duration?: number;
  accent?: "lime" | "orange";
  className?: string;
}

/**
 * CounterStat — анимированная цифра + label в стиле бенто-карточки.
 * Counter запускается когда элемент попал в viewport.
 *
 * Используется в Slide_14 (Authority цифры: 3 года в AI / 900+ учеников / 7 сервисов / 200+ клиентов).
 */
export function CounterStat({
  value,
  suffix = "",
  prefix = "",
  label,
  delay = 0,
  duration = 1.6,
  accent = "lime",
  className,
}: CounterStatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState(0);

  const color = accent === "lime" ? "#B6FF00" : "#FC5C02";

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now() + delay * 1000;
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = Math.max(0, now - startTime) / 1000;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayValue(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, delay, duration]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 1, 0.5, 1] }}
      className={cn(
        "relative rounded-2xl border border-white/10 overflow-hidden p-5 min-w-0",
        className
      )}
      style={{
        background: "rgba(255,255,255,0.025)",
        backdropFilter: "blur(16px) saturate(160%)",
        WebkitBackdropFilter: "blur(16px) saturate(160%)",
      }}
    >
      {/* corner glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top left, ${color}30 0%, transparent 65%)`,
        }}
      />

      <div className="relative z-10 flex flex-col gap-1.5 min-w-0">
        <div
          className="font-bold leading-[0.95] truncate"
          style={{
            color,
            fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(32px, 3.4vw, 52px)",
            textShadow: `0 0 24px ${color}35`,
          }}
        >
          {prefix}
          {displayValue}
          {suffix}
        </div>
        <div className="text-white/75 text-[11px] md:text-xs uppercase tracking-[0.1em] font-mono leading-tight">
          {label}
        </div>
      </div>
    </motion.div>
  );
}
