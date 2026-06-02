"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Puzzle } from "lucide-react";

/**
 * Слайд 66 · Skills — навыки для Claude. Текст 1-в-1 STRUCTURE 813-825.
 * 4 скила «патчами» прилетают к ядру Claude; лайм-блок про точность ×3.
 */
const SKILLS = [
  ["frontend-design", "красивый интерфейс без дешёвого «AI-вида»"],
  ["presentation-storyliner", "слайды по продающей структуре"],
  ["landing-page-architect", "лендинги по 8-блочной схеме"],
  ["copywriting-system", "текст под нужную аудиторию и одну цель"],
];

export function Slide_66_Skills() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={720}
      background={<SlideBg theme="dark" variant="aura-tl" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ИНСТРУМЕНТ 1 · SKILLS
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.4vw, 52px)" }}
      >
        SKILLS — <span className="text-[#B6FF00]">НАВЫКИ ДЛЯ CLAUDE</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mb-5"
      >
        Один раз поставил — Claude знает, как делать этот класс задач. <span className="text-white/85">Скилл = мини-инструкция внутри Claude Code, которая учит агента конкретной экспертизе.</span>
      </motion.div>

      {/* 4 скила-патча */}
      <div className="grid grid-cols-2 gap-3 max-w-3xl mb-5">
        {SKILLS.map((s, i) => (
          <motion.div
            key={s[0]}
            initial={{ opacity: 0, x: -16, rotate: -3 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.45, delay: 0.6 + i * 0.13, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(182,255,0,0.18)" }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(182,255,0,0.12)" }}>
              <Puzzle className="w-4 h-4 text-[#B6FF00]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-[#B6FF00] text-xs md:text-sm font-semibold leading-tight">{s[0]}</div>
              <div className="text-white/55 text-xs md:text-sm mt-0.5 leading-snug">{s[1]}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="text-white/50 text-sm mb-4"
      >
        В Claude Code их десятки готовых. <span className="text-white/80">Свои скилы — пишутся за вечер.</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="inline-flex items-center rounded-xl px-4 py-2.5"
        style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.3)" }}
      >
        <span className="text-white/85 text-sm md:text-base leading-snug">
          Один раз настроил — каждый следующий запрос <span className="text-[#B6FF00] font-semibold">в 3 раза точнее</span>.
        </span>
      </motion.div>
    </SlideLayout>
  );
}
