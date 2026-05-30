"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { ArrowDown } from "lucide-react";

/**
 * Слайд 128 · Полная цена курса 490 000 ₸. Текст 1-в-1 STRUCTURE 1662-1673.
 * Слева перечёркнутая ценность серым → справа крупно 490 000 ₸ лаймом.
 * Плашка «×2 выгоды» + тизер-стрелка «но это не финал».
 */
export function Slide_128_FullPrice() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={740}
      background={<SlideBg theme="dark" variant="aura-tl" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ЦЕНА В КАТАЛОГЕ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3.2vw, 50px)" }}
      >
        ПОЛНАЯ ЦЕНА В КАТАЛОГЕ — <span className="text-[#B6FF00]">490 000 ₸</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="text-white/65 text-sm md:text-base leading-snug mb-8 max-w-2xl"
      >
        Это рыночная цена курса начиная со 2-го потока. Дешевле рыночной ценности почти в 2 раза.
      </motion.div>

      {/* Ценность (перечёркнута серым) → цена 490К лаймом */}
      <div className="flex items-stretch gap-4 max-w-3xl flex-wrap">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex-1 min-w-[230px] rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] mb-3 text-white/45">на рынке такое стоит</div>
          <div
            className="font-bold leading-none"
            style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(20px,2vw,30px)", color: "rgba(255,255,255,0.45)", textDecoration: "line-through", textDecorationColor: "rgba(255,255,255,0.5)", textDecorationThickness: "2px" }}
          >
            · добавит Александр ₸
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.95 }}
          className="flex items-center justify-center shrink-0"
        >
          <span style={{ color: "#B6FF00", fontSize: "clamp(28px,3vw,44px)" }}>→</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          className="flex-1 min-w-[230px] rounded-2xl p-5 relative overflow-hidden"
          style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 50px -12px rgba(182,255,0,0.5)" }}
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] mb-3 text-[#B6FF00]">цена в каталоге</div>
          <div className="font-bold leading-none text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(24px,2.6vw,40px)" }}>490 000 ₸</div>
          <div className="text-white/50 text-xs mt-2">меньше рыночной ценности компонентов</div>
        </motion.div>
      </div>

      {/* Плашка ×2 + тизер-стрелка вниз */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.5 }}
        className="flex items-center gap-4 mt-7 flex-wrap"
      >
        <span
          className="inline-flex items-center rounded-xl px-4 py-2 font-bold text-sm"
          style={{ background: "rgba(182,255,0,0.12)", border: "1px solid rgba(182,255,0,0.35)", color: "#B6FF00" }}
        >
          ×2 выгоды
        </span>
        <span className="text-white/50 text-sm md:text-base">
          Но это цена для следующих потоков. На этом эфире —{" "}
          <span className="text-white/85 font-semibold">2 ступени скидки.</span>
        </span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#B6FF00]"
        >
          но это не финал <ArrowDown className="w-4 h-4" strokeWidth={2.4} />
        </motion.span>
      </motion.div>
    </SlideLayout>
  );
}
