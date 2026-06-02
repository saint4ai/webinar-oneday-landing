"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { ShieldCheck } from "lucide-react";

/** Слайд 154 · Гарантия. Текст 1-в-1 STRUCTURE 2152-2153. */
export function Slide_154_Guarantee() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="30vw"
      contentMinWidth={520}
      background={<SlideBg theme="dark" variant="lime-right" />}
      leftObject={
        <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.3, ease: [0.34, 1.4, 0.64, 1] }} className="flex items-center justify-center w-full">
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <ShieldCheck className="text-[#B6FF00]" strokeWidth={1.1} style={{ width: "clamp(140px, 18vw, 280px)", height: "auto", filter: "drop-shadow(0 0 50px rgba(182,255,0,0.4))" }} />
          </motion.div>
        </motion.div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // РИСК НА МНЕ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-5"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(36px, 4.6vw, 72px)" }}
      >
        НАША <span className="text-[#B6FF00]">ГАРАНТИЯ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="text-white/80 text-base md:text-xl leading-snug max-w-xl rounded-xl px-5 py-4" style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.3)" }}>
        Выполните 3 практических задания за первые 2 недели и не получите результата — <span className="text-[#B6FF00] font-semibold">возвращаем 100%</span>.
      </motion.div>
    </SlideLayout>
  );
}
