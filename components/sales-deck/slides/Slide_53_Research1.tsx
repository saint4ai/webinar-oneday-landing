"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Repeat, Clock, Coins, ChevronRight } from "lucide-react";

/**
 * Слайд 53 · Research 1/5 — «КАК ПОНЯТЬ ЧТО СОБИРАТЬ». Текст 1-в-1 STRUCTURE 633-644.
 * СВЕТЛЫЙ слайд (light fintech_aura): тёплый фон + ink-текст + оранж-акцент.
 * Визуал: 3 признака боли — рутина → время → деньги (каскад).
 */
const INK = "#2A2520";
const INK_MUTED = "#6E6354";
const ORANGE = "#FC5C02";

const SIGNS = [
  { icon: Repeat, label: "рутина", sub: "делают вручную" },
  { icon: Clock, label: "время", sub: "тратят часы" },
  { icon: Coins, label: "деньги", sub: "теряют выручку" },
];

export function Slide_53_Research1() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={700}
      style={{ background: "var(--brand-cream)" }}
      background={<SlideBg theme="light" variant="light-warm" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold mb-4"
        style={{ color: ORANGE }}
      >
        // RESEARCH · 1 / 5
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase leading-[1.0] tracking-[-0.03em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 3.8vw, 58px)", color: INK }}
      >
        КАК ПОНЯТЬ <span style={{ color: ORANGE }}>ЧТО СОБИРАТЬ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-base md:text-lg leading-snug max-w-2xl mb-8"
        style={{ color: INK_MUTED }}
      >
        9 из 10 SaaS закрываются, потому что собрали без боли. Учимся искать боль{" "}
        <span style={{ background: "#B6FF00", color: INK, padding: "0.02em 0.3em", borderRadius: "0.2em", fontWeight: 700 }}>ДО</span> того, как сесть за код.
      </motion.div>

      {/* 3 признака боли */}
      <div className="flex items-center gap-4 md:gap-5 mb-8">
        {SIGNS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-4 md:gap-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.7, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                className="flex flex-col items-center gap-2.5 rounded-2xl px-6 py-5"
                style={{ background: "var(--brand-cream-card, #FBF6EC)", border: "1px solid rgba(42,37,32,0.12)", boxShadow: "0 18px 40px -24px rgba(42,37,32,0.4)" }}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "rgba(252,92,2,0.10)" }}>
                  <Icon className="w-7 h-7" strokeWidth={1.8} style={{ color: ORANGE }} />
                </div>
                <span className="font-bold text-lg md:text-xl uppercase leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", color: INK }}>{s.label}</span>
                <span className="text-xs md:text-sm" style={{ color: INK_MUTED }}>{s.sub}</span>
              </motion.div>
              {i < SIGNS.length - 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.85 + i * 0.3 }}>
                  <ChevronRight className="w-7 h-7" strokeWidth={2.5} style={{ color: "rgba(42,37,32,0.4)" }} />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Правило */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.6 }}
        className="text-base md:text-lg leading-relaxed max-w-3xl"
        style={{ color: INK }}
      >
        Продукт не из головы, а из реальной боли. Технология вторична:{" "}
        <span style={{ color: ORANGE, fontWeight: 700 }}>нашёл боль — собрал за 1-2 недели</span>. Не нашёл — даже идеальное приложение никто не купит.
      </motion.div>
    </SlideLayout>
  );
}
