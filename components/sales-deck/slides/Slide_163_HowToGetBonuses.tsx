"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { AtSign } from "lucide-react";

/** Слайд 163 · Как получить бонусы. Текст 1-в-1 STRUCTURE 2267-2269. */
const STEPS = [
  { n: "Шаг 1", t: "Открываете мой инстаграм @saint4ai" },
  { n: "Шаг 2", t: "Пишете в директ кодовое слово" },
  { n: "Шаг 3", t: "Я отправляю вам все три бонуса" },
];

export function Slide_163_HowToGetBonuses() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="28vw"
      contentMinWidth={520}
      background={<SlideBg theme="dark" variant="lime-right" />}
      leftObject={
        <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3, ease: [0.34, 1.4, 0.64, 1] }} className="flex items-center justify-center w-full">
          <AtSign className="text-[#B6FF00]" strokeWidth={1.1} style={{ width: "clamp(120px, 15vw, 240px)", height: "auto", filter: "drop-shadow(0 0 50px rgba(182,255,0,0.35))" }} />
        </motion.div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ИНСТРУКЦИЯ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-6"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 3.8vw, 56px)" }}
      >
        КАК ПОЛУЧИТЬ <span className="text-[#B6FF00]">БОНУСЫ</span>
      </motion.h1>
      <div className="flex flex-col gap-3 max-w-xl">
        {STEPS.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.4 + i * 0.15 }} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#B6FF00] font-bold shrink-0 w-12">{s.n}</span>
            <span className="text-white/90 text-sm md:text-lg">{s.t}</span>
          </motion.div>
        ))}
      </div>
    </SlideLayout>
  );
}
