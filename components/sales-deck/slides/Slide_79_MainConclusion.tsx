"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Users, User } from "lucide-react";

/**
 * Слайд 79 · Главный вывод. Текст 1-в-1 STRUCTURE 966-970.
 * Контраст: 5 человек × 6 месяцев (оранж) → 1 человек × 1 неделя (лайм).
 */
export function Slide_79_MainConclusion() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={740}
      background={<SlideBg theme="dark" variant="climax" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ГЛАВНЫЙ ВЫВОД
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 3.8cqw, 58px)" }}
      >
        ГЛАВНЫЙ <span className="text-[#B6FF00]">ВЫВОД</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/75 text-base md:text-xl leading-snug max-w-2xl mb-8"
      >
        Всё, что раньше делала команда из 5 человек — сейчас делает один человек с AI.
      </motion.div>

      {/* Контраст РАНЬШЕ → СЕЙЧАС */}
      <div className="flex items-stretch gap-4 max-w-3xl flex-wrap">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex-1 min-w-[230px] rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(252,92,2,0.3)" }}
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] mb-3" style={{ color: "#FC5C02" }}>раньше</div>
          <div className="flex gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => <User key={i} className="w-6 h-6" strokeWidth={1.8} style={{ color: "rgba(252,92,2,0.8)" }} />)}
          </div>
          <div className="font-bold leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(20px,2cqw,30px)", color: "rgba(255,255,255,0.5)", textDecoration: "line-through", textDecorationColor: "#FC5C02", textDecorationThickness: "2px" }}>5 человек × 6 месяцев</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.95 }}
          className="flex items-center justify-center shrink-0"
        >
          <span style={{ color: "#B6FF00", fontSize: "clamp(28px,3cqw,44px)" }}>→</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="flex-1 min-w-[230px] rounded-2xl p-5 relative overflow-hidden"
          style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 50px -12px rgba(182,255,0,0.5)" }}
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] mb-3" style={{ color: "#B6FF00" }}>сейчас</div>
          <div className="flex items-center gap-2 mb-3">
            <User className="w-7 h-7 text-[#B6FF00]" strokeWidth={2} />
            <span className="text-white/40 text-sm">+ AI</span>
          </div>
          <div className="font-bold leading-none text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(20px,2cqw,30px)" }}>1 человек × 1 неделя</div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
