"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 95 · Лайфхак — Perplexity + Claude. Текст 1-в-1 STRUCTURE 1163-1171.
 * Реальный скрин Perplexity во всю ширину (public/handouts/screens/perplexity_screen.png, ≈квадрат).
 */
export function Slide_95_PerplexityClaude() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={740} background={<SlideBg theme="dark" variant="aura-tl" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ЛАЙФХАК · СВЯЗКА
      </motion.div>
      <motion.h1 initial={{ opacity: 0, clipPath: "inset(-14% 100% 0 0)" }} animate={{ opacity: 1, clipPath: "inset(-14% 0% 0 0)" }} transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }} className="font-bold uppercase text-white leading-[1.06] tracking-[-0.02em] mb-2 pt-1" style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 2.9vw, 46px)" }}>
        PERPLEXITY ИЩЕТ — <span className="text-[#B6FF00]">CLAUDE ПРИМЕНЯЕТ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug max-w-3xl mb-3">
        «Напиши промпт для Perplexity, чтобы найти лучшие мировые практики» → результат возвращаешь в Claude → он адаптирует под твой контекст и рынок.
      </motion.div>

      <div className="flex items-start gap-5 flex-wrap">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }} className="relative inline-block rounded-xl overflow-hidden" style={{ border: "1px solid rgba(182,255,0,0.25)", maxWidth: "100%" }}>
          <img src="/handouts/screens/perplexity_screen.png" alt="Perplexity Deep Research" className="block" style={{ maxWidth: "100%", maxHeight: "50vh" }} />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.9 }} className="flex-1 min-w-[220px] flex flex-col gap-2 pt-2">
          {[
            { t: "Claude", d: "пишет промпт" },
            { t: "Perplexity", d: "ищет практики" },
            { t: "Claude", d: "адаптирует под рынок" },
          ].map((n, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-lg px-3 py-2" style={{ background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.2)" }}>
              <span className="font-mono text-[10px] text-[#B6FF00] font-bold w-4">{i + 1}</span>
              <span className="text-white font-semibold text-sm">{n.t}</span>
              <span className="text-white/60 text-[13px]">— {n.d}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </SlideLayout>
  );
}
