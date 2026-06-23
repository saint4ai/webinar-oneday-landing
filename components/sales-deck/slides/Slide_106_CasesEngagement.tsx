"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 106 · Engagement. Текст по STRUCTURE 1317-1321 (почищены опечатки).
 */
const NAMES = ["Айдос", "Ренат", "Мерей", "Владислав", "Александр"];

export function Slide_106_CasesEngagement() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={720} background={<SlideBg theme="dark" variant="lime-right" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4">
        // ВОПРОС В ЧАТ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.02] tracking-[-0.02em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.6cqw, 56px)" }}
      >
        ХОТИТЕ ТАК ЖЕ — <span className="text-[#B6FF00]">С ПОЛНОГО НУЛЯ?</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/70 text-base md:text-lg leading-snug max-w-xl mb-6">
        Напишите <span className="text-[#B6FF00] font-semibold">+</span> в чат. И имя того, чей кейс ближе.
      </motion.div>

      <div className="flex flex-wrap gap-2.5 max-w-2xl">
        {NAMES.map((n, i) => (
          <motion.span
            key={n}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.6 + i * 0.1, ease: [0.34, 1.4, 0.64, 1] }}
            className="rounded-xl px-4 py-2.5 text-white font-semibold text-sm md:text-base"
            style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.3)" }}
          >
            {n}
          </motion.span>
        ))}
        <motion.span
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.6 + NAMES.length * 0.1, ease: [0.34, 1.4, 0.64, 1] }}
          className="rounded-xl px-4 py-2.5 text-white/50 text-sm md:text-base"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.2)" }}
        >
          или ваше
        </motion.span>
      </div>
    </SlideLayout>
  );
}
