"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Check } from "lucide-react";

/**
 * Слайд 87 · Сколько это стоит. Текст 1-в-1 STRUCTURE 1063-1072.
 */
const PLANS = [
  { name: "Pro", price: "$20", per: "/мес", d: "хватает для всей офисной рутины", start: true },
  { name: "Max", price: "$100", per: "/мес", d: "если живёшь в Claude Code" },
  { name: "Max", price: "$200", per: "/мес", d: "я лично сижу на этом плане", me: true },
];

export function Slide_87_Pricing() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={740}
      background={<SlideBg theme="dark" variant="aura-tr" />}
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // СКОЛЬКО СТОИТ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 3.8cqw, 58px)" }}
      >
        <span className="text-[#B6FF00]">20 ДОЛЛАРОВ</span> В МЕСЯЦ
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-base md:text-lg leading-snug mb-8">
        Подписка Claude — стартовый план Pro.
      </motion.div>

      <div className="grid grid-cols-3 gap-4 max-w-4xl mb-6">
        {PLANS.map((p, i) => (
          <motion.div
            key={p.name + p.price}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 + i * 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="relative rounded-2xl p-5"
            style={{ background: p.start ? "rgba(182,255,0,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${p.start ? "rgba(182,255,0,0.4)" : "rgba(255,255,255,0.1)"}`, boxShadow: p.start ? "0 0 50px -16px rgba(182,255,0,0.5)" : "none" }}
          >
            <div className="text-white/50 font-mono text-xs uppercase tracking-[0.14em] mb-2">{p.name}{p.me && " · я"}</div>
            <div className="flex items-baseline gap-1 mb-3">
              <span className="font-bold leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(30px,3.2cqw,48px)", color: p.start ? "#B6FF00" : "#FFFFFF" }}>{p.price}</span>
              <span className="text-white/40 text-sm">{p.per}</span>
            </div>
            <div className="text-white/55 text-xs md:text-sm leading-snug mb-2">{p.d}</div>
            {p.start && (
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded" style={{ background: "rgba(182,255,0,0.16)", color: "#B6FF00" }}>
                <Check className="w-3 h-3" strokeWidth={3} /> начни с этого
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.1 }} className="inline-flex items-center rounded-xl px-4 py-2.5" style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.3)" }}>
        <span className="text-white/85 text-sm md:text-base leading-snug">
          $20 <span className="text-[#B6FF00] font-semibold">окупаются на 3-й день</span>, когда поймёшь, сколько часов экономишь.
        </span>
      </motion.div>
    </SlideLayout>
  );
}
