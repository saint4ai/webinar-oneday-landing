"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ReactNode, useRef, MouseEvent } from "react";
import { cn } from "@/lib/utils";

interface BrowserWindow3DProps {
  children?: ReactNode;
  url?: string;
  className?: string;
  /** Лайм-glow по периметру */
  glow?: boolean;
  /** Перечёркнутый код (для misconception слайда) */
  crossedOut?: boolean;
}

/**
 * BrowserWindow3D — стилизованное окно браузера с parallax-tilt на mouse.
 *
 * Используется:
 *  - Slide_16 Definition — окно с кодом, лайм-плашка
 *  - Slide_17 Misconception — окно с перечёркнутым кодом (SVG pathLength анимация)
 */
export function BrowserWindow3D({
  children,
  url = "yourapp.kz",
  className,
  glow = true,
  crossedOut = false,
}: BrowserWindow3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateY = useSpring(useTransform(x, [-1, 1], [-8, 8]), { stiffness: 150, damping: 20 });
  const rotateX = useSpring(useTransform(y, [-1, 1], [8, -8]), { stiffness: 150, damping: 20 });

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    x.set(px * 2 - 1);
    y.set(py * 2 - 1);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
        boxShadow: glow
          ? "0 40px 100px -20px rgba(0,0,0,0.85), 0 0 80px -10px rgba(182,255,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 40px 100px -20px rgba(0,0,0,0.85)",
        background: "#0E0E0E",
      }}
      className={cn(
        "relative rounded-xl border border-white/15 overflow-hidden",
        className
      )}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div
          className="flex-1 mx-3 px-3 py-1 rounded-md bg-white/[0.04] text-center text-[11px] text-white/55 font-mono tracking-wider"
        >
          🔒 {url}
        </div>
      </div>

      {/* Body */}
      <div className="relative p-5 md:p-7 min-h-[280px]">
        {children}

        {/* Crossed-out overlay (SVG pathLength анимация) */}
        {crossedOut && (
          <motion.svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <motion.line
              x1="5"
              y1="95"
              x2="95"
              y2="5"
              stroke="#FC5C02"
              strokeWidth="0.8"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, delay: 0.6, ease: "easeInOut" }}
              style={{
                filter: "drop-shadow(0 0 8px rgba(252,92,2,0.6))",
              }}
            />
          </motion.svg>
        )}
      </div>
    </motion.div>
  );
}
