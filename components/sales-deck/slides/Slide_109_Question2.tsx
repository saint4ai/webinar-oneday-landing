"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 109 · Вопрос 2 — «А РЕАЛЬНО ЛИ ЗАРАБОТАТЬ?». Текст 1-в-1 STRUCTURE 1356-1368.
 * DESIGN-LANGUAGE: DL-6 data-viz / dashboard. Доминанта — крупные KPI-плитки реальных цифр,
 * 10.5М ₸ — герой. Не дефолт-сетка: цифры доминируют, кикер мелкий.
 */
const STATS = [
  { value: "60+", unit: "клиентов", label: "AI-Таргетолог", sub: "чек 49–99 тыс ₸/мес · подписка" },
  { value: "17", unit: "клиентов", label: "OmniDash", sub: "чек 150 тыс ₸/мес" },
];

export function Slide_109_Question2() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // ВОПРОС 2 — «А РЕАЛЬНО ЛИ ЗАРАБОТАТЬ?» · <span className="text-white/55">БЕЗ ОКРУГЛЕНИЙ</span>
      </motion.div>

      {/* Герой: 10.5М */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 1, 0.5, 1] }} className="rounded-2xl px-6 py-5 mb-3 max-w-4xl w-fit" style={{ background: "rgba(182,255,0,0.09)", border: "1px solid rgba(182,255,0,0.35)", boxShadow: "0 0 70px -26px rgba(182,255,0,0.5)" }}>
        <div className="font-bold leading-none tabular-nums whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(34px, 4.8cqw, 84px)", color: "#B6FF00" }}>
          10 500 000 ₸
        </div>
        <div className="text-white/70 text-sm md:text-base mt-2">один клиентский проект <span className="text-white/40">· + ещё 600 000 ₸ и 400 000 ₸</span></div>
      </motion.div>

      {/* 2 KPI-плитки */}
      <div className="flex flex-wrap gap-3 max-w-3xl mb-5">
        {STATS.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 + i * 0.16 }} className="flex-1 min-w-[200px] rounded-xl px-5 py-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-baseline gap-2">
              <span className="font-bold tabular-nums" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(28px,3cqw,46px)", color: "#B6FF00" }}>{s.value}</span>
              <span className="text-white/50 text-sm">{s.unit}</span>
            </div>
            <div className="text-white font-semibold text-sm md:text-base mt-1">{s.label}</div>
            <div className="text-white/45 text-xs md:text-sm mt-0.5">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.95 }} className="text-white/65 text-sm md:text-base leading-snug max-w-3xl mb-1.5">
        Не у меня — у моих учеников: Айдос с американцами, Мерей с GymTrainer, Владислав с экспедиторами.
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.2 }} className="text-white text-base md:text-xl font-semibold leading-snug max-w-3xl">
        Рынок реальный. Цифры реальные. Вопрос «реально ли» — <span className="text-[#B6FF00]">закрыт</span>.
      </motion.div>
    </SlideLayout>
  );
}
