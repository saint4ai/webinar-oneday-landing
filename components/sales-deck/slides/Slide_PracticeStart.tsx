"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Play } from "lucide-react";

/**
 * Слайд-переход «Приступаем к практике» — после S74_FiveSteps (объяснили Google AI Studio, что собираем, 5 шагов).
 * Сигнал «хватит теории — теперь руками». Дальше идёт живая сборка → S75_AppDone (результат).
 */
export function Slide_PracticeStart() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="lime-right" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // ХВАТИТ ТЕОРИИ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-5"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(34px, 4.6vw, 76px)" }}
      >
        ПРИСТУПАЕМ К <span className="text-[#B6FF00]">ПРАКТИКЕ</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/75 text-base md:text-xl leading-snug max-w-2xl mb-8">
        Дальше — руками. Прямо сейчас собираем <span className="text-[#B6FF00] font-semibold">твоё первое приложение</span> с нуля. Повторяй за мной.
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.7, ease: [0.34, 1.4, 0.64, 1] }}
        className="inline-flex items-center gap-3 rounded-2xl px-6 py-4 self-start"
        style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.45)", boxShadow: "0 0 60px -20px rgba(182,255,0,0.6)" }}
      >
        <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#B6FF00", boxShadow: "0 0 30px -4px rgba(182,255,0,0.7)" }}>
          <Play className="w-5 h-5 text-black" strokeWidth={2.4} fill="currentColor" />
        </span>
        <span className="text-white font-semibold text-base md:text-lg">Открывай ноутбук — поехали</span>
      </motion.div>
    </SlideLayout>
  );
}
