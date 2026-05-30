"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  title: string;
  body?: string | ReactNode;
  icon?: ReactNode;
  accent?: "lime" | "orange" | "none";
  delay?: number;
  className?: string;
  children?: ReactNode;
}

/**
 * BentoCard — glassmorphism-карточка для bento-сетки.
 * Используется в Slide_05 (3 бонуса), Slide_07 (программа эфира), Slide_08 (что получите), Slide_14 (статы).
 *
 * Структура:
 *  - rgba bg + backdrop-blur (стекло)
 *  - 1px border (subtle)
 *  - hover: lift + accent glow (lime / orange / off)
 *  - stagger appear через delay prop
 */
export function BentoCard({
  title,
  body,
  icon,
  accent = "lime",
  delay = 0,
  className,
  children,
}: BentoCardProps) {
  const accentColor =
    accent === "lime"
      ? "#B6FF00"
      : accent === "orange"
        ? "#FC5C02"
        : "transparent";

  const hoverGlow =
    accent === "none"
      ? "none"
      : `0 0 40px -8px ${accentColor}55, inset 0 1px 0 rgba(255,255,255,0.08)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.25, 1, 0.5, 1] }}
      whileHover={{
        y: -4,
        boxShadow: hoverGlow,
      }}
      className={cn(
        "relative rounded-2xl border border-white/10 overflow-hidden p-6 group",
        className
      )}
      style={{
        background: "rgba(255,255,255,0.025)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
      }}
    >
      {/* Accent corner gradient */}
      {accent !== "none" && (
        <div
          className="absolute inset-0 opacity-15 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top right, ${accentColor}40 0%, transparent 60%)`,
          }}
        />
      )}

      <div className="relative z-10 flex flex-col gap-3 h-full">
        {icon && (
          <div className="text-3xl" style={{ color: accentColor }}>
            {icon}
          </div>
        )}
        <h3
          className="font-bold uppercase text-white text-base md:text-lg tracking-[-0.01em]"
          style={{ fontFamily: "var(--font-benzin), system-ui, sans-serif" }}
        >
          {title}
        </h3>
        {body && (
          <div className="text-white/75 text-sm md:text-base leading-snug">
            {body}
          </div>
        )}
        {children}
      </div>
    </motion.div>
  );
}
