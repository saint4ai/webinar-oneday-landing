"use client";

import { motion } from "framer-motion";

/**
 * MarkerReveal — выделение термина маркером, который «прорисовывается» слева направо
 * (clip-path swipe, свежий приём из 21st.dev). Лайм для выгод, оранж для боли/алертов.
 */
export function MarkerReveal({
  children,
  color = "#B6FF00",
  textColor = "#0A0B0F",
  delay = 0.3,
  className,
}: {
  children: React.ReactNode;
  color?: string;
  textColor?: string;
  delay?: number;
  className?: string;
}) {
  return (
    <span className={`relative inline-block ${className ?? ""}`}>
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-[0.18em]"
        style={{ background: color }}
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.55, delay, ease: [0.25, 1, 0.5, 1] }}
      />
      <span className="relative px-[0.22em] font-bold" style={{ color: textColor }}>
        {children}
      </span>
    </span>
  );
}
