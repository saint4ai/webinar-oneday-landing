"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Highlight под текстом — обычная solid плашка с мягким glow.
 * Без Liquid Glass — просто плотный цвет, чтобы не отвлекать от текста.
 *
 * Геометрия:
 *  - Wrapper padding по горизонтали: 0.16em (чтобы плашка была шире текста)
 *  - Плашка inset-y: -0.1em (выше и ниже текста на 10% font-size)
 *  - rounded-[0.22em] — мягкий радиус
 *  - НЕ заходит на соседние строки благодаря умеренному inset-y
 *
 * Эффекты:
 *  - Сплошной color
 *  - Внешний outer glow (drop-shadow x2)
 *  - Inset top highlight 35% (мягкий блик сверху)
 *  - Inset bottom shadow 12% (глубина)
 * - Текст становится чёрным после раскатки.
 */
export const Highlighted = ({
  children,
  delay = 1.5,
  duration = 0.7,
  color = "#cdeb52",
  glowRgb = "205, 235, 82",
  className,
  // wrap=true → плашка может переноситься (для длинных слов на узком mobile,
  // например «WhatsApp-сообщество» которое не влезает в 320px без wrap)
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
  const [filled, setFilled] = useState(false);

  return (
    <span
      className={cn(
        "relative inline-block px-[0.16em] align-baseline",
        wrap ? "whitespace-normal" : "whitespace-nowrap",
        className
      )}
      style={
        wrap
          ? { wordBreak: "break-word", overflowWrap: "anywhere" }
          : { wordBreak: "keep-all", overflowWrap: "normal" }
      }
    >
      {/* Solid плашка — калибровка под cap-height (а не line-box).
       * inline-span имеет line-box с большим descent ниже baseline,
       * но у uppercase кириллицы нет хвостов — компенсируем top/bottom вручную,
       * чтобы плашка симметрично обхватывала видимые буквы.
       *
       * BENZIN @800 на uppercase кириллицу — line-box центр сильно НИЖЕ
       * cap-центра (descent space пустой). Компенсируем:
       *  top    = 0.08em  → плашка чуть выше cap-top
       *  bottom = 0.30em  → плашка ровно по baseline (не свисает в пустой descent)
       *
       * Центр плашки получается выше центра line-box ≈ на 0.07em →
       * визуально совпадает с центром uppercase-текста.
       */}
      <motion.span
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{
          scaleX: { delay, duration, ease: [0.65, 0, 0.35, 1] },
          opacity: { delay, duration: 0.25, ease: "easeOut" },
        }}
        onAnimationComplete={() => setFilled(true)}
        style={{
          transformOrigin: "left center",
          background: color,
          top: "0.08em",
          bottom: "0.30em",
          left: 0,
          right: 0,
          boxShadow: `
            0 12px 32px -8px rgba(${glowRgb}, 0.55),
            0 4px 16px -2px rgba(${glowRgb}, 0.4)
          `,
        }}
        className="absolute z-0 rounded-[0.22em]"
        aria-hidden
      />

      {/* Текст — белый сначала, чёрный когда плашка доехала */}
      <span
        className={cn(
          "relative z-10 transition-colors duration-200",
          filled ? "text-black" : "text-white"
        )}
      >
        {children}
      </span>
    </span>
  );
};
