"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

/**
 * Базовый слайд-вспышка «ВНИМАНИЕ · СКИДКА» — pattern-interrupt перед раскрытием цены.
 * Текст выровнен по левому краю и не заходит в зону спикера (правые 30cqw).
 * Фоновые лучи/свечение/искры — полноэкранные по центру (не зависят от выравнивания текста).
 * props.gifts=true — добавляет падающие подарки 🎁 (для финального слайда скидки).
 */
const SPARKS = [
  { left: "12%", top: "22%", d: 0 }, { left: "62%", top: "16%", d: 0.6 },
  { left: "20%", top: "76%", d: 1.2 }, { left: "58%", top: "78%", d: 0.3 },
  { left: "40%", top: "10%", d: 0.9 }, { left: "7%", top: "50%", d: 1.5 },
  { left: "66%", top: "46%", d: 0.45 }, { left: "48%", top: "86%", d: 1.1 },
];

const GIFTS = [
  { left: "5%", delay: 0.0, dur: 5.6, size: 34 }, { left: "16%", delay: 1.9, dur: 6.3, size: 28 },
  { left: "28%", delay: 0.7, dur: 5.0, size: 42 }, { left: "40%", delay: 2.5, dur: 6.7, size: 30 },
  { left: "52%", delay: 1.1, dur: 5.3, size: 36 }, { left: "64%", delay: 3.0, dur: 6.0, size: 26 },
  { left: "76%", delay: 0.4, dur: 5.9, size: 38 }, { left: "86%", delay: 2.1, dur: 6.4, size: 30 },
  { left: "94%", delay: 1.5, dur: 5.6, size: 32 },
];

export function DiscountAlertBase({ discount, subtitle, gifts = false }: { discount: string; subtitle: string; gifts?: boolean }) {
  return (
    <section
      className="relative w-full h-full overflow-hidden flex items-center justify-start"
      style={{ background: "radial-gradient(circle at 42% 45%, #1c1500 0%, #0a0a05 55%, #000 100%)", paddingLeft: "clamp(40px, 6cqw, 120px)", paddingRight: "var(--sd-speaker-zone, 30cqw)" }}
    >
      {/* Лучи лайм */}
      <motion.div
        aria-hidden className="absolute left-1/2 top-1/2 pointer-events-none"
        style={{ width: "190cqw", height: "190cqw", x: "-50%", y: "-50%", background: "repeating-conic-gradient(from 0deg at 50% 50%, rgba(182,255,0,0.10) 0deg 6deg, transparent 6deg 18deg)", maskImage: "radial-gradient(circle, #000 0%, transparent 60%)", WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 60%)" }}
        animate={{ rotate: 360 }} transition={{ duration: 30, ease: "linear", repeat: Infinity }}
      />
      {/* Лучи оранж — в противоход */}
      <motion.div
        aria-hidden className="absolute left-1/2 top-1/2 pointer-events-none"
        style={{ width: "170cqw", height: "170cqw", x: "-50%", y: "-50%", background: "repeating-conic-gradient(from 9deg at 50% 50%, rgba(252,92,2,0.08) 0deg 5deg, transparent 5deg 16deg)", maskImage: "radial-gradient(circle, #000 0%, transparent 56%)", WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 56%)" }}
        animate={{ rotate: -360 }} transition={{ duration: 40, ease: "linear", repeat: Infinity }}
      />
      {/* Свечение */}
      <div aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ width: 980, height: 980, background: "radial-gradient(circle, rgba(182,255,0,0.20), rgba(252,92,2,0.10) 42%, transparent 68%)", filter: "blur(22px)" }} />

      {/* Искры */}
      {SPARKS.map((s, i) => (
        <motion.div key={i} aria-hidden className="absolute rounded-full pointer-events-none" style={{ left: s.left, top: s.top, width: 10, height: 10, background: i % 2 ? "#FC5C02" : "#B6FF00", boxShadow: `0 0 18px ${i % 2 ? "#FC5C02" : "#B6FF00"}` }} animate={{ y: [0, -20, 0], opacity: [0.25, 1, 0.25], scale: [0.7, 1.3, 0.7] }} transition={{ duration: 2.6, delay: s.d, ease: "easeInOut", repeat: Infinity }} />
      ))}

      {/* Падающие подарки */}
      {gifts && GIFTS.map((g, i) => (
        <motion.div key={`g${i}`} aria-hidden className="absolute pointer-events-none z-[6]" style={{ left: g.left, top: 0, fontSize: g.size, filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.5))" }} initial={{ y: "-12cqh", opacity: 0, rotate: -20 }} animate={{ y: "115cqh", opacity: [0, 1, 1, 0.85, 0], rotate: [-20, 18, -8] }} transition={{ duration: g.dur, delay: g.delay, ease: "linear", repeat: Infinity }}>
          🎁
        </motion.div>
      ))}

      {/* Текст — по левому краю */}
      <motion.div
        className="relative z-10 flex flex-col items-start text-left"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1, y: [0, -14, 0] }}
        transition={{ opacity: { duration: 0.5 }, scale: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }, y: { duration: 3.6, ease: "easeInOut", repeat: Infinity } }}
      >
        <motion.div className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-6" style={{ background: "#FC5C02", boxShadow: "0 0 42px -6px rgba(252,92,2,0.85)" }} animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity }}>
          <Zap className="w-5 h-5 text-black" strokeWidth={2.8} fill="black" />
          <span className="font-bold uppercase tracking-[0.2em] text-black text-sm md:text-base" style={{ fontFamily: "var(--font-benzin), system-ui" }}>Внимание</span>
        </motion.div>

        <div className="font-bold uppercase text-white leading-[0.9] tracking-[-0.02em]" style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(46px, 7cqw, 116px)", textShadow: "0 0 36px rgba(0,0,0,0.55)" }}>
          СКИДКА
        </div>

        <motion.div className="font-bold leading-[0.82] tabular-nums" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(110px, 16cqw, 280px)", color: "#B6FF00", textShadow: "0 0 80px rgba(182,255,0,0.6), 0 0 150px rgba(182,255,0,0.35)" }} animate={{ scale: [1, 1.035, 1] }} transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}>
          {discount}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="font-mono uppercase tracking-[0.18em] text-white/70 text-sm md:text-lg mt-7 max-w-[44ch]">
          {subtitle}
        </motion.div>
      </motion.div>
    </section>
  );
}
