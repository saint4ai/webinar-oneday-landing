"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Gift } from "lucide-react";

/**
 * Слайд 142 · OTO заголовок. Текст 1-в-1 STRUCTURE 1952-1958.
 * PLACEHOLDER: 4 подарочные коробки в Higgsfield (чёрный + лайм + оранж).
 */
export function Slide_142_OTOHeader() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#FC5C02] mb-4">
        // ТОЛЬКО ОДИН РАЗ · 24 ЧАСА
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[0.98] tracking-[-0.03em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 4.4vw, 76px)" }}
      >
        + 4 БОНУСА <span className="text-[#B6FF00]">ЗА ПОЛНУЮ ОПЛАТУ</span> ДО КОНЦА ДНЯ
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }} className="text-white/70 text-base md:text-lg leading-snug max-w-2xl mb-5">
        Только для тех, кто оплатит обучение <span className="text-white font-semibold">290 900 ₸</span> полностью в течение 24 часов после предоплаты.
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.7, ease: [0.34, 1.4, 0.64, 1] }} className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.span key={i} animate={{ y: [0, -6, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }} className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}>
              <Gift className="w-5 h-5 text-[#B6FF00]" strokeWidth={1.9} />
            </motion.span>
          ))}
        </div>
        <span className="rounded-xl px-4 py-2.5 font-bold text-[#B6FF00]" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)", fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(15px,1.5vw,22px)" }}>
          ценность 500 000 ₸+ сверху
        </span>
      </motion.div>
    </SlideLayout>
  );
}
