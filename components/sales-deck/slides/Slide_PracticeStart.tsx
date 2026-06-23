"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд-переход «Приступаем к практике» — ДЕМО (зрители СМОТРЯТ, не делают вместе).
 * Сигнал: хватит теории — сейчас вживую соберу приложение, смотри как просто.
 */
export function Slide_PracticeStart() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="lime-right" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // ХВАТИТ ТЕОРИИ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-5"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(36px, 5cqw, 84px)" }}
      >
        ПРИСТУПАЕМ К <span className="text-[#B6FF00]">ПРАКТИКЕ!</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }} className="text-white/75 text-base md:text-xl leading-snug max-w-2xl">
        Сейчас на твоих глазах соберу <span className="text-[#B6FF00] font-semibold">рабочее приложение</span> с нуля — смотри, как это просто.
      </motion.div>
    </SlideLayout>
  );
}
