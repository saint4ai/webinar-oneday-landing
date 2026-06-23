"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/** Слайд 165 · Кодовое слово. Текст 1-в-1 STRUCTURE 2284-2286. */
const WORD = "ВАЙБ";

export function Slide_165_CodeWord() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // КОДОВОЕ СЛОВО · ЗАПОМИНАЙТЕ
      </motion.div>
      <div className="flex flex-wrap gap-x-8 gap-y-1">
        {WORD.split(" ").map((w, wi) => (
          <span key={wi} className="flex">
            {w.split("").map((ch, ci) => (
              <motion.span
                key={ci}
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.35, delay: 0.3 + (wi * 8 + ci) * 0.05, ease: [0.25, 1, 0.5, 1] }}
                className="font-bold uppercase leading-none"
                style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(40px, 5.6cqw, 110px)", color: "#B6FF00", textShadow: "0 0 60px rgba(182,255,0,0.35)" }}
              >
                {ch}
              </motion.span>
            ))}
          </span>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.4 }} className="text-white/60 text-sm md:text-lg mt-6">
        Сейчас в чат пришлют номер менеджера. Пишешь это слово ему в WhatsApp — и забираешь все три:
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.6 }} className="flex flex-col gap-1.5 mt-3 text-white/75 text-sm md:text-base">
        <span><span className="text-[#B6FF00] font-bold">→</span> приложение за 30 минут с Google AI Studio</span>
        <span><span className="text-[#B6FF00] font-bold">→</span> 30 маркетинговых промптов для продвижения</span>
        <span><span className="text-[#B6FF00] font-bold">→</span> чек-лист востребованных AI-сервисов</span>
      </motion.div>
    </SlideLayout>
  );
}
