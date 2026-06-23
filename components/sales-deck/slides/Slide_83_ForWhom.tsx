"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 83 · Кому это. Текст 1-в-1 STRUCTURE 1015-1023.
 */
const PROFS = ["Маркетолог", "Таргетолог", "СММ-щик", "Копирайтер", "Бухгалтер", "Юрист", "HR", "Руководитель", "Фрилансер", "Эксперт"];

export function Slide_83_ForWhom() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={740}
      background={<SlideBg theme="dark" variant="aura-tl" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // КОМУ ЭТО
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.02em] mb-6"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 2.9cqw, 44px)" }}
      >
        ЕСЛИ ТЫ РАБОТАЕШЬ ЗА КОМПЬЮТЕРОМ — <span className="text-[#B6FF00]">ЭТО ДЛЯ ТЕБЯ</span>
      </motion.h1>

      <div className="flex flex-wrap gap-2.5 max-w-3xl mb-7">
        {PROFS.map((p, i) => (
          <motion.span
            key={p}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 + i * 0.08, ease: [0.34, 1.4, 0.64, 1] }}
            className="rounded-lg px-3.5 py-2 text-sm md:text-base font-medium"
            style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.22)", color: "rgba(255,255,255,0.9)" }}
          >
            {p}
          </motion.span>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.3 }}
        className="text-white/65 text-base md:text-lg leading-snug max-w-2xl"
      >
        Если в твоей рутине <span className="text-[#B6FF00] font-semibold">3+ часа в день</span> уходит на бумаги, переписки, таблицы, аналитику — это про Claude Code.
      </motion.div>
    </SlideLayout>
  );
}
