"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Блок C · Смысл 4 — эффективность. Закрывашка смыслов перед 130 (WithVsWithout).
 * НЕочевидное: рутина — не твоя работа, за неё отдельно не платят. AI закрывает 70%, остаётся важное.
 * Приём: один сплит-бар 70/30 (рутина AI / ты-результат). ⚠ 70% — оценка, подсветить.
 */
export function Slide_Smysl4_Efficiency() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={780} background={<SlideBg theme="dark" variant="aura-tl" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ЭФФЕКТИВНОСТЬ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.85, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.035em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(32px, 4.2vw, 66px)" }}
      >
        РУТИНА — ЭТО <span className="text-[#B6FF00]">НЕ ТВОЯ РАБОТА</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-base md:text-lg leading-snug max-w-2xl mb-7">
        Отчёты, КП, переписки, документы — за это отдельно никто не платит.
      </motion.div>

      {/* Сплит-бар 70/30 */}
      <div className="w-full max-w-3xl mb-7">
        <div className="relative w-full h-[72px] rounded-2xl overflow-hidden flex" style={{ background: "rgba(255,255,255,0.04)" }}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: "70%" }} transition={{ duration: 1.0, delay: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="h-full flex flex-col justify-center px-5 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.07)", borderRight: "2px solid #B6FF00" }}
          >
            <span className="font-bold text-white/55 whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(18px,2vw,30px)" }}>70% — рутина</span>
            <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.1em] text-white/35 whitespace-nowrap">AI закрывает это</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.5 }}
            className="h-full flex-1 flex flex-col justify-center px-5 overflow-hidden"
            style={{ background: "rgba(182,255,0,0.12)" }}
          >
            <span className="font-bold text-[#B6FF00] whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(18px,2vw,30px)" }}>30% — ты</span>
            <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.1em] text-[#B6FF00]/70 whitespace-nowrap">решения · результат</span>
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.7 }} className="text-white/85 text-base md:text-lg leading-snug max-w-2xl">
        Ты не «успеваешь больше». Ты делаешь <span className="text-[#B6FF00] font-semibold">только то, за что реально платят</span>.
      </motion.div>
    </SlideLayout>
  );
}
