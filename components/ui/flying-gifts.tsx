"use client";

/**
 * FlyingGifts — one-shot wow-взрыв падающих подарков на /thank-you.
 *
 * Оптимизации vs предыдущей версии:
 *  - Adaptive density: mobile=5/8/3, tablet=8/14/4, desktop=12/20/6 элементов
 *  - prefers-reduced-motion → не рендерим вообще
 *  - Particles пре-сгенерированы через useMemo (один раз на mount)
 *  - GPU-only: transform + opacity, без width/height/top/left в animate
 *  - filter: drop-shadow убран с массовых частиц (только на крупных Gift)
 *  - confetti: фиксированный размер через transform: scale, не layout-trigger
 *  - will-change: transform на активных, удаляется после завершения
 *  - Авто-cleanup через setTimeout, idempotency: повторный mount = новый seed
 */

import React, { useEffect, useMemo, useState } from "react";
import { Gift, Sparkles } from "lucide-react";

type Density = {
  gifts: number;
  confetti: number;
  sparkles: number;
};

/**
 * Adaptive density по viewport. Mobile получает 40% от desktop частиц.
 * Reduced motion → 0.
 */
function getDensity(): Density {
  if (typeof window === "undefined") return { gifts: 0, confetti: 0, sparkles: 0 };
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return { gifts: 0, confetti: 0, sparkles: 0 };
  }
  const w = window.innerWidth;
  if (w < 640) return { gifts: 5, confetti: 8, sparkles: 3 }; // mobile
  if (w < 1024) return { gifts: 8, confetti: 14, sparkles: 4 }; // tablet
  return { gifts: 12, confetti: 20, sparkles: 6 }; // desktop
}

type GiftParticle = {
  i: number;
  left: number; // %
  delay: number; // s
  duration: number; // s
  size: number; // px
  color: string;
  swingX: number; // px
  rotateEnd: number; // deg
};

type ConfettiParticle = {
  i: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  rotateEnd: number;
  shape: "circle" | "rect";
};

type SparkleParticle = {
  i: number;
  left: number;
  top: number;
  delay: number;
  color: string;
};

const GIFT_COLORS = ["#fc5c02", "#cdeb52", "#ff7424"];
const CONFETTI_COLORS = ["#cdeb52", "#fc5c02", "#ff7424", "#ffffff"];

export const FlyingGifts = () => {
  const [density, setDensity] = useState<Density>({
    gifts: 0,
    confetti: 0,
    sparkles: 0,
  });
  const [active, setActive] = useState(true);

  // Считаем плотность ТОЛЬКО на клиенте (после hydration).
  // До этого density={0,0,0} → ничего не рендерим (SSR-safe).
  useEffect(() => {
    setDensity(getDensity());
  }, []);

  // Auto-cleanup через 5s — после этого DOM-узлы удаляются полностью.
  useEffect(() => {
    if (density.gifts === 0) return;
    const t = setTimeout(() => setActive(false), 5000);
    return () => clearTimeout(t);
  }, [density.gifts]);

  // Pre-compute все particles один раз. Math.random стабильный для mount.
  const gifts = useMemo<GiftParticle[]>(() => {
    return Array.from({ length: density.gifts }, (_, i) => ({
      i,
      left: 5 + Math.random() * 90,
      delay: Math.random() * 0.8,
      duration: 3 + Math.random() * 1.8,
      size: 28 + Math.random() * 22,
      color: GIFT_COLORS[i % GIFT_COLORS.length],
      swingX: (Math.random() - 0.5) * 80,
      rotateEnd: Math.random() * 60 - 30 + 180 + Math.random() * 360,
    }));
  }, [density.gifts]);

  const confetti = useMemo<ConfettiParticle[]>(() => {
    return Array.from({ length: density.confetti }, (_, i) => ({
      i,
      left: Math.random() * 100,
      delay: Math.random() * 1,
      duration: 2 + Math.random() * 2,
      size: 4 + Math.random() * 6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotateEnd: Math.random() * 720,
      shape: Math.random() > 0.5 ? "circle" : "rect",
    }));
  }, [density.confetti]);

  const sparkles = useMemo<SparkleParticle[]>(() => {
    return Array.from({ length: density.sparkles }, (_, i) => ({
      i,
      left: 10 + Math.random() * 80,
      top: 10 + Math.random() * 50,
      delay: 0.5 + Math.random() * 1.5,
      color: i % 2 === 0 ? "#cdeb52" : "#fc5c02",
    }));
  }, [density.sparkles]);

  if (!active || density.gifts === 0) return null;

  return (
    <>
      {/* CSS keyframes — браузер сам обрабатывает анимацию, без React state updates */}
      <style jsx>{`
        @keyframes gift-fall {
          0% {
            transform: translate3d(0, -15vh, 0) rotate(var(--rot-start)) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translate3d(0, 0, 0) rotate(var(--rot-mid-1)) scale(1.1);
          }
          50% {
            transform: translate3d(var(--swing-x), 55vh, 0) rotate(var(--rot-mid-2)) scale(1);
            opacity: 1;
          }
          85% {
            opacity: 0.5;
          }
          100% {
            transform: translate3d(0, 115vh, 0) rotate(var(--rot-end)) scale(0.9);
            opacity: 0;
          }
        }

        @keyframes confetti-fall {
          0% {
            transform: translate3d(0, -15vh, 0) rotate(0deg);
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translate3d(0, 115vh, 0) rotate(var(--rot-end));
            opacity: 0;
          }
        }

        @keyframes sparkle-pop {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          30% {
            opacity: 1;
            transform: scale(1.4) rotate(90deg);
          }
          100% {
            transform: scale(0) rotate(180deg);
            opacity: 0;
          }
        }

        .gift-anim {
          position: absolute;
          top: 0;
          will-change: transform, opacity;
          animation: gift-fall var(--dur) ease-in var(--delay) forwards;
        }

        .conf-anim {
          position: absolute;
          top: 0;
          will-change: transform, opacity;
          animation: confetti-fall var(--dur) linear var(--delay) forwards;
        }

        .spark-anim {
          position: absolute;
          will-change: transform, opacity;
          animation: sparkle-pop 1.8s ease-out var(--delay) forwards;
        }
      `}</style>

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[5] overflow-hidden"
      >
        {gifts.map((g) => (
          <div
            key={`g-${g.i}`}
            className="gift-anim"
            style={
              {
                left: `${g.left}%`,
                color: g.color,
                "--dur": `${g.duration}s`,
                "--delay": `${g.delay}s`,
                "--swing-x": `${g.swingX}px`,
                "--rot-start": `${g.rotateEnd - 360}deg`,
                "--rot-mid-1": `${g.rotateEnd - 180}deg`,
                "--rot-mid-2": `${g.rotateEnd - 90}deg`,
                "--rot-end": `${g.rotateEnd}deg`,
              } as React.CSSProperties
            }
          >
            <Gift
              size={g.size}
              strokeWidth={2.2}
              fill={g.color}
              fillOpacity={0.3}
            />
          </div>
        ))}

        {confetti.map((c) => (
          <span
            key={`c-${c.i}`}
            className="conf-anim"
            style={
              {
                left: `${c.left}%`,
                width: `${c.size}px`,
                height: `${c.shape === "circle" ? c.size : c.size * 0.4}px`,
                background: c.color,
                borderRadius: c.shape === "circle" ? "50%" : "2px",
                "--dur": `${c.duration}s`,
                "--delay": `${c.delay}s`,
                "--rot-end": `${c.rotateEnd}deg`,
              } as React.CSSProperties
            }
          />
        ))}

        {sparkles.map((s) => (
          <div
            key={`s-${s.i}`}
            className="spark-anim"
            style={
              {
                top: `${s.top}%`,
                left: `${s.left}%`,
                color: s.color,
                "--delay": `${s.delay}s`,
              } as React.CSSProperties
            }
          >
            <Sparkles size={20} strokeWidth={2.5} fill={s.color} />
          </div>
        ))}
      </div>
    </>
  );
};
