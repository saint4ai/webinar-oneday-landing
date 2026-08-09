import React from "react";
import { cn } from "@/lib/utils";

/**
 * Highlight под текстом — плотная плашка с мягким glow.
 *
 * Раскатка и почернение текста сделаны на CSS (.hl-bar / .hl-ink в globals),
 * а не на JS-анимации. Причина: в статической сборке Motion-анимация с delay
 * не доигрывала — плашка оставалась scaleX(0), и акцент вообще не появлялся.
 * CSS отрабатывает всегда, включая случай «JS не загрузился» — наш основной
 * риск во встроенных браузерах Instagram/YouTube.
 *
 * Геометрия плашки калибрована под cap-height BENZIN @800 uppercase:
 * у кириллицы нет хвостов, поэтому line-box сильно ниже видимых букв —
 * top 0.08em / bottom 0.30em компенсируют пустой descent.
 */
export const Highlighted = ({
  children,
  delay = 1.5,
  duration = 0.7,
  color = "#cdeb52",
  glowRgb = "205, 235, 82",
  className,
  // wrap=true → плашка может переноситься (для длинных слов на узком mobile)
  wrap = false,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  color?: string;
  glowRgb?: string;
  className?: string;
  wrap?: boolean;
}) => {
  return (
    <span
      className={cn(
        "relative inline-block px-[0.16em] align-baseline",
        wrap ? "whitespace-normal" : "whitespace-nowrap",
        className
      )}
      style={
        {
          "--hl-delay": `${delay}s`,
          "--hl-dur": `${duration}s`,
          ...(wrap
            ? { wordBreak: "break-word", overflowWrap: "anywhere" }
            : { wordBreak: "keep-all", overflowWrap: "normal" }),
        } as React.CSSProperties
      }
    >
      <span
        className="hl-bar absolute z-0 rounded-[0.22em]"
        style={{
          background: color,
          top: "0.08em",
          bottom: "0.30em",
          left: 0,
          right: 0,
          animationDuration: `${duration}s`,
          boxShadow: `
            0 12px 32px -8px rgba(${glowRgb}, 0.55),
            0 4px 16px -2px rgba(${glowRgb}, 0.4)
          `,
        }}
        aria-hidden
      />

      {/* Текст — белый, чернеет к концу раскатки плашки */}
      <span className="hl-ink relative z-10">{children}</span>
    </span>
  );
};
