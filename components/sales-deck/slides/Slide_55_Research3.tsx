"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Users, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandLogo } from "../BrandLogo";

/**
 * Слайд 55 · Research 3/5 — «ГДЕ ИСКАТЬ». Текст 1-в-1 STRUCTURE 664-676.
 * Свежий приём: 4 источника → SVG-стрелки рисуются и сходятся в лайм-точку «БОЛЬ».
 */
const SOURCES: { icon?: LucideIcon; logo?: string; label: string; tag: string; y: number }[] = [
  { logo: "reddit", label: "Reddit", tag: "люди", y: 12 },
  { logo: "threads", label: "Threads", tag: "люди", y: 38 },
  { icon: Star, label: "Отзывы на сервисы", tag: "люди", y: 62 },
  { icon: Users, label: "Разговор с владельцем", tag: "бизнес", y: 88 },
];

export function Slide_55_Research3() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={760}
      background={<SlideBg theme="dark" variant="lime-right" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // RESEARCH · 3 / 5
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(30px, 3.8vw, 58px)",
        }}
      >
        ГДЕ <span className="text-[#B6FF00]">ИСКАТЬ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="text-white/65 text-sm md:text-base leading-snug mb-6"
      >
        Боль звучит конкретно — <span className="text-white/90 italic">«уже устал делать вручную»</span>.
      </motion.div>

      {/* Диаграмма: 4 источника → БОЛЬ */}
      <div className="relative max-w-3xl mb-6" style={{ height: 220 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 768 220" preserveAspectRatio="none">
          {SOURCES.map((s, i) => {
            const y = (s.y / 100) * 220;
            return (
              <motion.path
                key={i}
                d={`M 200 ${y} C 380 ${y}, 538 110, 562 110`}
                fill="none"
                stroke="#B6FF00"
                strokeWidth="2"
                strokeOpacity="0.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.7 + i * 0.18, ease: "easeInOut" }}
              />
            );
          })}
        </svg>

        {/* источники */}
        {SOURCES.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: -16, y: "-50%" }}
              animate={{ opacity: 1, x: 0, y: "-50%" }}
              transition={{ duration: 0.45, delay: 0.5 + i * 0.18 }}
              className="absolute flex items-center gap-2.5 rounded-xl px-3 py-2"
              style={{
                top: `${s.y}%`,
                left: 0,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                width: "26%",
              }}
            >
              {s.logo ? (
                <BrandLogo name={s.logo} alt={s.label} className="w-4 h-4 shrink-0" />
              ) : Icon ? (
                <Icon className="w-4 h-4 text-white/60 shrink-0" strokeWidth={1.8} />
              ) : null}
              <div className="min-w-0">
                <div className="text-white text-xs font-semibold leading-tight truncate">{s.label}</div>
                <div className="text-[#B6FF00] text-[10px] font-mono uppercase tracking-[0.1em]">{s.tag}</div>
              </div>
            </motion.div>
          );
        })}

        {/* центр — БОЛЬ */}
        <motion.div
          initial={{ opacity: 0, scale: 0, x: "-50%", y: "-50%" }}
          animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
          transition={{ duration: 0.6, delay: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute flex items-center justify-center rounded-full"
          style={{
            top: "50%",
            left: "80%",
            width: 104,
            height: 104,
            background: "rgba(252,92,2,0.16)",
            border: "2px solid #FC5C02",
            boxShadow: "0 0 60px rgba(252,92,2,0.55)",
          }}
        >
          <span className="font-bold uppercase" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 23, color: "#FC5C02" }}>БОЛЬ</span>
        </motion.div>
      </div>

      {/* Текст-детали */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.8 }}
        className="grid grid-cols-2 gap-x-6 gap-y-2 max-w-3xl text-sm"
      >
        <div className="text-white/70 leading-snug">
          <span className="text-[#B6FF00] font-mono text-[10px] uppercase tracking-[0.12em] mr-1.5">люди:</span>
          фразы «устал делать руками», «почему до сих пор нет нормального сервиса».
        </div>
        <div className="text-white/70 leading-snug">
          <span className="text-[#B6FF00] font-mono text-[10px] uppercase tracking-[0.12em] mr-1.5">бизнес:</span>
          на созвонах и в чатах с владельцами — «надоело делать вручную», «нет нормального сервиса под нас». Где рутина повторяется — там продукт.
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 2.1 }}
        className="text-white/40 text-xs md:text-sm mt-3 max-w-3xl"
      >
        + мониторинг конкурентов: что они НЕ делают, где готовые сервисы не покрывают локальную специфику.
      </motion.div>
    </SlideLayout>
  );
}
