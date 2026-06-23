"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Check, TrendingUp } from "lucide-react";

/**
 * Слайд 98 · Переход к следующему блоку. Текст 1-в-1 STRUCTURE 1201-1210.
 * Лестница: личная рутина (✓) → сервисы для бизнеса (лайм, чек 600К-10М ₸).
 */
export function Slide_98_LadderTransition() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ПЕРЕХОД
      </motion.div>
      <motion.h1 initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }} animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }} className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2" style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 3.8cqw, 56px)" }}>
        ЭТО ТОЛЬКО <span style={{ color: "#FC5C02" }}>ЛИЧНЫЕ ДЕЛА</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-base md:text-lg leading-snug max-w-2xl mb-8">
        Дальше — как из этого получается доход.
      </motion.div>

      {/* Лестница 2 ступени */}
      <div className="flex items-end gap-4 max-w-4xl mb-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="flex-[0.82] rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: "#B6FF00" }}><Check className="w-3.5 h-3.5 text-black" strokeWidth={3} /></span>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/50">ступень 1</span>
          </div>
          <div className="text-white font-bold text-base md:text-lg leading-tight">Личная рутина</div>
          <div className="text-white/45 text-sm mt-1">12-15 часов экономии в неделю</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.95 }} className="shrink-0 pb-8">
          <TrendingUp className="w-7 h-7 text-[#B6FF00]" strokeWidth={2.5} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.1 }} className="flex-[1.25] rounded-2xl px-6 py-5 relative self-stretch flex flex-col justify-end" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 60px -14px rgba(182,255,0,0.5)", marginBottom: 36 }}>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#B6FF00] mb-2">ступень 2 · горит</span>
          <div className="font-bold text-base md:text-xl leading-tight text-white">Сервисы для бизнеса</div>
          <div className="font-bold leading-none mt-2 whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(17px,1.6cqw,25px)", color: "#B6FF00" }}>600 000 — 10 000 000 ₸</div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.5 }} className="text-white/55 text-sm md:text-base leading-snug max-w-3xl mt-3">
        Когда освоил вайбкодинг для себя — прыгаешь на 5 ступеней вверх перед теми, кто его не изучает. Дальше расскажу, как это работает.
      </motion.div>
    </SlideLayout>
  );
}
