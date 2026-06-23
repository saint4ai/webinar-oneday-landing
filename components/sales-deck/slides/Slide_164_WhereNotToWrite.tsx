"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Ban, MessageCircle } from "lucide-react";

/** Слайд 164 · Куда НЕ писать. Выдача — только у менеджера в WhatsApp. */
const DONT = ["НЕ пишите слово в общий чат эфира", "НЕ пишите мне в директ Instagram"];

export function Slide_164_WhereNotToWrite() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="orange-pain" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#FC5C02] mb-3">
        // ВНИМАНИЕ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-5"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(40px, 5cqw, 80px)" }}
      >
        ВАЖНО
      </motion.h1>
      <div className="flex flex-col gap-2.5 max-w-2xl mb-4">
        {DONT.map((d, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.4 + i * 0.14 }} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(252,92,2,0.08)", border: "1px solid rgba(252,92,2,0.3)" }}>
            <Ban className="w-5 h-5 shrink-0 text-[#FC5C02]" strokeWidth={2.2} />
            <span className="text-white/85 text-sm md:text-lg">{d}</span>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.75 }} className="inline-flex items-center gap-3 rounded-xl px-4 py-3 self-start max-w-2xl" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}>
        <MessageCircle className="w-5 h-5 shrink-0 text-[#B6FF00]" strokeWidth={2} />
        <span className="text-[#B6FF00] font-semibold text-sm md:text-lg">Только менеджеру в WhatsApp — номер в чате эфира</span>
      </motion.div>
    </SlideLayout>
  );
}
