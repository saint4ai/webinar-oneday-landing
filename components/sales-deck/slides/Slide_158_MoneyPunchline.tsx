"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/** Слайд 158 · Punchline «вот столько денег». Текст 1-в-1 STRUCTURE 2199-2204. */
export function Slide_158_MoneyPunchline() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // АРИФМЕТИКА, НЕ «МОЖЕТ БЫТЬ»
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 4vw, 60px)" }}
      >
        ВОТ СТОЛЬКО <span className="text-[#B6FF00]">ДЕНЕГ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }} className="text-white/60 text-base md:text-xl mb-5">
        На расстоянии вытянутой руки.
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.6, ease: [0.25, 1, 0.5, 1] }} className="flex items-baseline gap-3 mb-5">
        <span className="font-bold leading-none tabular-nums" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(60px, 8vw, 150px)", color: "#B6FF00", textShadow: "0 0 70px rgba(182,255,0,0.35)" }}>500 000</span>
        <span className="font-bold text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(28px,3vw,52px)" }}>₸</span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }} className="flex flex-col gap-1.5 text-white/75 text-sm md:text-lg max-w-2xl">
        <div>Первый клиент = <span className="text-white font-semibold">300–500К ₸</span>. Собрать за 2 недели. Найти за 7 дней.</div>
        <div>Время до первых денег с момента старта — <span className="text-[#B6FF00] font-semibold">30 дней</span>.</div>
      </motion.div>
    </SlideLayout>
  );
}
