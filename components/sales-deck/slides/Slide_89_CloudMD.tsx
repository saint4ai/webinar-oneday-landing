"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 89 · Главный файл — CLAUDE.md. Текст 1-в-1 STRUCTURE 1087-1095.
 * СВЕТЛЫЙ слайд: кремовая бумага + markdown-файл памяти агента.
 */
const INK = "#2A2520";
const INK_MUTED = "#6E6354";
const ORANGE = "#FC5C02";

const LINES: { md?: string; h?: string; hl?: boolean }[] = [
  { h: "# Кто я" },
  { md: "Александр · онлайн-школа onAI · вайб-кодер" },
  { h: "# Мой стиль" },
  { md: "коротко, по делу, без воды" },
  { h: "# Правила" },
  { md: "цифры всегда подсвечивай на проверку" },
  { h: "# Тон" },
  { md: "как с другом, не как пресс-релиз", hl: true },
];

export function Slide_89_CloudMD() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={740}
      style={{ background: "var(--brand-cream)" }}
      background={<SlideBg theme="light" variant="light-warm" />}
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold mb-3" style={{ color: ORANGE }}>
        // ГЛАВНЫЙ ФАЙЛ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase leading-[1.04] tracking-[-0.02em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3cqw, 46px)", color: INK }}
      >
        CLAUDE.md — <span style={{ color: ORANGE }}>ПАМЯТЬ И МОЗГ АГЕНТА</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-base md:text-lg leading-snug mb-6" style={{ color: INK_MUTED }}>
        Рассказал один раз — помнит навсегда.
      </motion.div>

      <div className="flex items-start gap-6 flex-wrap">
        {/* Cream-файл CLAUDE.md */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="rounded-2xl overflow-hidden shrink-0"
          style={{ width: 420, background: "var(--brand-cream-card, #FBF6EC)", border: "1px solid rgba(42,37,32,0.12)", boxShadow: "0 36px 80px -32px rgba(42,37,32,0.45)" }}
        >
          <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ background: "#ECE2D0", borderBottom: "1px solid rgba(42,37,32,0.1)" }}>
            <span className="w-3 h-3 rounded-full" style={{ background: ORANGE }} />
            <span className="w-3 h-3 rounded-full" style={{ background: "#E8B500" }} />
            <span className="w-3 h-3 rounded-full" style={{ background: "#3FB950" }} />
            <span className="ml-2 font-mono text-[12px] font-medium" style={{ color: "#8A7E6B" }}>CLAUDE.md</span>
          </div>
          <div className="px-5 py-4 font-mono" style={{ fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace", fontSize: "clamp(12px,1cqw,14px)", lineHeight: 1.7 }}>
            {LINES.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.8 + i * 0.13 }}>
                {l.h ? (
                  <span style={{ color: ORANGE, fontWeight: 700 }}>{l.h}</span>
                ) : l.hl ? (
                  <span style={{ background: "#B6FF00", color: INK, padding: "0.04em 0.3em", borderRadius: "0.2em", fontWeight: 600 }}>{l.md}</span>
                ) : (
                  <span style={{ color: INK }}>{l.md}</span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Эффект */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 1.0 }} className="flex-1 min-w-[260px] flex flex-col gap-4 pt-2">
          <div className="text-lg md:text-xl leading-snug" style={{ color: INK }}>
            Сделал один раз — каждый следующий запрос <span style={{ color: ORANGE, fontWeight: 700 }}>в 3 раза точнее</span>.
          </div>
          <div className="rounded-xl px-4 py-3" style={{ background: "#FBF6EC", border: "1px solid rgba(42,37,32,0.12)" }}>
            <span className="text-sm md:text-base" style={{ color: INK_MUTED }}>Сказал «не люблю много воды» — <span style={{ color: INK, fontWeight: 600 }}>никогда больше не нальёт</span>.</span>
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
