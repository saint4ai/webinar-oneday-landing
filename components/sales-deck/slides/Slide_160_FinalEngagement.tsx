"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/** Слайд 160 · Engagement — как вам воркшоп. Текст 1-в-1 STRUCTURE 2228-2229. */
export function Slide_160_FinalEngagement() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={720} background={<SlideBg theme="dark" variant="aura-tr" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4">
        // ВОПРОС В ЧАТ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.02em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(34px, 4.4cqw, 68px)" }}
      >
        КАК ВАМ <span className="text-[#B6FF00]">ВОРКШОП?</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }} className="text-white/70 text-base md:text-xl">
        Напишите в чат пару слов.
      </motion.div>
    </SlideLayout>
  );
}
