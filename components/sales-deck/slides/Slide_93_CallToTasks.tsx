"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Mic, ArrowRight, ListChecks, Image as ImageIcon } from "lucide-react";

/**
 * Слайд 93 · Кейс 3 — расшифровка созвона. Текст 1-в-1 STRUCTURE 1139-1147.
 */
export function Slide_93_CallToTasks() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={740} background={<SlideBg theme="dark" variant="lime-right" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // КЕЙС 3 · СОЗВОНЫ
      </motion.div>
      <motion.h1 initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }} animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }} className="font-bold uppercase text-white leading-[1.02] tracking-[-0.02em] mb-2" style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3vw, 48px)" }}>
        ZOOM-СОЗВОН → <span className="text-[#B6FF00]">ЗАДАЧИ ЗА 2 МИНУТЫ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mb-7">
        TLDV (или бесплатная альтернатива Any2Text) пишет звонки, разбивает по ролям — кто что сказал, выписывает задачи.
      </motion.div>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.55 }} className="flex flex-col items-center gap-2 rounded-2xl px-6 py-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Mic className="w-7 h-7 text-white/55" strokeWidth={1.7} />
          <span className="text-white/50 text-xs">созвон</span>
        </motion.div>
        <ArrowRight className="w-7 h-7 text-[#B6FF00]" strokeWidth={2.5} />
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.8 }} className="flex flex-col items-center gap-2 rounded-2xl px-6 py-5" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 50px -16px rgba(182,255,0,0.5)" }}>
          <ListChecks className="w-7 h-7 text-[#B6FF00]" strokeWidth={1.7} />
          <span className="text-[#B6FF00] text-xs font-semibold">саммари + задачи</span>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.0 }} className="flex-1 min-w-[220px] text-white/60 text-sm md:text-base leading-snug">
          Список решений, список задач с ответственными. Никто ничего не забывает.
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.1 }} className="rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 max-w-2xl" style={{ borderColor: "rgba(182,255,0,0.3)", background: "rgba(182,255,0,0.02)", height: 130 }}>
        <ImageIcon className="w-7 h-7 text-white/30" strokeWidth={1.5} />
        <span className="text-white/45 text-xs font-mono uppercase tracking-[0.1em]">скрин TLDV — роли и timestamps</span>
        <span className="text-white/25 text-[10px]">Александр даст</span>
      </motion.div>
    </SlideLayout>
  );
}
