"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Check, Gift } from "lucide-react";

/** Слайд 137 · Итог — что вы получаете за 290 900 ₸. Текст 1-в-1 STRUCTURE 1867-1880. DL-7. */
const COURSE = [
  "10 модулей · 54 урока программы Vibe Coding PRO",
  "Сквозной кейс: свой AI-сервис в интернете",
  "Доступ в OPUS.CLUB на 12 месяцев",
];
const BONUSES = ["Б-1 · Обучение Claude Code Базовый", "Б-2 · AI-Таргетолог как скилл"];

export function Slide_137_WhatYouGet() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ИТОГ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-5"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 3vw, 46px)" }}
      >
        ЧТО ВЫ ПОЛУЧАЕТЕ ЗА <span className="text-[#B6FF00]">290 900 ₸</span>
      </motion.h1>

      <div className="grid grid-cols-2 gap-4 max-w-3xl mb-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 0.4 }} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="font-bold uppercase text-white tracking-[0.06em] mb-3" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 18 }}>ОБУЧЕНИЕ</div>
          <div className="flex flex-col gap-2.5">
            {COURSE.map((c, i) => (
              <div key={i} className="flex items-start gap-2.5"><Check className="w-4 h-4 mt-0.5 shrink-0 text-[#B6FF00]" strokeWidth={2.8} /><span className="text-white/80 text-sm leading-snug">{c}</span></div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 0.5 }} className="rounded-2xl p-5" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.3)" }}>
          <div className="font-bold uppercase text-[#B6FF00] tracking-[0.06em] mb-3" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 18 }}>2 БОНУСА ЗА ПРЕДОПЛАТУ</div>
          <div className="flex flex-col gap-2.5">
            {BONUSES.map((b, i) => (
              <div key={i} className="flex items-start gap-2.5"><Gift className="w-4 h-4 mt-0.5 shrink-0 text-[#B6FF00]" strokeWidth={2.2} /><span className="text-white/85 text-sm leading-snug">{b}</span></div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.0 }} className="flex items-center gap-3 flex-wrap max-w-3xl">
        <span className="rounded-xl px-4 py-2.5 font-bold text-[#B6FF00]" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)", fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(16px,1.6vw,24px)" }}>
          ценность 770К → ×2.6 выгоды
        </span>
        <span className="text-[#FC5C02] text-sm md:text-base font-semibold">+ полная оплата до конца дня → ещё 5 бонусов сверху. Покажу через минуту.</span>
      </motion.div>
    </SlideLayout>
  );
}
