"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 97 · 5 принципов работы с агентом. Текст 1-в-1 STRUCTURE 1187-1197.
 */
const RULES = [
  "CLAUDE.md заполни один раз — это инвестиция, окупается за день.",
  "Один проект — одна папка. Никогда не мешай.",
  "Цифры и юридические формулировки — глазами проверяй. Всегда.",
  "Повторяешь третий раз одну команду — оформи как команду.",
  "Сначала Opus план — потом Sonnet выполнение. Так экономишь токены.",
];

export function Slide_97_AgentRules() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ЧТОБЫ НЕ ТУПИТЬ
      </motion.div>
      <motion.h1 initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }} animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }} className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-7" style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.6vw, 54px)" }}>
        ПРАВИЛА РАБОТЫ <span className="text-[#B6FF00]">С АГЕНТОМ</span>
      </motion.h1>

      <div className="flex flex-col gap-2.5 max-w-3xl mb-6">
        {RULES.map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.4 + i * 0.14, ease: [0.25, 1, 0.5, 1] }} className="flex items-center gap-3.5">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold" style={{ background: "rgba(182,255,0,0.14)", border: "1px solid rgba(182,255,0,0.35)", color: "#B6FF00", fontFamily: "var(--font-benzin), system-ui", fontSize: 16 }}>{i + 1}</span>
            <span className="text-white/85 text-sm md:text-lg leading-snug">{r}</span>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.3 }} className="inline-flex items-center rounded-xl px-4 py-2.5" style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.3)" }}>
        <span className="text-white/85 text-sm md:text-base leading-snug">5 минут на эти принципы — <span className="text-[#B6FF00] font-semibold">годы без головной боли</span>.</span>
      </motion.div>
    </SlideLayout>
  );
}
