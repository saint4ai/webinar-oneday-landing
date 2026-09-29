"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { B, MANROPE, UNBOUNDED } from "./brand";

/**
 * Огромная объёмная цифра в бренде сайта: грань коричневая (Unbounded 700), толщина из 18 слоёв
 * уходит в глубину тёплыми тёмными тонами, по грани один раз проходит блик. Цифра докручивается от нуля.
 * value — готовая строка: «107 237», «+2 340», «—». Нечисловое показывается как есть.
 */
const DEPTH = 18;
const STEP = 0.011; // em на слой: толщина ≈ 0,2 высоты цифры

function split(value: string) {
  const m = value.match(/^(\D*?)([\d\s ]*\d)(.*)$/);
  if (!m) return null;
  return { pre: m[1], num: Number(m[2].replace(/[\s ]/g, "")), post: m[3] };
}
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export function ExtrudedNumber({ value, label, accent = B.brown, size = "9cqw" }: { value: string; label?: string; accent?: string; size?: string }) {
  const reduce = useReducedMotion();
  const parts = split(value);
  const [n, setN] = useState(reduce || !parts ? parts?.num ?? 0 : 0);

  useEffect(() => {
    if (!parts || reduce) return;
    let raf = 0; let start = 0;
    const id = setTimeout(() => {
      const tick = (now: number) => {
        if (!start) start = now;
        const p = Math.min((now - start) / 1800, 1);
        setN(Math.round(parts.num * (1 - Math.pow(1 - p, 4))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, 350);
    return () => { clearTimeout(id); cancelAnimationFrame(raf); };
  }, [parts?.num, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  const text = parts ? `${parts.pre}${fmt(n)}${parts.post}`.replace(/ /g, " ") : value;
  // Толщина: слои тени от тёмного акцента к тёплому почти-чёрному (#2A211C), шаг STEP от размера шрифта
  const extrude = Array.from({ length: DEPTH }, (_, i) => {
    const k = i + 1;
    const mix = 1 - k / DEPTH;
    return `${(k * STEP).toFixed(3)}em ${(k * STEP).toFixed(3)}em 0 color-mix(in srgb, ${accent} ${Math.round(34 + mix * 36)}%, ${B.ink})`;
  }).join(", ") + `, ${(DEPTH * STEP + 0.08).toFixed(2)}em ${(DEPTH * STEP + 0.22).toFixed(2)}em 0.32em rgba(42,33,28,.34)`;

  const face: CSSProperties = {
    fontFamily: UNBOUNDED, fontWeight: 700, fontSize: size,
    letterSpacing: "-0.04em", lineHeight: 0.95, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
  };

  return (
    <div className="flex flex-col items-start" style={{ perspective: "60cqw" }}>
      <style>{`
        @keyframes en-in { from { transform: rotateX(38deg) rotateY(-26deg) translateZ(-8cqw); opacity: 0; } to { transform: rotateX(10deg) rotateY(-14deg); opacity: 1; } }
        @keyframes en-shine { from { background-position: 160% 0; } to { background-position: -60% 0; } }
      `}</style>
      <div className="relative" style={{
        transformOrigin: "20% 60%", transform: "rotateX(10deg) rotateY(-14deg)",
        animation: reduce ? undefined : "en-in 1.1s cubic-bezier(0.23, 1, 0.32, 1) both",
      }}>
        <div style={{ ...face, color: accent, textShadow: extrude }}>{text}</div>
        {!reduce && (
          <div className="absolute inset-0" aria-hidden style={{
            ...face, color: "transparent",
            backgroundImage: `linear-gradient(100deg, transparent 35%, ${B.card}CC 50%, transparent 65%)`,
            backgroundSize: "250% 100%", backgroundRepeat: "no-repeat",
            WebkitBackgroundClip: "text", backgroundClip: "text",
            animation: "en-shine 1.6s ease-out 1.9s both",
          }}>{text}</div>
        )}
      </div>
      {label && (
        <div style={{ fontFamily: MANROPE, fontWeight: 700, fontSize: "0.9cqw", letterSpacing: ".14em", textTransform: "uppercase", color: B.accent, marginTop: "2cqw" }}>{label}</div>
      )}
    </div>
  );
}
