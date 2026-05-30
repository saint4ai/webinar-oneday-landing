"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassPaneProps {
  children: ReactNode;
  className?: string;
  /** Интенсивность размытия фона. По умолчанию 20px */
  blur?: number;
  /** Дополнительный tint поверх стекла. По умолчанию белый чуть прозрачный */
  tint?: string;
  /** Цвет лайм-glow вокруг рамки (по умолчанию off) */
  glow?: "lime" | "orange" | "none";
}

/**
 * GlassPane — стеклянная панель поверх LiquidBackground (или любого фона).
 * Создаёт эффект «смотришь через стекло на воду»: размытие + saturate + тонкая рамка.
 */
export function GlassPane({
  children,
  className,
  blur = 20,
  tint = "rgba(255,255,255,0.03)",
  glow = "none",
}: GlassPaneProps) {
  const glowShadow =
    glow === "lime"
      ? "0 0 60px -10px rgba(182,255,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)"
      : glow === "orange"
        ? "0 0 60px -10px rgba(252,92,2,0.28), inset 0 1px 0 rgba(255,255,255,0.08)"
        : "inset 0 1px 0 rgba(255,255,255,0.08)";

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/10 overflow-hidden",
        className
      )}
      style={{
        background: tint,
        backdropFilter: `blur(${blur}px) saturate(180%)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
        boxShadow: glowShadow,
      }}
    >
      {children}
    </div>
  );
}
