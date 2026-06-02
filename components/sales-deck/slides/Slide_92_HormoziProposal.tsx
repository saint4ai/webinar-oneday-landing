"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Clock } from "lucide-react";

/**
 * Слайд 92 · Кейс 2 — КП по технике Hormozi. Текст 1-в-1 STRUCTURE 1127-1135.
 * Реальный скрин КП во всю ширину (public/handouts/screens/kp_omni.png).
 */
export function Slide_92_HormoziProposal() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={740} background={<SlideBg theme="dark" variant="aura-tr" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // КЕЙС 2 · КОММЕРЧЕСКОЕ
      </motion.div>
      <motion.h1 initial={{ opacity: 0, clipPath: "inset(-14% 100% 0 0)" }} animate={{ opacity: 1, clipPath: "inset(-14% 0% 0 0)" }} transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }} className="font-bold uppercase text-white leading-[1.04] tracking-[-0.03em] mb-2 pt-1" style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3.2vw, 48px)" }}>
        КОММЕРЧЕСКОЕ С <span className="text-[#B6FF00]">ВАУ-ЭФФЕКТОМ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug max-w-3xl mb-4">
        «Сделай КП по технике Хормози из 100M Offers» — агент нашёл саммари книги, применил структуру под клиента, оформил в твоём бренд-коде. За 15 минут.
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }} className="relative inline-block rounded-xl overflow-hidden mb-3" style={{ border: "1px solid rgba(182,255,0,0.25)", maxWidth: "100%" }}>
        <img src="/handouts/screens/kp_omni.png" alt="КП в бренд-коде" className="block" style={{ maxWidth: "100%", maxHeight: "46vh" }} />
        <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: "rgba(10,12,8,0.78)", border: "1px solid rgba(182,255,0,0.4)" }}>
          <Clock className="w-3 h-3 text-[#B6FF00]" strokeWidth={2.2} />
          <span className="text-[#B6FF00] text-[11px] font-bold font-mono">15 минут</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.0 }} className="text-white/60 text-sm md:text-base leading-snug max-w-3xl">
        Клиент видит — заморочился. Подсознательно <span className="text-[#B6FF00] font-semibold">«профессионал»</span> → конверсия в продажу выше.
      </motion.div>
    </SlideLayout>
  );
}
