"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 113 · Программа курса — обзор. Текст 1-в-1 STRUCTURE 1414-1422.
 * 10 модулей квадратиками (2×5) + крупная «50 уроков» + плашка «12 мес».
 * Задаёт syllabus-обзор: номер-бейдж + короткое имя модуля.
 */
const MODULES = [
  "Запуск двигателя", "Язык агента", "Конституция проекта", "Резервная копия", "Прокачка агента",
  "Армия агентов", "Боевой запуск", "База данных", "Деньги на счёт", "Первый клиент",
];

export function Slide_113_ProgramOverview() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ПРОГРАММА
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 3vw, 46px)" }}
      >
        ПРОГРАММА <span className="text-[#B6FF00]">VIBE CODING PRO</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug mb-5 max-w-2xl">
        10 модулей · 50 уроков · сквозной кейс · доступ в OPUS.CLUB на 12 месяцев.
      </motion.div>

      <div className="flex items-start gap-5 max-w-3xl">
        {/* 10 модулей сеткой 5×2 */}
        <div className="grid grid-cols-5 gap-2.5 flex-1">
          {MODULES.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.55 + i * 0.07, ease: [0.34, 1.4, 0.64, 1] }}
              className="rounded-xl px-2.5 py-3 flex flex-col gap-1.5"
              style={{ background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.2)" }}
            >
              <span className="font-bold leading-none" style={{ color: "#B6FF00", fontFamily: "var(--font-benzin), system-ui", fontSize: 22 }}>{i + 1}</span>
              <span className="text-white/75 leading-tight" style={{ fontSize: 11 }}>{m}</span>
            </motion.div>
          ))}
        </div>

        {/* Крупная «50 уроков» + плашка 12 мес */}
        <motion.div
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          className="flex flex-col items-center gap-3 rounded-2xl px-6 py-5 shrink-0"
          style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.35)", boxShadow: "0 0 60px -20px rgba(182,255,0,0.5)" }}
        >
          <div className="text-center">
            <div className="font-bold leading-none text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 56 }}>50</div>
            <div className="text-white/70 text-xs uppercase tracking-[0.12em] mt-1">уроков</div>
          </div>
          <div className="rounded-full px-3.5 py-1.5 text-center" style={{ background: "rgba(252,92,2,0.12)", border: "1px solid rgba(252,92,2,0.35)" }}>
            <span className="text-[#FC5C02] text-xs font-semibold whitespace-nowrap">12 мес доступа</span>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.6 }} className="text-white/75 text-sm md:text-base leading-snug max-w-2xl mt-5">
        От «не знаю с чего начать» до <span className="text-[#B6FF00] font-semibold">первого платящего клиента с чеком от $500</span>. Дальше покажу каждый модуль и что он лично вам даёт.
      </motion.div>
    </SlideLayout>
  );
}
