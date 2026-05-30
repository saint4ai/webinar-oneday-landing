"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { BrandLogo } from "../BrandLogo";

/**
 * Слайд 95 · Лайфхак — Perplexity + Claude. Текст 1-в-1 STRUCTURE 1163-1171.
 */
export function Slide_95_PerplexityClaude() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={740} background={<SlideBg theme="dark" variant="aura-tl" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ЛАЙФХАК · СВЯЗКА
      </motion.div>
      <motion.h1 initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }} animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }} className="font-bold uppercase text-white leading-[1.02] tracking-[-0.02em] mb-2" style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3vw, 48px)" }}>
        PERPLEXITY ИЩЕТ — <span className="text-[#B6FF00]">CLAUDE ПРИМЕНЯЕТ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mb-7">
        Связка для нестандартных задач. «Напиши промпт для Perplexity, чтобы найти лучшие мировые практики» → лучшие практики → возвращаешь в Claude → он адаптирует под твой контекст и рынок.
      </motion.div>

      {/* Flow Claude → Perplexity → Claude */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {[
          { logo: "claude", t: "Claude", d: "пишет промпт", lime: true },
          { logo: "perplexity", t: "Perplexity", d: "ищет практики", lime: false },
          { logo: "claude", t: "Claude", d: "адаптирует", lime: true },
        ].map((n, i) => {
          return (
            <div key={i} className="flex items-center gap-3">
              <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, delay: 0.55 + i * 0.2 }} className="flex flex-col items-center gap-1.5 rounded-xl px-5 py-4" style={{ background: n.lime ? "rgba(182,255,0,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${n.lime ? "rgba(182,255,0,0.35)" : "rgba(255,255,255,0.1)"}` }}>
                <BrandLogo name={n.logo} alt={n.t} className="w-6 h-6" />
                <span className={`text-sm font-semibold ${n.lime ? "text-[#B6FF00]" : "text-white/70"}`}>{n.t}</span>
                <span className="text-white/40 text-[11px]">{n.d}</span>
              </motion.div>
              {i < 2 && <ArrowRight className="w-6 h-6 text-[#B6FF00] shrink-0" strokeWidth={2.5} />}
            </div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.2 }} className="rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 max-w-2xl" style={{ borderColor: "rgba(182,255,0,0.3)", background: "rgba(182,255,0,0.02)", height: 120 }}>
        <ImageIcon className="w-7 h-7 text-white/30" strokeWidth={1.5} />
        <span className="text-white/45 text-xs font-mono uppercase tracking-[0.1em]">скрин Perplexity Deep Research</span>
        <span className="text-white/25 text-[10px]">Александр даст</span>
      </motion.div>
    </SlideLayout>
  );
}
