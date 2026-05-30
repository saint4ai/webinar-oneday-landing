"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItemProps {
  children: ReactNode;
  index?: number;
  /** ✓ checkmark или → стрелка */
  icon?: "check" | "arrow";
  /** Auto-stagger delay (мс на каждый index) */
  staggerMs?: number;
  className?: string;
}

/**
 * ChecklistItem — пункт списка с лайм-иконкой + stagger при появлении.
 * Используется в Slide_07 (программа эфира), Slide_08 (что получите), Slide_09 (для кого).
 */
export function ChecklistItem({
  children,
  index = 0,
  icon = "check",
  staggerMs = 120,
  className,
}: ChecklistItemProps) {
  const Icon = icon === "check" ? Check : ArrowRight;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.45,
        delay: 0.2 + (index * staggerMs) / 1000,
        ease: [0.25, 1, 0.5, 1],
      }}
      className={cn(
        "flex items-start gap-3 group",
        className
      )}
    >
      <div
        className="shrink-0 mt-0.5 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300"
        style={{
          background: "rgba(182,255,0,0.12)",
          boxShadow: "inset 0 0 0 1px rgba(182,255,0,0.35)",
        }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: "#B6FF00" }} strokeWidth={2.5} />
      </div>
      <div className="text-white/90 text-base md:text-lg leading-snug pt-0.5">
        {children}
      </div>
    </motion.div>
  );
}
