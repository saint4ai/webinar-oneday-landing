"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Smartphone, ArrowRight, Laptop } from "lucide-react";

/**
 * Слайд 81 · Переход после практики Android. Текст 1-в-1 STRUCTURE 987-997.
 */
export function Slide_81_RoutineTransition() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={740}
      background={<SlideBg theme="dark" variant="aura-tr" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ЧАСТЬ VIII · АВТОМАТИЗАЦИЯ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.02em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.4cqw, 52px)" }}
      >
        ТЫ ТОЛЬКО ЧТО <span className="text-[#B6FF00]">СОБРАЛ ПРИЛОЖЕНИЕ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/65 text-base md:text-lg leading-snug max-w-2xl mb-7"
      >
        Но это лишь капля в море того, что может вайбкодинг. Это не только про сервисы — это про то, чтобы <span className="text-white font-semibold">ускорить твою собственную работу в 3-4 раза</span>.
      </motion.div>

      {/* Поток: телефон → ноут */}
      <div className="flex items-center gap-5 mb-7">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="flex flex-col items-center gap-2 rounded-2xl px-6 py-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Smartphone className="w-8 h-8 text-white/55" strokeWidth={1.6} />
          <span className="text-white/55 text-xs">приложение</span>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.85 }}><ArrowRight className="w-7 h-7 text-[#B6FF00]" strokeWidth={2.5} /></motion.div>
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 1.0 }} className="flex flex-col items-center gap-2 rounded-2xl px-6 py-5" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 50px -14px rgba(182,255,0,0.5)" }}>
          <Laptop className="w-8 h-8 text-[#B6FF00]" strokeWidth={1.6} />
          <span className="text-[#B6FF00] text-xs font-semibold">Claude Code</span>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.3 }}
        className="text-white/70 text-base md:text-lg leading-snug max-w-2xl"
      >
        То, на что у тебя уходит <span className="font-semibold" style={{ color: "#FC5C02" }}>день</span> — Claude Code сделает за <span className="text-[#B6FF00] font-semibold">15 минут</span>. Сейчас покажу как.
      </motion.div>
    </SlideLayout>
  );
}
