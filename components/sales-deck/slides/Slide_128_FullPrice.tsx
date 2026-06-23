"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { ArrowDown } from "lucide-react";

/**
 * Слайд 128 · Полная цена курса — 490 000 ₸. Текст 1-в-1 STRUCTURE 1662-1673.
 * DESIGN-LANGUAGE: DL-7 pricing. Перечёркнутая ценность → крупно 490К + тизер вниз.
 */
export function Slide_128_FullPrice() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // ПОЛНАЯ ЦЕНА В КАТАЛОГЕ
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex items-baseline gap-3 mb-3">
        <span className="text-white/40 line-through tabular-nums" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(22px,2.4cqw,38px)" }}>770 000 ₸*</span>
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-white/45">ценность компонентов</span>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 1, 0.5, 1] }} className="mb-4">
        <div className="font-bold leading-[0.9] tabular-nums whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(56px, 8cqw, 150px)", color: "#B6FF00", textShadow: "0 0 80px rgba(182,255,0,0.4)" }}>
          490 000 ₸
        </div>
        <div className="text-white/65 text-sm md:text-lg mt-1">цена обучения в каталоге · <span className="text-white">дешевле ценности почти в 2 раза</span></div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }} className="flex items-center gap-2.5 text-white/55 text-sm md:text-base max-w-2xl">
        <motion.span animate={{ y: [0, 5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
          <ArrowDown className="w-5 h-5 text-[#FC5C02]" strokeWidth={2.5} />
        </motion.span>
        490 — честная цена за то, что внутри. Но прежде чем про эфирные условия — <span className="text-[#B6FF00] font-semibold">посчитаю, за сколько это вернётся.</span>
      </motion.div>
    </SlideLayout>
  );
}
