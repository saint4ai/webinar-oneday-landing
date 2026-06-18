"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 93 · Кейс 3 — расшифровка созвона (TLDV). Текст 1-в-1 STRUCTURE 1139-1147.
 * Реальный скрин TLDV во всю ширину (public/handouts/screens/tldv.png).
 */
export function Slide_93_CallToTasks() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={740} background={<SlideBg theme="dark" variant="lime-right" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // КЕЙС 3 · СОЗВОНЫ
      </motion.div>
      <motion.h1 initial={{ opacity: 0, clipPath: "inset(-14% 100% 0 0)" }} animate={{ opacity: 1, clipPath: "inset(-14% 0% 0 0)" }} transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }} className="font-bold uppercase text-white leading-[1.06] tracking-[-0.02em] mb-2 pt-1" style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 2.9vw, 46px)" }}>
        ZOOM-СОЗВОН → <span className="text-[#B6FF00]">ЗАДАЧИ ЗА 2 МИНУТЫ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug max-w-3xl mb-4">
        TLDV (или бесплатная альтернатива Any2Text) пишет звонок, разбивает по ролям — кто что сказал — и выписывает задачи.
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }} className="relative self-start rounded-xl overflow-hidden mb-3" style={{ border: "1px solid rgba(182,255,0,0.25)", width: "fit-content", maxWidth: "100%" }}>
        <img src="/handouts/screens/tldv.png" alt="TLDV — роли и задачи" className="block" style={{ maxWidth: "100%", maxHeight: "46vh" }} />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.0 }} className="text-white/60 text-sm md:text-base leading-snug max-w-3xl">
        Список решений, список задач <span className="text-[#B6FF00] font-semibold">с ответственными</span>. Никто ничего не забывает.
      </motion.div>
    </SlideLayout>
  );
}
