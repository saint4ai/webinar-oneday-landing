"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Mic, ArrowRight, Zap, Lock, Gift } from "lucide-react";

/**
 * Слайд 85 · OpenWhisper — голос вместо клавиатуры. Текст 1-в-1 STRUCTURE 1040-1048.
 */
const PERKS = [
  { icon: Zap, t: "в 3 раза быстрее" },
  { icon: Lock, t: "локально — не в облако" },
  { icon: Gift, t: "бесплатно" },
];

export function Slide_85_OpenWhisper() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={740}
      background={<SlideBg theme="dark" variant="aura-tr" />}
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ГОЛОС ВМЕСТО КЛАВИАТУРЫ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(32px, 4vw, 64px)" }}
      >
        + <span className="text-[#B6FF00]">OPENWHISPER</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-base md:text-lg leading-snug max-w-2xl mb-7">
        Бесплатное приложение, превращает голос в текст для агента. Зажал кнопку — наговорил — текст сам в чате Claude Code.
      </motion.div>

      {/* Голос → текст */}
      <div className="flex items-center gap-5 mb-7">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="flex flex-col items-center gap-2 rounded-2xl px-6 py-5" style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.35)" }}>
          <Mic className="w-7 h-7 text-[#B6FF00]" strokeWidth={1.8} />
          <div className="flex items-end gap-0.5 h-5">
            {[40, 80, 55, 100, 65, 85, 45].map((h, i) => (
              <motion.span key={i} animate={{ height: [`${h * 0.4}%`, `${h}%`, `${h * 0.4}%`] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }} className="w-1 rounded-full" style={{ background: "#B6FF00" }} />
            ))}
          </div>
        </motion.div>
        <ArrowRight className="w-7 h-7 text-[#B6FF00]" strokeWidth={2.5} />
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.9 }} className="rounded-xl px-4 py-3 flex flex-col gap-1.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", width: 220 }}>
          {[90, 70, 55].map((w, i) => (
            <motion.div key={i} initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ duration: 0.5, delay: 1.1 + i * 0.2 }} className="h-2 rounded-full" style={{ background: i === 0 ? "rgba(182,255,0,0.6)" : "rgba(255,255,255,0.2)" }} />
          ))}
        </motion.div>
      </div>

      <div className="flex flex-wrap gap-3">
        {PERKS.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.div key={p.t} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 1.4 + i * 0.12 }} className="flex items-center gap-2 rounded-lg px-3.5 py-2" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.22)" }}>
              <Icon className="w-4 h-4 text-[#B6FF00] shrink-0" strokeWidth={1.9} />
              <span className="text-white/85 text-sm font-medium">{p.t}</span>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}
