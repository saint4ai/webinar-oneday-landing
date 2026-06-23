"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/** Слайд 131 · Спец-цена для участников эфира. Текст 1-в-1 STRUCTURE 1725-1731. DL-7 pricing. */
export function Slide_131_SpecialPrice() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // СПЕЦИАЛЬНО ДЛЯ ТЕХ, КТО НА ЭФИРЕ
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex items-baseline gap-3 mb-3">
        <span className="text-white/40 line-through tabular-nums" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(24px,2.6cqw,42px)" }}>390 000 ₸</span>
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-white/45">для остальных — завтра</span>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 1, 0.5, 1] }} className="flex items-end gap-5 mb-4 flex-wrap">
        <div className="font-bold leading-[0.9] tabular-nums whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(44px, 6cqw, 112px)", color: "#B6FF00", textShadow: "0 0 80px rgba(182,255,0,0.45)" }}>
          290 900 ₸
        </div>
        <div className="rounded-xl px-4 py-2.5 mb-3" style={{ background: "rgba(252,92,2,0.12)", border: "1px solid rgba(252,92,2,0.4)" }}>
          <span className="font-bold text-[#FC5C02] uppercase tracking-[0.04em]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(13px,1.2cqw,18px)" }}>только сейчас</span>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }} className="text-white/65 text-sm md:text-lg max-w-2xl">
        Эта цена — только для тех, кто прямо сейчас на эфире. Завтра — обычные <span className="text-white font-semibold">390 000 ₸</span> для всех. Экономия почти <span className="text-[#B6FF00] font-semibold">100 000 ₸</span>.
      </motion.div>
    </SlideLayout>
  );
}
