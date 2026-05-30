"use client";

import { motion } from "framer-motion";
import { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
  text: string;
  className?: string;
  /** subtle — лёгкий повторяющийся; heavy — резкий разовый при появлении */
  intensity?: "subtle" | "heavy";
  /** Зацикливать или один раз */
  loop?: boolean;
  /** Колор-сдвиг (RGB-split): лайм/оранж */
  style?: CSSProperties;
}

/**
 * GlitchText — текст с RGB-split + glitch-кадрами (cyberpunk эстетика).
 * subtle: глитч каждые 2-3 сек, амплитуда низкая (для Slide 11 «ОГОНЬ»).
 * heavy: один резкий 600мс при появлении, потом «успокаивается» (для Slide 15 ГЛАВА 1).
 */
export function GlitchText({
  text,
  className,
  intensity = "subtle",
  loop = true,
  style,
}: GlitchTextProps) {
  const isHeavy = intensity === "heavy";

  // Heavy glitch: разовое, 600мс, 6-8 микро-кадров
  const heavyKeyframes = {
    x: [0, -3, 4, -2, 0, 2, -1, 0],
    skewX: [0, -3, 4, -2, 0, 2, 0, 0],
    scaleX: [1, 1.02, 0.98, 1.01, 1, 0.99, 1, 1],
  };

  // Subtle: периодический, амплитуда меньше
  const subtleKeyframes = {
    x: [0, -1, 2, 0, 1, 0],
    skewX: [0, -1, 2, 0, 1, 0],
  };

  return (
    <motion.span
      className={cn(
        "inline-block sd-glitch-rgb",
        className
      )}
      style={style}
      initial={isHeavy ? { opacity: 0, x: -8 } : undefined}
      animate={
        loop
          ? {
              opacity: 1,
              ...(isHeavy ? heavyKeyframes : subtleKeyframes),
            }
          : { opacity: 1, ...heavyKeyframes }
      }
      transition={
        isHeavy
          ? {
              duration: 0.6,
              times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
              repeat: loop ? Infinity : 0,
              repeatDelay: 3,
            }
          : {
              duration: 0.4,
              times: [0, 0.2, 0.4, 0.6, 0.8, 1],
              repeat: Infinity,
              repeatDelay: 2.5,
              ease: "easeInOut",
            }
      }
    >
      {text}
    </motion.span>
  );
}
