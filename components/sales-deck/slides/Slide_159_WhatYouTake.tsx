"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Check } from "lucide-react";

/** Слайд 159 · Что вы уносите. Текст 1-в-1 STRUCTURE 2216-2221. */
const ITEMS = [
  "Понимание что такое вайбкодинг — не магия, метод",
  "Картина 3 направлений и где деньги",
  "Собранное собственное Android-приложение",
  "Понимание подходит вам это или нет",
];

export function Slide_159_WhatYouTake() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="dual-bottom" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ИТОГ ВОРКШОПА
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-6"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(34px, 4.4cqw, 66px)" }}
      >
        ЧТО ВЫ <span className="text-[#B6FF00]">УНОСИТЕ</span>
      </motion.h1>
      <div className="flex flex-col gap-2.5 max-w-2xl">
        {ITEMS.map((it, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.4 + i * 0.14 }} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.25)" }}>
            <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(182,255,0,0.15)" }}>
              <Check className="w-4 h-4 text-[#B6FF00]" strokeWidth={3} />
            </span>
            <span className="text-white/90 text-sm md:text-lg">{it}</span>
          </motion.div>
        ))}
      </div>
    </SlideLayout>
  );
}
