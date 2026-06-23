"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 169 · Спасибо что остались. Текст 1-в-1 STRUCTURE 2323-2324.
 * Визуал по STRUCTURE — Spline-робот машет (опционально, как на Slide 1). Сейчас — чистый кинематографичный финал.
 */
export function Slide_169_ThankYou() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="lime-right" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // ФИНАЛ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-5"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(34px, 4.6cqw, 74px)" }}
      >
        СПАСИБО ЧТО <span className="text-[#B6FF00]">ОСТАЛИСЬ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }} className="text-white/70 text-base md:text-xl max-w-2xl">
        До встречи внутри программы — или просто в моём инстаграме.
      </motion.div>
    </SlideLayout>
  );
}
