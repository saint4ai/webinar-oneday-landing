"use client";

import { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { T, glass } from "./theme";

/** Неразрывные пробелы в числах: «300 000 ₸» не рвётся по строкам. */
export const nb = (s: string) => s.replace(/ /g, "\u00A0");

/** 107237 → «107 237» с неразрывным пробелом. */
export const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");

export const EASE = [0.23, 1, 0.32, 1] as const;

export const H = ({ children, size = "3.2cqw", color = T.ink, style }: { children: ReactNode; size?: string; color?: string; style?: CSSProperties }) => (
  <h2 style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, letterSpacing: "-.025em", lineHeight: 1.08, fontSize: size, color, ...style }}>{children}</h2>
);

export const Kicker = ({ children, color = T.accent }: { children: ReactNode; color?: string }) => (
  <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.82cqw", letterSpacing: ".14em", textTransform: "uppercase", color, marginBottom: "1.4cqw" }}>{children}</div>
);

export const Lead = ({ children, color = T.muted, style }: { children: ReactNode; color?: string; style?: CSSProperties }) => (
  <p style={{ fontFamily: "var(--font-manrope)", fontWeight: 500, fontSize: "1.25cqw", lineHeight: 1.45, color, ...style }}>{children}</p>
);

export const Chip = ({ children }: { children: ReactNode }) => (
  <span style={{ fontFamily: "var(--font-manrope)", fontWeight: 600, fontSize: "0.85cqw", color: T.muted, border: `1px solid ${T.line}`, borderRadius: 999, padding: "0.45cqw 1cqw", background: "rgba(255,255,255,.55)", whiteSpace: "nowrap" }}>{children}</span>
);

export const Num = ({ children, size = "4cqw", color = T.ink }: { children: ReactNode; size?: string; color?: string }) => (
  <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, letterSpacing: "-.03em", fontSize: size, color, fontVariantNumeric: "tabular-nums", lineHeight: 1, whiteSpace: "nowrap" }}>{children}</span>
);

/** Подпись-источник под цифрой. */
export const Note = ({ children, color = T.muted, style }: { children: ReactNode; color?: string; style?: CSSProperties }) => (
  <div style={{ fontFamily: "var(--font-manrope)", fontSize: "0.8cqw", lineHeight: 1.4, color, marginTop: "1.4cqw", ...style }}>{children}</div>
);

/** Появление снизу со сдвигом по времени. */
export const Rise = ({ children, delay = 0, style, className }: { children: ReactNode; delay?: number; style?: CSSProperties; className?: string }) => (
  <motion.div className={className} style={style} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease: EASE }}>
    {children}
  </motion.div>
);

/**
 * Объект слайда. «lg-*» — лего-сцены gpt-image-2.5 (public/montage/lego/*.webp, прозрачный фон, пропорции свои).
 * Остальные имена — пиксельные спрайты сайта (public/montage/px/*.png). Появляется пружиной, bob — лёгкое покачивание.
 */
export const Px = ({ name, size = "6cqw", delay = 0.15, bob = true, style }: { name: string; size?: string; delay?: number; bob?: boolean; style?: CSSProperties }) => {
  const lego = name.startsWith("lg-");
  return (
    <motion.div style={{ height: size, width: lego ? "auto" : size, flexShrink: 0, ...style }} initial={{ opacity: 0, scale: 0.6, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 14, delay }}>
      <motion.img src={lego ? `/montage/lego/${name}.webp` : `/montage/px/${name}.png`} alt=""
        style={{ height: "100%", width: lego ? "auto" : "100%", display: "block", imageRendering: lego ? "auto" : "pixelated", filter: "drop-shadow(0 14px 18px rgba(42,33,28,.18))" }}
        animate={bob ? { y: ["0%", "-4%", "0%"] } : undefined} transition={bob ? { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: delay + 0.6 } : undefined} />
    </motion.div>
  );
};

/** Стеклянная карточка с номером и текстом. */
export const Card = ({ no, title, text, accent, style, icon }: { no?: string; title: ReactNode; text?: ReactNode; accent?: boolean; style?: CSSProperties; icon?: string }) => (
  <div style={{ ...glass, borderRadius: 22, padding: "1.3cqw 1.5cqw", ...(accent ? { border: `1px solid ${T.gold2}` } : null), ...style }}>
    {icon && <Px name={icon} size="4.2cqw" bob={false} style={{ margin: "-0.4cqw 0 0.5cqw -0.4cqw" }} />}
    {no && <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: accent ? T.gold2 : T.accent, marginBottom: "0.6cqw" }}>{no}</div>}
    <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "1.2cqw", lineHeight: 1.3, color: T.ink }}>{title}</div>
    {text && <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 500, fontSize: "0.95cqw", lineHeight: 1.45, color: T.muted, marginTop: "0.4cqw" }}>{text}</div>}
  </div>
);

/** Стрелка-связка для цепочек. */
export const Arrow = ({ color = T.accent }: { color?: string }) => (
  <svg viewBox="0 0 24 24" style={{ width: "1.4cqw", height: "1.4cqw", flexShrink: 0 }} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
