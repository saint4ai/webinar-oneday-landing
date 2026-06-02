"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { ArrowRight } from "lucide-react";

/**
 * Возражение «мне некуда применить AI» — слайд 1/2 (реврейм + аналогия Word/Excel 2000-х).
 * Текст Александра, спека: TASK_objection_nowhere_to_apply.md. Ставится после 149_QAHeader, перед 150.
 */
export function Slide_ObjApply1_Trend() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={780} background={<SlideBg theme="dark" variant="aura-tl" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // САМОЕ ЧАСТОЕ ВОЗРАЖЕНИЕ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.02] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3.2vw, 50px)" }}
      >
        «МНЕ НЕКУДА <span className="text-[#B6FF00]">ЭТО ПРИМЕНИТЬ»</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/70 text-sm md:text-lg leading-snug max-w-2xl mb-6">
        Чаще это значит другое: человек видит, что все осваивают — но боится начать.
      </motion.div>

      {/* Аналогия 2000-е → сегодня */}
      <div className="flex items-stretch gap-3 md:gap-4 flex-wrap mb-6">
        <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="flex-1 min-w-[230px] rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/45 mb-2">2000-е · база для найма</div>
          <div className="text-white font-bold text-lg md:text-2xl leading-tight" style={{ fontFamily: "var(--font-benzin), system-ui" }}>ПК · Word · Excel</div>
          <div className="text-white/50 text-sm mt-1.5">Без этого не брали никуда.</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.9 }} className="self-center">
          <ArrowRight className="w-8 h-8 text-[#FC5C02]" strokeWidth={2.4} />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 1.05 }} className="flex-1 min-w-[230px] rounded-2xl p-5" style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 50px -16px rgba(182,255,0,0.4)" }}>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#B6FF00]/70 mb-2">сегодня · та же база</div>
          <div className="text-[#B6FF00] font-bold text-lg md:text-2xl leading-tight" style={{ fontFamily: "var(--font-benzin), system-ui" }}>ВАЙБКОДИНГ · АГЕНТЫ</div>
          <div className="text-white/55 text-sm mt-1.5">Навык для всех, кто работает за компьютером.</div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.3 }} className="text-white/85 text-base md:text-lg leading-snug max-w-2xl">
        Это не «когда-нибудь». Это <span className="text-[#B6FF00] font-semibold">мышца — и качать её надо уже сейчас</span>.
      </motion.div>
    </SlideLayout>
  );
}
