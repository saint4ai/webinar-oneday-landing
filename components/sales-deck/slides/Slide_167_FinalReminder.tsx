"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 167 · Вторая продажа — для тех, кто ещё думает. Человечный re-offer предоплаты.
 * Без фейк-мест и фейк-часа: предоплата = бронь, держит цену до конца суток.
 */
const CHIPS = [
  "10 000 ₸ — это бронь, не вся оплата",
  "цена 290 900 ₸ + бонусы держатся до конца суток",
];

export function Slide_167_FinalReminder() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="orange-pain" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#FC5C02] mb-4">
        // ЕСЛИ ЕЩЁ ДУМАЕШЬ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.02] tracking-[-0.03em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.6cqw, 56px)" }}
      >
        ЕЩЁ ДУМАЕШЬ? <span className="text-[#FC5C02]">ЭТО НОРМАЛЬНО</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/80 text-lg md:text-2xl leading-snug max-w-3xl mb-3 font-light">
        Большие решения не принимают за минуту.
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="text-white/65 text-base md:text-lg leading-snug max-w-3xl mb-7">
        Предоплата <span className="text-[#B6FF00] font-semibold">10 000 ₸</span> — это бронь, а не вся сумма. Она держит за тобой цену и бонусы, пока ты спокойно думаешь. Надумаешь — доплатишь остаток. День на решение у тебя есть.
      </motion.div>

      <div className="flex flex-wrap gap-3">
        {CHIPS.map((c, i) => (
          <motion.div key={c} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.7 + i * 0.12 }} className="flex items-center gap-2 rounded-lg px-3.5 py-2" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.22)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#B6FF00] shrink-0" />
            <span className="text-white/85 text-sm md:text-base">{c}</span>
          </motion.div>
        ))}
      </div>
    </SlideLayout>
  );
}
