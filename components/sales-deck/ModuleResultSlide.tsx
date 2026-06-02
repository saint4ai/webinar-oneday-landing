"use client";

import { motion } from "framer-motion";
import { SlideBg } from "./SlideBg";
import { SlideLayout } from "./SlideLayout";
import { Flame, Check } from "lucide-react";

/**
 * ModuleResultSlide — слайд РЕЗУЛЬТАТА модуля (пара к ModuleSlide). DL-6 / cinematic payoff.
 * Лайм-доминанта: «РЕЗУЛЬТАТ МОДУЛЯ N» + чек-буллеты + Точка Б + крупная лайм-плашка-панч.
 */
export interface ModuleResultSlideProps {
  no: string;
  results: string[];
  pointB: string;
  limeBlock: string;
  variant?: "climax" | "lime-right" | "aura-tr" | "dual-bottom";
}

export function ModuleResultSlide({ no, results, pointB, limeBlock, variant = "climax" }: ModuleResultSlideProps) {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant={variant} />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center gap-2 mb-4">
        <Flame className="w-4 h-4 text-[#B6FF00]" strokeWidth={2.2} />
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00]">Результат · Модуль {no}</span>
      </motion.div>

      <div className="flex flex-col gap-3 max-w-3xl mb-5">
        {results.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.25 + i * 0.16, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-start gap-3"
          >
            <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(182,255,0,0.14)", border: "1px solid rgba(182,255,0,0.35)" }}>
              <Check className="w-3.5 h-3.5 text-[#B6FF00]" strokeWidth={3} />
            </span>
            <span className="text-white/85 text-base md:text-lg leading-snug">{r}</span>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 + results.length * 0.16 }} className="max-w-3xl mb-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45 mr-2">Точка Б</span>
        <span className="text-white text-base md:text-lg leading-snug">{pointB}</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.55 + results.length * 0.16, ease: [0.25, 1, 0.5, 1] }}
        className="inline-block rounded-2xl px-5 py-4 max-w-3xl"
        style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 60px -18px rgba(182,255,0,0.5)" }}
      >
        <span className="text-white text-base md:text-xl font-semibold leading-snug">{limeBlock}</span>
      </motion.div>
    </SlideLayout>
  );
}
