"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Coffee } from "lucide-react";

/**
 * Слайд 138 · Цена в пересчёте — 399 ₸ в день (рассрочка 24 мес). Текст 1-в-1 STRUCTURE 1886-1898.
 * PLACEHOLDER: логотипы Kaspi Bank / Home Credit Bank / Halyk Bank (добавим).
 */
const CASCADE = [
  { v: "290 900 ₸", l: "полная цена" },
  { v: "24 242 ₸/мес", l: "рассрочка 12 мес" },
  { v: "12 121 ₸/мес", l: "рассрочка 24 мес" },
];

export function Slide_138_PerDay() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // ЦЕНА В ПЕРЕСЧЁТЕ
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.9, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 1, 0.5, 1] }} className="flex items-center gap-5 mb-5 flex-wrap">
        <div className="font-bold leading-[0.9] tabular-nums whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(56px, 8cqw, 150px)", color: "#B6FF00", textShadow: "0 0 80px rgba(182,255,0,0.4)" }}>
          399 ₸
        </div>
        <div>
          <Coffee className="w-9 h-9 text-white/60 mb-1" strokeWidth={1.6} />
          <div className="text-white/70 text-sm md:text-lg leading-tight">в день — <span className="text-white">дешевле чашки кофе</span></div>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-2.5 max-w-3xl mb-4">
        {CASCADE.map((c, i) => (
          <motion.div key={c.l} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.5 + i * 0.13 }} className="rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="font-bold text-white tabular-nums" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(16px,1.5cqw,22px)" }}>{c.v}</div>
            <div className="text-white/45 text-xs mt-0.5">{c.l}</div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.0 }} className="text-white/70 text-sm md:text-base max-w-2xl mb-3">
        За год на такси и кофе уходит больше, чем стоит всё обучение. <span className="text-white">За навык, который приносит сотни тысяч ₸ в месяц.</span>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.2 }} className="flex items-center gap-2 text-white/50 text-xs md:text-sm">
        Беспроцентная рассрочка: <span className="text-white/75 font-medium">Kaspi · Home Credit · Halyk</span>
        <span className="text-white/30 text-[10px]">(лого — добавим)</span>
      </motion.div>
    </SlideLayout>
  );
}
