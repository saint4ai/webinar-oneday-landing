"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * BinaryDecodeText — метафора «двоичный код → текст».
 *
 * Заголовок «проявляется» из потока 0/1: символы мигают как биты, затем
 * посимвольно слева направо «защёлкиваются» в реальные буквы. Это буквальная
 * метафора вайбкодинга — переход с машинного языка на человеческий.
 *
 * Детерминированный бит (без Math.random) → нет hydration-mismatch.
 * Скрытый дубль текста резервирует ширину → нет reflow соседних блоков.
 * Уважает prefers-reduced-motion (сразу финальный текст).
 */
export interface BinaryDecodeTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  /** мс на «защёлкивание» каждого следующего символа (скорость волны) */
  perChar?: number;
  /** задержка до старта декодинга (мс) — биты успевают помигать */
  startDelay?: number;
  /** цвет резолвнутого текста */
  color?: string;
  /** цвет битов 0/1 во время скрэмбла */
  bitColor?: string;
  /** [from, to) индексы символов, красящиеся accentColor после резолва */
  accentRange?: [number, number];
  accentColor?: string;
}

export function BinaryDecodeText({
  text,
  className,
  style,
  perChar = 120,
  startDelay = 250,
  color = "#2A2520",
  bitColor = "rgba(42,37,32,0.28)",
  accentRange,
  accentColor = "#FC5C02",
}: BinaryDecodeTextProps) {
  const reduce = useReducedMotion();
  const chars = Array.from(text);
  const [resolved, setResolved] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (reduce) {
      setResolved(chars.length);
      return;
    }
    const flick = setInterval(() => setTick((t) => t + 1), 70);
    let r = 0;
    const startTimer = setTimeout(() => {
      const step = setInterval(() => {
        r += 1;
        setResolved(r);
        if (r >= chars.length) {
          clearInterval(step);
          clearInterval(flick);
        }
      }, perChar);
    }, startDelay);
    return () => {
      clearInterval(flick);
      clearTimeout(startTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, perChar, startDelay, reduce]);

  const renderChar = (ch: string, i: number) => {
    if (ch === " ") return <span key={i}> </span>;
    const isResolved = i < resolved;
    const inAccent = accentRange ? i >= accentRange[0] && i < accentRange[1] : false;
    const bit = (i * 31 + tick * 17) % 2;
    return (
      <span
        key={i}
        style={{
          color: isResolved ? (inAccent ? accentColor : color) : bitColor,
          fontFamily: isResolved
            ? "inherit"
            : "var(--font-jetbrains-mono), ui-monospace, monospace",
          transition: "color 0.12s ease",
        }}
      >
        {isResolved ? ch : String(bit)}
      </span>
    );
  };

  return (
    <span className={cn("relative inline-block", className)} style={style}>
      {/* Скрытый дубль резервирует ширину — соседние блоки не прыгают */}
      <span aria-hidden style={{ visibility: "hidden" }}>
        {text}
      </span>
      <span className="absolute inset-0" aria-label={text}>
        {chars.map(renderChar)}
      </span>
    </span>
  );
}
