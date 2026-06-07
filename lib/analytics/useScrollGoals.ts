"use client";
/**
 * Хук глубины скролла → цели Метрики scroll_50 / scroll_90.
 * Каждая цель шлётся один раз за сессию; после scroll_90 слушатель снимается.
 */
import { useEffect } from "react";
import { ymGoal } from "@/lib/analytics/ym";

export function useScrollGoals(): void {
  useEffect(() => {
    const fired = new Set<string>();
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;
      const pct = (el.scrollTop / max) * 100;
      if (pct >= 50 && !fired.has("scroll_50")) {
        fired.add("scroll_50");
        ymGoal("scroll_50");
      }
      if (pct >= 90 && !fired.has("scroll_90")) {
        fired.add("scroll_90");
        ymGoal("scroll_90");
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}
