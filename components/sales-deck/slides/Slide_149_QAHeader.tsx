"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/** Слайд 149 · Заголовок Q&A. Текст 1-в-1 STRUCTURE 2090-2091. */
export function Slide_149_QAHeader() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="26cqw"
      contentMinWidth={460}
      background={<SlideBg theme="dark" variant="aura-tl" />}
      leftObject={
        <motion.div initial={{ opacity: 0, scale: 0.6, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: [0.34, 1.4, 0.64, 1] }} className="flex items-center justify-center w-full">
          <span className="font-bold leading-none select-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(160px, 22cqw, 380px)", color: "#B6FF00", textShadow: "0 0 80px rgba(182,255,0,0.35)" }}>?</span>
        </motion.div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // Q&A · ВОЗРАЖЕНИЯ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 3.6cqw, 52px)" }}
      >
        ЧТО ОБЫЧНО <span className="text-[#B6FF00]">СПРАШИВАЮТ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }} className="text-white/70 text-base md:text-xl">
        Четыре главных вопроса.
      </motion.div>
    </SlideLayout>
  );
}
