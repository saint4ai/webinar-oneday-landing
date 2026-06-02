"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Check } from "lucide-react";

/** Слайд 147 · Итог OTO — за 24 часа. Текст 1-в-1 STRUCTURE 2042-2058. DL-7. */
const OTO = [
  { t: "Обучение «AI-менеджеры в отделы продаж»", p: "390 000" },
  { t: "Договор для внедрения IT-решений", p: "80 000" },
  { t: "Договор для внедрения AI-менеджеров", p: "80 000" },
  { t: "Эксперт: публикация в App Store / Google Play", p: "50 000" },
];

export function Slide_147_OTOSummary() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ПАКЕТ ТОЛЬКО НА 24 ЧАСА
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 3vw, 46px)" }}
      >
        ПАКЕТ «ТОЛЬКО СЕЙЧАС» — <span className="text-[#B6FF00]">ЕЩЁ <span className="whitespace-nowrap">+600 000 ₸</span></span>
      </motion.h1>

      <div className="flex flex-col max-w-3xl mb-3">
        {OTO.map((it, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.4 + i * 0.13 }} className="flex items-center justify-between gap-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <Check className="w-4 h-4 shrink-0 text-[#B6FF00]" strokeWidth={2.8} />
              <span className="text-white font-medium text-sm md:text-base">{it.t}</span>
            </div>
            <span className="font-bold tabular-nums shrink-0 text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(15px,1.4vw,20px)" }}>{it.p} ₸</span>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 1.0 }} className="flex items-center gap-4 flex-wrap max-w-3xl rounded-xl px-5 py-3.5" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}>
        <span className="text-white/70 text-sm md:text-base">Всего ценности (обучение + бонусы): <span className="line-through text-white/40">1 569 000 ₸</span> →</span>
        <span className="font-bold uppercase text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(20px,2.2vw,34px)" }}>290 900 ₸ · выгода ×5.4</span>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.3 }} className="text-white/45 text-xs md:text-sm mt-2">
        Оплатишь после 24 часов — войдёшь в обучение, но без этого пакета.
      </motion.div>
    </SlideLayout>
  );
}
