"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Check } from "lucide-react";

/**
 * Слайд 111 · Поэтому я собрал программу. Текст 1-в-1 STRUCTURE 1389-1392.
 * DESIGN-LANGUAGE: DL-5 cinematic pivot. Огромный месседж + 4 вещи собираются лайм-чипами.
 */
const FOUR = ["Понятная карта", "Готовые шаблоны", "Поддержка", "Первые клиенты"];

export function Slide_111_WhatIBuilt() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // ПЕРЕХОД К ПРОДАЖЕ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.9, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[0.96] tracking-[-0.03em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(40px, 6vw, 96px)" }}
      >
        ПОЭТОМУ Я СОБРАЛ <span className="text-[#B6FF00]">ПРОГРАММУ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.5 }} className="text-white/75 text-xl md:text-3xl font-light leading-snug mb-8">
        Где есть <span className="text-white font-semibold">все четыре вещи.</span>
      </motion.div>

      <div className="flex flex-wrap gap-2.5 max-w-3xl">
        {FOUR.map((label, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.9 + i * 0.16, ease: [0.34, 1.4, 0.64, 1] }}
            className="flex items-center gap-2 rounded-full pl-2.5 pr-4 py-2"
            style={{ background: "rgba(182,255,0,0.09)", border: "1px solid rgba(182,255,0,0.38)" }}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "#B6FF00" }}><Check className="w-3 h-3 text-black" strokeWidth={3.5} /></span>
            <span className="text-white/90 font-medium text-sm md:text-base whitespace-nowrap">{label}</span>
          </motion.div>
        ))}
      </div>
    </SlideLayout>
  );
}
