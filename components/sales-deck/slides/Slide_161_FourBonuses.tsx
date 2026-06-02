"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { FileText, Library, ListChecks, Camera } from "lucide-react";

/** Слайд 161 · Список 4 бонусов. Текст 1-в-1 STRUCTURE 2238-2241. */
const BONUSES = [
  { icon: FileText, t: "Гайд: Android-приложение через Google AI Studio", p: "50 000 ₸" },
  { icon: Library, t: "Библиотека 30 промптов для Claude Code", p: "15 000 ₸" },
  { icon: ListChecks, t: "Чек-лист: 9 типов AI-сервисов, которые покупают сейчас", p: "15 000 ₸" },
  { icon: Camera, t: "ИИ-креаторство: мультики и сериалы — за отметку @saint4ai", p: "15 000 ₸" },
];

export function Slide_161_FourBonuses() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={780} background={<SlideBg theme="dark" variant="climax" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ПОДАРКИ ЗА УЧАСТИЕ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-6"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(32px, 4.2vw, 64px)" }}
      >
        ТВОИ ЧЕТЫРЕ <span className="text-[#B6FF00]">БОНУСА</span>
      </motion.h1>
      <div className="grid grid-cols-2 gap-3.5 max-w-3xl">
        {BONUSES.map((b, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 + i * 0.13 }} className="flex items-start gap-3 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.3)" }}>
              <b.icon className="w-5 h-5 text-[#B6FF00]" strokeWidth={1.9} />
            </span>
            <div className="flex flex-col justify-center min-h-[40px]">
              <span className="text-white/85 text-sm md:text-base leading-snug">{b.t}</span>
              <span className="text-white/40 text-[13px] line-through tabular-nums mt-1" style={{ fontFamily: "var(--font-benzin), system-ui" }}>{b.p}</span>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.1 }} className="flex items-center gap-3 flex-wrap mt-5 rounded-xl px-5 py-3 max-w-3xl self-start" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}>
        <span className="text-white/70 text-sm md:text-base">Всего ценности: <span className="line-through text-white/40">95 000 ₸</span> →</span>
        <span className="font-bold uppercase text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(18px,1.8vw,26px)" }}>бесплатно за участие</span>
      </motion.div>
    </SlideLayout>
  );
}
