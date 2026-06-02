"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { MessageCircle } from "lucide-react";

/**
 * Слайд 80 · Engagement «чувствую». Текст 1-в-1 STRUCTURE 974-978.
 */
export function Slide_80_FeelEngagement() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={720}
      background={<SlideBg theme="dark" variant="dual-bottom" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ВОПРОС В ЧАТ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.02] tracking-[-0.03em] mb-5 max-w-3xl"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 4vw, 64px)" }}
      >
        УЖЕ ЧУВСТВУЕТЕ, КАК НЕЙРОСЕТИ ДЕЛАЮТ ЖИЗНЬ <span className="text-[#B6FF00]">ПРОЩЕ?</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.34, 1.4, 0.64, 1] }}
        className="inline-flex items-center gap-3 rounded-2xl px-5 py-3.5"
        style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 50px -16px rgba(182,255,0,0.5)" }}
      >
        <MessageCircle className="w-5 h-5 text-[#B6FF00]" strokeWidth={2} />
        <span className="text-white text-base md:text-lg">
          Напишите <span className="font-bold text-[#B6FF00]">«чувствую»</span> в чат
        </span>
      </motion.div>
    </SlideLayout>
  );
}
