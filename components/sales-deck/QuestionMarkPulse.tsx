"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface QuestionMarkPulseProps {
  className?: string;
  /** "?" по умолчанию, можно передать "ОГОНЬ" или другой текст */
  symbol?: string;
  color?: string;
}

/**
 * QuestionMarkPulse — большой пульсирующий «?» для engagement-слайдов.
 * Используется в Slide_06 «Как вам бонусы?».
 */
export function QuestionMarkPulse({
  className,
  symbol = "?",
  color = "#B6FF00",
}: QuestionMarkPulseProps) {
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{
        scale: [1, 1.05, 1],
        opacity: 1,
      }}
      transition={{
        scale: {
          duration: 2.4,
          repeat: Infinity,
          ease: "easeInOut",
        },
        opacity: { duration: 0.6 },
      }}
      className={cn("flex items-center justify-center", className)}
      style={{
        fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
        fontWeight: 800,
        fontSize: "clamp(180px, 28cqw, 480px)",
        lineHeight: 0.9,
        color,
        textShadow: `0 0 80px ${color}66, 0 0 160px ${color}33`,
      }}
    >
      {symbol}
    </motion.div>
  );
}
