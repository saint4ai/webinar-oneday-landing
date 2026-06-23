"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 105 · Сводка кейсов. Текст 1-в-1 STRUCTURE 1306-1313.
 */
const ROWS = [
  { n: "Айдос", d: "US-контракт · 3 продукта в работе у заказчика" },
  { n: "Ренат", d: "AI-трекер тренировок · веб + Telegram" },
  { n: "Мерей", d: "GymTrainer · CRM для фитнес-тренеров" },
  { n: "Владислав", d: "Сервис для экспедиторов KZ" },
  { n: "Александр", d: "onAI.academy · 250+ учеников" },
];

export function Slide_105_CasesSummary() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={720} background={<SlideBg theme="dark" variant="aura-tl" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // СВОДКА
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 3cqw, 46px)" }}
      >
        5 РАЗНЫХ ЛЮДЕЙ. 5 НИШ. <span className="text-[#B6FF00]">5 ЧЕКОВ.</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug mb-6">
        Объединяет одно — все начали с нуля.
      </motion.div>

      <div className="flex flex-col gap-2.5 max-w-2xl mb-6">
        {ROWS.map((r, i) => (
          <motion.div
            key={r.n}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.5 + i * 0.13, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-center gap-3.5 rounded-xl px-4 py-2.5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#B6FF00", boxShadow: "0 0 12px rgba(182,255,0,0.7)" }} />
            <span className="text-white font-bold uppercase shrink-0" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 16, minWidth: 130 }}>{r.n}</span>
            <span className="text-white/60 text-sm leading-snug">{r.d}</span>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.3 }} className="text-white/75 text-base md:text-lg leading-snug max-w-2xl">
        Не было «таланта к программированию». Был <span className="text-[#B6FF00] font-semibold">вайбкодинг</span>.
      </motion.div>
    </SlideLayout>
  );
}
