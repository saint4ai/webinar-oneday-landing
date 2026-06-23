"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Puzzle, Plug, Sparkles, LayoutPanelTop } from "lucide-react";

/**
 * Слайд 70 · Punchline — связка 4 инструментов. Текст 1-в-1 STRUCTURE 873-883.
 * 4 инструмента → SVG-стрелки сходятся в плашку «УРОВЕНЬ СТУДИИ».
 */
const TOOLS = [
  { icon: Puzzle, t: "Skills", d: "агент знает как делать", y: 13 },
  { icon: Plug, t: "MCP", d: "работает в любом сервисе", y: 38 },
  { icon: Sparkles, t: "Higgsfield", d: "визуал на бренд за минуты", y: 62 },
  { icon: LayoutPanelTop, t: "Дизайн UI", d: "интерфейс как у Apple", y: 87 },
];

export function Slide_70_QualityPunchline() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={760}
      background={<SlideBg theme="dark" variant="climax" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ПАНЧЛАЙН · 4 ИНСТРУМЕНТА
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.4cqw, 52px)" }}
      >
        ЭТО И ОТЛИЧАЕТ <span className="text-[#B6FF00]">ПРОФЕССИОНАЛА</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mb-6"
      >
        4 инструмента вместе = качество как у студии на выходе. По отдельности — кустарщина.
      </motion.div>

      {/* Диаграмма: 4 инструмента → УРОВЕНЬ СТУДИИ */}
      <div className="relative max-w-3xl mb-6" style={{ height: 230 }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 768 230" preserveAspectRatio="none">
          {TOOLS.map((t, i) => {
            const y = (t.y / 100) * 230;
            return (
              <motion.path
                key={i}
                d={`M 200 ${y} C 360 ${y}, 440 115, 478 115`}
                fill="none"
                stroke="#B6FF00"
                strokeWidth="2"
                strokeOpacity="0.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, delay: 0.7 + i * 0.16, ease: "easeInOut" }}
              />
            );
          })}
        </svg>

        {TOOLS.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.div
              key={t.t}
              initial={{ opacity: 0, x: -16, y: "-50%" }}
              animate={{ opacity: 1, x: 0, y: "-50%" }}
              transition={{ duration: 0.45, delay: 0.5 + i * 0.16 }}
              className="absolute flex items-center gap-2.5 rounded-xl px-3 py-2"
              style={{ top: `${t.y}%`, left: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(182,255,0,0.2)", width: "28%" }}
            >
              <Icon className="w-4 h-4 text-[#B6FF00] shrink-0" strokeWidth={1.9} />
              <div className="min-w-0">
                <div className="text-white text-xs font-bold leading-none">{t.t}</div>
                <div className="text-white/55 text-[10px] leading-tight mt-0.5 truncate">{t.d}</div>
              </div>
            </motion.div>
          );
        })}

        {/* Плашка УРОВЕНЬ СТУДИИ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, x: "-50%", y: "-50%" }}
          animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
          transition={{ duration: 0.6, delay: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute flex flex-col items-center justify-center rounded-2xl text-center px-5"
          style={{ top: "50%", left: "74%", width: 180, height: 100, background: "rgba(182,255,0,0.12)", border: "2px solid #B6FF00", boxShadow: "0 0 60px rgba(182,255,0,0.5)" }}
        >
          <span className="font-bold uppercase leading-[1.05]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 16, color: "#B6FF00" }}>УРОВЕНЬ<br />СТУДИИ</span>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.9 }}
        className="text-white/70 text-sm md:text-lg leading-snug max-w-3xl"
      >
        Вместе — сервис, который <span className="text-[#B6FF00] font-semibold">не отличить от того, что собирала студия за 5 млн</span>.
      </motion.div>
    </SlideLayout>
  );
}
