"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 110 · Что нужно чтобы дойти до результата. Текст 1-в-1 STRUCTURE 1377-1383.
 * DESIGN-LANGUAGE: DL-2 swiss-grid. 2×2 модульная сетка с ghost-номерами + hairline-рамки.
 */
const NEEDS = [
  { n: "01", title: "Понятная карта", sub: "что делать и в какой последовательности" },
  { n: "02", title: "Готовые шаблоны", sub: "не изобретать с нуля" },
  { n: "03", title: "Поддержка", sub: "когда застрял и не понимаешь, как с этим работать" },
  { n: "04", title: "Первые клиенты", sub: "чтобы не сидеть с навыком без применения" },
];

export function Slide_110_WhatYouNeed() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="dual-bottom" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ПЕРЕХОД К ПРОДАЖЕ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-7"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3.4cqw, 52px)" }}
      >
        ЧТО НУЖНО, ЧТОБЫ ДОЙТИ <span className="text-[#B6FF00]">ДО РЕЗУЛЬТАТА</span>
      </motion.h1>

      <div className="grid grid-cols-2 gap-x-7 gap-y-6 max-w-3xl">
        {NEEDS.map((n, i) => (
          <motion.div
            key={n.n}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 + i * 0.14, ease: [0.25, 1, 0.5, 1] }}
            className="relative pt-4"
            style={{ borderTop: "1px solid rgba(182,255,0,0.3)" }}
          >
            <span className="font-bold leading-none select-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(26px,2.6cqw,40px)", color: "transparent", WebkitTextStroke: "1.2px rgba(182,255,0,0.55)" }}>
              {n.n}
            </span>
            <div className="text-white font-bold text-base md:text-xl leading-tight mt-2">{n.title}</div>
            <div className="text-white/55 text-sm md:text-base leading-snug mt-1">{n.sub}</div>
          </motion.div>
        ))}
      </div>
    </SlideLayout>
  );
}
