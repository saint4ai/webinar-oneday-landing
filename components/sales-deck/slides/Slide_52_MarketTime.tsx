"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 52 · Сколько времени. Текст 1-в-1 STRUCTURE 625-629.
 * Свежая шкала «7—14 дней» (компакт-бар с заливкой) — отлична от таймлайна Slide 20.
 */
export function Slide_52_MarketTime() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={700}
      background={<SlideBg theme="dark" variant="aura-tr" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // СКОЛЬКО ВРЕМЕНИ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-8"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(30px, 3.6vw, 56px)",
        }}
      >
        СКОЛЬКО <span className="text-[#B6FF00]">ЗАЙМЁТ ВРЕМЕНИ</span>
      </motion.h1>

      {/* Гигант «7—14 дней» + заливающийся бар */}
      <div className="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="flex items-baseline gap-3 mb-5"
          style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif" }}
        >
          <span className="font-bold leading-none text-[#B6FF00]" style={{ fontSize: "clamp(56px, 8vw, 130px)", textShadow: "0 0 70px rgba(182,255,0,0.4)" }}>7</span>
          <span className="font-bold leading-none text-white/40" style={{ fontSize: "clamp(40px, 5vw, 84px)" }}>—</span>
          <span className="font-bold leading-none text-[#B6FF00]" style={{ fontSize: "clamp(56px, 8vw, 130px)", textShadow: "0 0 70px rgba(182,255,0,0.4)" }}>14</span>
          <span className="font-bold uppercase text-white leading-none ml-1" style={{ fontSize: "clamp(28px, 3vw, 52px)" }}>дней</span>
        </motion.div>

        {/* Бар с заливкой */}
        <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5, delay: 0.5, ease: [0.25, 1, 0.5, 1] }}
            className="absolute inset-0 rounded-full origin-left"
            style={{ background: "linear-gradient(to right, #B6FF00, #FC5C02)", boxShadow: "0 0 18px rgba(182,255,0,0.5)" }}
          />
        </div>
        <div className="flex justify-between mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-white/45">
          <span>техзадание</span>
          <span>запуск</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-white/70 text-base md:text-xl leading-snug mt-7"
        >
          7–14 дней от техзадания до запуска. <span className="text-white/45">Всё зависит от вашего опыта.</span>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
