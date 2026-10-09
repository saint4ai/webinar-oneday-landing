"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { GLASS, LT, T, goldButton } from "../theme";

/**
 * Фанфары слайда bon «Бонус, если купите до конца дня» (Александр, 09.10.2026, ТЗ docs/tasks/deck_bonus_cover_1009.md):
 * обложка подарочного модуля вылетает из коробки с пружинным масштабом, из-за неё разлетаются золотая вспышка, конфетти и искры,
 * по карточке «Подарок 1» один раз проходит блик. Всё играет один раз при входе на слайд, потом статично.
 *
 * Нагрузка: ни одной бесконечной анимации. Слой частиц и блик снимаются из дерева таймером и по окончании анимации, таймер чистится
 * при уходе со слайда (SlideDeck держит смонтированным только текущий слайд). При системной «уменьшить движение» фанфар нет, обложка просто стоит.
 */

/** Обложка: public/montage/bonus/ai-creator-cover.webp, 1600×1191, прозрачный фон (gpt-image, chatgpt-image-latest). */
const COVER_SRC = "/montage/bonus/ai-creator-cover.webp";
const COVER_W = 1600;
const COVER_H = 1191;

/** Где на обложке подарочная коробка (доли ширины и высоты): отсюда вылетает обложка и разлетаются частицы. */
const BOX_X = 0.78;
const BOX_Y = 0.45;

/** Через сколько миллисекунд после входа слайда фанфары снимаются из дерева (последняя частица гаснет к ~3,3 с). */
const BURST_MS = 3500;
/** Секунды до первого кадра фанфар: слайд въезжает 0,4 с, карточка появляется в 0,28 с. */
const T0 = 0.5;

/** Детерминированный генератор (mulberry32): частицы одинаковы на сервере и в браузере, гидратация не спорит. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Shape = "rect" | "dot" | "star";
type Particle = { shape: Shape; dx: number; dy: number; fall: number; rot: number; w: number; h: number; color: string; delay: number; dur: number; front: boolean };

/** Золото и крем бренда; кремовые кусочки получают тонкую коричневую кромку, чтобы читались и на светлой теме. */
const COLORS = ["#E3C07B", "#C9A05A", "#F5D58A", "#FFE9B0", "#FBF3E4", "#E3C07B", "#F5D58A"];
const STAR_CLIP = "polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)";

/** 60 частиц: 26 конфетти, 18 искр, 16 звёздочек. Веер вверх и в стороны, расстояния в cqw, в конце небольшое падение. */
const PARTICLES: Particle[] = (() => {
  const r = rng(0x0b0a5);
  const out: Particle[] = [];
  const kinds: [Shape, number][] = [["rect", 26], ["dot", 18], ["star", 16]];
  for (const [shape, n] of kinds) {
    for (let k = 0; k < n; k++) {
      const ang = (-170 + r() * 160) * (Math.PI / 180); // от -170° до -10°: вверх и в стороны
      const dist = 6 + r() * 15;
      const size = shape === "rect" ? 0.5 + r() * 0.4 : shape === "dot" ? 0.26 + r() * 0.22 : 0.7 + r() * 0.5;
      out.push({
        shape,
        dx: +(Math.cos(ang) * dist * 1.2).toFixed(2),
        dy: +(Math.sin(ang) * dist * 0.8).toFixed(2),
        fall: +(3 + r() * 6).toFixed(2),
        rot: Math.round((r() - 0.5) * 900),
        w: +size.toFixed(2),
        h: shape === "rect" ? +(size * (0.45 + r() * 0.25)).toFixed(2) : +size.toFixed(2),
        color: COLORS[Math.floor(r() * COLORS.length)],
        delay: +(T0 + 0.08 + r() * 0.14).toFixed(2),
        dur: +(1.8 + r() * 0.7).toFixed(2), // 1,8–2,5 с
        front: out.length % 4 === 0,
      });
    }
  }
  return out;
})();

function particleStyle(p: Particle): CSSProperties {
  const base: CSSProperties = { position: "absolute", left: `${BOX_X * 100}%`, top: `${BOX_Y * 100}%`, width: `${p.w}cqw`, height: `${p.h}cqw`, marginLeft: `${-p.w / 2}cqw`, marginTop: `${-p.h / 2}cqw`, background: p.color, zIndex: p.front ? 3 : 0, pointerEvents: "none", willChange: "transform, opacity" };
  if (p.shape === "dot") return { ...base, borderRadius: "50%", boxShadow: `0 0 0.6cqw ${T.gold}` };
  if (p.shape === "star") return { ...base, clipPath: STAR_CLIP };
  return { ...base, borderRadius: "0.08cqw", boxShadow: "0 0 0 0.05cqw rgba(160,83,42,.32)" };
}

/** Слой фанфар: вспышка и частицы. Монтируется на время анимации и снимается целиком. */
function Burst() {
  return (
    <>
      {/* широкая вспышка за обложкой и яркое ядро поверх неё: один раз, 0,95 с */}
      <motion.div aria-hidden initial={{ opacity: 0, scale: 0.2 }} animate={{ opacity: [0, 1, 0], scale: [0.2, 1, 1.4] }}
        transition={{ delay: T0 + 0.04, duration: 0.95, times: [0, 0.25, 1], ease: "easeOut" }}
        style={{ position: "absolute", left: `${BOX_X * 100}%`, top: `${BOX_Y * 100}%`, width: "36cqw", height: "36cqw", marginLeft: "-18cqw", marginTop: "-18cqw", borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(circle, rgba(255,240,196,.95) 0%, rgba(227,192,123,.5) 30%, rgba(227,192,123,0) 68%)" }} />
      <motion.div aria-hidden initial={{ opacity: 0, scale: 0.2 }} animate={{ opacity: [0, 0.8, 0], scale: [0.2, 1, 1.5] }}
        transition={{ delay: T0 + 0.04, duration: 0.7, times: [0, 0.3, 1], ease: "easeOut" }}
        style={{ position: "absolute", left: `${BOX_X * 100}%`, top: `${BOX_Y * 100}%`, width: "12cqw", height: "12cqw", marginLeft: "-6cqw", marginTop: "-6cqw", borderRadius: "50%", pointerEvents: "none", zIndex: 2,
          background: "radial-gradient(circle, rgba(255,250,228,.95) 0%, rgba(255,226,150,.45) 40%, rgba(255,226,150,0) 70%)" }} />
      {PARTICLES.map((p, i) => (
        <motion.span key={i} aria-hidden style={particleStyle(p)}
          initial={{ opacity: 0, x: "0cqw", y: "0cqw", scale: 0.3, rotate: 0 }}
          animate={{ opacity: [0, 1, 1, 0], x: ["0cqw", `${p.dx}cqw`, `${+(p.dx * 1.1).toFixed(2)}cqw`], y: ["0cqw", `${p.dy}cqw`, `${+(p.dy + p.fall).toFixed(2)}cqw`], scale: [0.3, 1, 0.75], rotate: p.rot }}
          transition={{
            delay: p.delay,
            opacity: { duration: p.dur, times: [0, 0.08, 0.62, 1], ease: "linear" },
            x: { duration: p.dur, times: [0, 0.4, 1], ease: ["easeOut", "linear"] },
            y: { duration: p.dur, times: [0, 0.4, 1], ease: ["easeOut", "easeIn"] },
            scale: { duration: p.dur, times: [0, 0.2, 1], ease: "easeOut" },
            rotate: { duration: p.dur, ease: "easeOut" },
          }} />
      ))}
    </>
  );
}

/** Золотая плашка «ПОДАРОК» с коробочкой: выпрыгивает пружиной вслед за обложкой. */
function GiftPlate({ reduce }: { reduce: boolean }) {
  return (
    <motion.div initial={reduce ? false : { opacity: 0, scale: 0.4, y: "0.6cqw", rotate: -8 }} animate={{ opacity: 1, scale: 1, y: "0cqw", rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 14, delay: T0 + 0.35 }}
      className="inline-flex items-center"
      style={{ ...goldButton, position: "absolute", top: 0, left: "0.4cqw", zIndex: 4, gap: "0.55cqw", borderRadius: 999, padding: "0.5cqw 1.2cqw 0.5cqw 0.95cqw", fontFamily: "var(--font-unbounded)", fontWeight: 800, fontSize: "0.95cqw", letterSpacing: ".14em", lineHeight: 1.2, boxShadow: `0 0.6cqw 1.6cqw -0.6cqw ${T.gold2}, inset 0 1px 0 rgba(255,255,255,.45)` }}>
      <svg viewBox="0 0 24 24" style={{ width: "1.25cqw", height: "1.25cqw", flexShrink: 0 }} fill="none" stroke={LT.ink} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="9.5" width="18" height="11.5" rx="2" />
        <path d="M12 9.5V21M3 14h18" />
        <path d="M12 9.5C9.8 9.5 7.4 8.6 7.4 6.8c0-1.5 1.6-2.1 2.8-1.3 1 .7 1.8 2.3 1.8 4zM12 9.5c2.2 0 4.6-.9 4.6-2.7 0-1.5-1.6-2.1-2.8-1.3-1 .7-1.8 2.3-1.8 4z" />
      </svg>
      ПОДАРОК
    </motion.div>
  );
}

/**
 * Обложка подарочного модуля с фанфарами. width — ширина обложки в cqw-строке (ТЗ: не меньше 22cqw). Над левым верхним краем висит плашка «ПОДАРОК».
 * Прозрачный фон обложки: на стеклянной карточке и на светлой теме читается одинаково, статичное мягкое золотое свечение лежит под ней.
 */
export function BonusCover({ width = "26cqw" }: { width?: string }) {
  const reduce = !!useReducedMotion();
  const [burst, setBurst] = useState(true);
  useEffect(() => {
    // фанфары играют один раз и снимаются; при «уменьшить движение» слой не нужен вовсе
    const t = setTimeout(() => setBurst(false), reduce ? 0 : BURST_MS);
    return () => clearTimeout(t);
  }, [reduce]);
  return (
    <div style={{ position: "relative", width, flexShrink: 0, paddingTop: "1.15cqw", isolation: "isolate" }}>
      <div style={{ position: "relative", aspectRatio: `${COVER_W} / ${COVER_H}` }}>
        <div aria-hidden style={{ position: "absolute", left: "-6%", right: "-6%", top: "6%", bottom: "-4%", zIndex: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse 58% 55% at 62% 52%, ${T.gold}30, ${T.gold}00 72%)` }} />
        {burst && !reduce && <Burst />}
        {/* обложка вылетает из коробки: масштаб растёт из точки коробки на картинке, пружина с лёгким перелётом */}
        <motion.div initial={reduce ? false : { opacity: 0, scale: 0.18, y: "5%", rotate: -5 }} animate={{ opacity: 1, scale: 1, y: "0%", rotate: 0 }}
          transition={{ type: "spring", stiffness: 150, damping: 14, mass: 0.9, delay: T0, opacity: { duration: 0.2, delay: T0 } }}
          style={{ position: "absolute", inset: 0, zIndex: 1, willChange: "transform, opacity", transformOrigin: `${BOX_X * 100}% ${(BOX_Y + 0.17) * 100}%` }}>
          <img src={COVER_SRC} alt="" width={COVER_W} height={COVER_H} decoding="async"
            style={{ display: "block", width: "100%", height: "100%", filter: `drop-shadow(0 1.2cqw 1.6cqw rgba(0,0,0,${GLASS ? 0.45 : 0.22}))` }} />
        </motion.div>
      </div>
      <GiftPlate reduce={reduce} />
    </div>
  );
}

/**
 * Блик: один проход светлой диагональной полосы по карточке, потом полоса снимается из дерева. Кладётся внутрь карточки (у неё position: relative).
 * radius — скругление карточки в пикселях, чтобы полоса не вылезала за углы.
 */
export function Sheen({ radius = 22, delay = 1 }: { radius?: number; delay?: number }) {
  const reduce = !!useReducedMotion();
  const [on, setOn] = useState(true);
  if (!on || reduce) return null;
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: radius, overflow: "hidden", pointerEvents: "none", zIndex: 5 }}>
      <motion.div initial={{ x: "-130%" }} animate={{ x: "520%" }} transition={{ delay, duration: 1.15, ease: [0.4, 0, 0.2, 1] }} onAnimationComplete={() => setOn(false)}
        style={{ position: "absolute", top: "-25%", bottom: "-25%", left: 0, width: "20%", skewX: -18,
          background: `linear-gradient(100deg, rgba(255,244,214,0) 0%, ${GLASS ? "rgba(255,244,214,.34)" : "rgba(227,192,123,.42)"} 50%, rgba(255,244,214,0) 100%)` }} />
    </div>
  );
}
