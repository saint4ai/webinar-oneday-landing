"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * Анимированная цветная рамка вокруг карточки.
 * Бренд-цвета: orange (#fc5c02 / #ff7424) ↔ lime (#cdeb52), conic-gradient.
 *
 * Архитектура (упрощено — без outer glow halo):
 *  .gc-shell (position:relative)
 *    └─ ::after — тонкая 1.5px рамка по самому контуру (НЕ выходит за карточку)
 *    └─ children
 *
 * Props:
 *  intensity: "default" — рамка ярче (для главных CTA-карточек)
 *             "subtle"  — рамка тоньше (для info-карточек в сетках)
 *  radius:    border-radius всей оболочки (синхронизировать с inner card)
 */
type Intensity = "default" | "subtle";

type Props = {
  children: React.ReactNode;
  className?: string;
  intensity?: Intensity;
  radius?: string;
};

export const GlowingCard = ({
  children,
  className,
  intensity = "default",
  radius = "22px",
}: Props) => {
  const isSubtle = intensity === "subtle";

  return (
    <>
      <style jsx>{`
        @property --gc-rotate {
          syntax: "<angle>";
          inherits: true;
          initial-value: 0deg;
        }

        .gc-shell {
          --speed: ${isSubtle ? "10s" : "6s"};
          --radius: ${radius};
          --border-opacity: ${isSubtle ? "0.4" : "0.55"};

          position: relative;
          border-radius: var(--radius);
          isolation: isolate;
          transition: --border-opacity 0.3s ease;
        }

        /* Тонкая цветная рамка по контуру — НЕ выходит за карточку */
        .gc-shell::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: var(--radius);
          padding: 1.5px;
          background: conic-gradient(
            from var(--gc-rotate),
            #fc5c02 0deg,
            #ff7424 60deg,
            #cdeb52 180deg,
            #ff7424 300deg,
            #fc5c02 360deg
          );
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          mask-composite: exclude;
          opacity: var(--border-opacity);
          animation: gc-spin var(--speed) linear infinite;
          pointer-events: none;
          z-index: 0;
        }

        /* Hover — рамка ярче */
        .gc-shell:hover {
          --border-opacity: ${isSubtle ? "0.7" : "0.95"};
        }

        /* Mobile — медленнее, мягче */
        @media (max-width: 768px) {
          .gc-shell {
            --speed: ${isSubtle ? "16s" : "12s"};
            --border-opacity: ${isSubtle ? "0.32" : "0.45"};
          }
          .gc-shell:hover {
            --border-opacity: ${isSubtle ? "0.5" : "0.7"};
          }
        }

        /* Reduced motion — выключаем вращение */
        @media (prefers-reduced-motion: reduce) {
          .gc-shell::after {
            animation: none;
          }
        }

        @keyframes gc-spin {
          from {
            --gc-rotate: 0deg;
          }
          to {
            --gc-rotate: 360deg;
          }
        }
      `}</style>

      <div className={cn("gc-shell", className)}>{children}</div>
    </>
  );
};
