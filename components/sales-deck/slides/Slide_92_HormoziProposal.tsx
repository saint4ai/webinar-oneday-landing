"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { FileText, Clock, Image as ImageIcon } from "lucide-react";

/**
 * Слайд 92 · Кейс 2 — КП по технике Hormozi. Текст 1-в-1 STRUCTURE 1127-1135.
 */
export function Slide_92_HormoziProposal() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={740} background={<SlideBg theme="dark" variant="aura-tr" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // КЕЙС 2 · КОММЕРЧЕСКОЕ
      </motion.div>
      <motion.h1 initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }} animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }} className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2" style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.4vw, 52px)" }}>
        КОММЕРЧЕСКОЕ С <span className="text-[#B6FF00]">ВАУ-ЭФФЕКТОМ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mb-6">
        За 15 минут — а клиент думает, что ты сутки заморачивался. «Сделай КП по технике Алекса Хормози из 100M Offers» — агент сам нашёл саммари книги, применил структуру под клиента, оформил в твоём бренд-коде.
      </motion.div>

      <div className="flex items-stretch gap-4 flex-wrap">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.6 }} className="relative rounded-xl border border-dashed flex flex-col items-center justify-center gap-2" style={{ width: 300, height: 190, borderColor: "rgba(182,255,0,0.3)", background: "rgba(182,255,0,0.02)" }}>
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: "rgba(182,255,0,0.14)" }}>
            <Clock className="w-3 h-3 text-[#B6FF00]" strokeWidth={2.2} />
            <span className="text-[#B6FF00] text-[11px] font-bold font-mono">15 минут</span>
          </div>
          <FileText className="w-8 h-8 text-white/30" strokeWidth={1.5} />
          <span className="text-white/45 text-xs font-mono uppercase tracking-[0.1em]">скрин КП в бренд-коде</span>
          <span className="text-white/25 text-[10px]">Александр даст</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.85 }} className="flex-1 min-w-[260px] flex items-center">
          <div className="text-white/70 text-base md:text-lg leading-snug">
            Клиент видит — заморочился. Подсознательно: <span className="text-[#B6FF00] font-semibold">«этот человек профессионал»</span>. Конверсия в продажу выше.
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
