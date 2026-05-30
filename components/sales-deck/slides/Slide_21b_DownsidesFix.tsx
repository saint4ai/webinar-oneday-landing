"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";
import { ArrowRight } from "lucide-react";

/**
 * Слайд 21b · Минусы честно — вывод (часть 2 из 2).
 * Тема «проблема→решение» → оранж переходит в лайм (сдвиг от боли к решению).
 * Текст 1-в-1 из STRUCTURE (вторая половина — что с этим делать).
 */
export function Slide_21b_DownsidesFix() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={600}
      contentClassName="justify-center"
      background={
        <>
          <Spotlight className="-top-40 left-0 md:-top-20" fill="#FC5C02" />
          <Spotlight className="bottom-0 right-[10vw] md:bottom-[-20vh]" fill="#B6FF00" />
        </>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-6"
      >
        // ВЫВОД
      </motion.div>

      {/* Контраст: было → стало */}
      <div className="flex items-center gap-6 mb-9 max-w-3xl">
        {/* Боль */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex-1 rounded-2xl p-6"
          style={{ background: "rgba(252,92,2,0.06)", border: "1px solid rgba(252,92,2,0.22)" }}
        >
          <div className="text-[#FC5C02] font-mono text-[12px] uppercase tracking-[0.1em] mb-3">учиться не этому</div>
          <div className="text-white/70 text-lg md:text-xl leading-snug line-through decoration-[#FC5C02]/50">
            «Как написать промпт»
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.65 }}
          className="shrink-0"
        >
          <ArrowRight className="w-9 h-9" style={{ color: "#B6FF00" }} strokeWidth={2.5} />
        </motion.div>

        {/* Решение */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex-1 rounded-2xl p-6"
          style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.3)" }}
        >
          <div className="text-[#B6FF00] font-mono text-[12px] uppercase tracking-[0.1em] mb-3">а этому</div>
          <div className="text-white font-semibold text-lg md:text-xl leading-snug">
            Как спроектировать сервис, чтобы проблем не возникало
          </div>
        </motion.div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.0, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.05] tracking-[-0.03em] max-w-3xl"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(26px, 3vw, 44px)",
        }}
      >
        ВАЖНА <span className="text-[#B6FF00]">АРХИТЕКТУРА</span>,
        <br />А НЕ ПРОМПТЫ
      </motion.h1>
    </SlideLayout>
  );
}
