"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { CalendarCheck, Flame } from "lucide-react";

/**
 * Слайд 73 · Что мы соберём. Текст 1-в-1 STRUCTURE 908-912.
 * 2 карточки выбора (трекер привычек / калькулятор калорий) + плейсхолдер 3-й темы.
 *
 * ⚠️ Пометка Александра (STRUCTURE 927): «Надо дать им на выбор что будем делать —
 * дать на выбор 3 темы которые быстро и просто собираются в google ai studio
 * и при этом популярные как приложения». 3-ю тему выбрать с Александром.
 */
const CHOICES = [
  { icon: CalendarCheck, t: "Трекер привычек", d: "отмечай привычки, веди серии, статистику", bars: [80, 55, 95, 40, 70] },
  { icon: Flame, t: "Калькулятор калорий", d: "считай КБЖУ, цель на день, прогресс", bars: [60, 90, 45, 75, 50] },
];

export function Slide_73_WhatBuild() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={760}
      background={<SlideBg theme="dark" variant="aura-tl" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ПРАКТИКА · ВЫБОР
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 3.8vw, 58px)" }}
      >
        ЧТО МЫ СОБЕРЁМ <span className="text-[#B6FF00]">ВМЕСТЕ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/65 text-base md:text-lg leading-snug mb-8"
      >
        Трекер привычек или калькулятор калорий — на ваш выбор.
      </motion.div>

      <div className="grid grid-cols-2 gap-5 max-w-3xl">
        {CHOICES.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.t}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 + i * 0.15, ease: [0.25, 1, 0.5, 1] }}
              className="rounded-2xl p-5"
              style={{ background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.25)" }}
            >
              {/* мини-экран приложения */}
              <div className="rounded-xl mb-4 p-3 flex flex-col gap-1.5" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", height: 110 }}>
                <Icon className="w-5 h-5 text-[#B6FF00] mb-1" strokeWidth={1.9} />
                <div className="flex items-end gap-1.5 flex-1">
                  {c.bars.map((b, j) => (
                    <motion.div
                      key={j}
                      initial={{ height: 0 }}
                      animate={{ height: `${b}%` }}
                      transition={{ duration: 0.6, delay: 0.9 + i * 0.15 + j * 0.06 }}
                      className="flex-1 rounded-sm"
                      style={{ background: `rgba(182,255,0,${0.3 + b / 200})` }}
                    />
                  ))}
                </div>
              </div>
              <div className="text-white font-bold text-base md:text-lg leading-tight">{c.t}</div>
              <div className="text-white/45 text-xs md:text-sm mt-1 leading-snug">{c.d}</div>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}
