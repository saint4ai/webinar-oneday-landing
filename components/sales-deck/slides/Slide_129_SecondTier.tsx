"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { ArrowDown } from "lucide-react";

/**
 * Слайд 129 · Вторая ступень — 390 000 ₸. Текст 1-в-1 STRUCTURE 1677-1685.
 * DESIGN-LANGUAGE: DL-7 pricing. 490К перечёркнуто → 390К + плашка -100 000 ₸.
 */
export function Slide_129_SecondTier() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // СТУПЕНЬ 2 · ДЛЯ ТЕХ, КТО ОСТАЛСЯ НА ЭФИРЕ
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex items-baseline gap-3 mb-3">
        <span className="text-white/40 line-through tabular-nums" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(24px,2.6cqw,42px)" }}>490 000 ₸</span>
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-white/45">каталог</span>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 1, 0.5, 1] }} className="flex items-end gap-5 mb-4 flex-wrap">
        <div className="font-bold leading-[0.9] tabular-nums whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(56px, 8cqw, 150px)", color: "#B6FF00", textShadow: "0 0 80px rgba(182,255,0,0.4)" }}>
          390 000 ₸
        </div>
        <div className="rounded-xl px-4 py-2.5 mb-3" style={{ background: "rgba(252,92,2,0.12)", border: "1px solid rgba(252,92,2,0.4)" }}>
          <span className="font-bold text-[#FC5C02]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(18px,1.8cqw,28px)" }}>−100 000 ₸</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }} className="flex items-center gap-2.5 text-white/55 text-sm md:text-base max-w-2xl">
        <motion.span animate={{ y: [0, 5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
          <ArrowDown className="w-5 h-5 text-[#FC5C02]" strokeWidth={2.5} />
        </motion.span>
        Это вторая ступень скидки — за то, что ты всё ещё здесь, с нами в эфире. Остался до этой минуты — <span className="text-[#B6FF00] font-semibold">она твоя</span>.
      </motion.div>
    </SlideLayout>
  );
}
