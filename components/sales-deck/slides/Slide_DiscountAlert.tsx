"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

/**
 * Слайд-вспышка «ВНИМАНИЕ! СКИДКА» — pattern-interrupt перед раскрытием цены 390 000 ₸ (поз. 131).
 * Полноэкранный, яркий, «плавающий»: bob + pulse + вращающиеся лучи sale-стикера. Вау-эффект.
 * ⚠ Размер скидки DISCOUNT — ЗАГЛУШКА, уточнить у Александра.
 *    (на след. слайде 490→390 = −100 000 ₸ ≈ 20%; если якорить к 770К — ~−50%.)
 */
const DISCOUNT = "−20%"; // ⚠ заглушка — подставить реальный % от Александра

// фиксированные позиции искр (без Math.random — иначе ломает SSR/resume)
const SPARKS = [
  { left: "12%", top: "22%", d: 0 }, { left: "85%", top: "18%", d: 0.6 },
  { left: "20%", top: "76%", d: 1.2 }, { left: "80%", top: "72%", d: 0.3 },
  { left: "50%", top: "10%", d: 0.9 }, { left: "7%", top: "50%", d: 1.5 },
  { left: "92%", top: "48%", d: 0.45 }, { left: "60%", top: "84%", d: 1.1 },
];

export function Slide_DiscountAlert() {
  return (
    <section
      className="relative w-screen h-screen overflow-hidden flex items-center justify-center"
      style={{ background: "radial-gradient(circle at 50% 45%, #1c1500 0%, #0a0a05 55%, #000 100%)" }}
    >
      {/* Лучи sale-стикера — лайм, по часовой */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 pointer-events-none"
        style={{
          width: "190vw", height: "190vw", x: "-50%", y: "-50%",
          background: "repeating-conic-gradient(from 0deg at 50% 50%, rgba(182,255,0,0.10) 0deg 6deg, transparent 6deg 18deg)",
          maskImage: "radial-gradient(circle, #000 0%, transparent 60%)", WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 60%)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
      />
      {/* Лучи оранж — в противоход */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 pointer-events-none"
        style={{
          width: "170vw", height: "170vw", x: "-50%", y: "-50%",
          background: "repeating-conic-gradient(from 9deg at 50% 50%, rgba(252,92,2,0.08) 0deg 5deg, transparent 5deg 16deg)",
          maskImage: "radial-gradient(circle, #000 0%, transparent 56%)", WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 56%)",
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
      />
      {/* Центральное свечение */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ width: 980, height: 980, background: "radial-gradient(circle, rgba(182,255,0,0.20), rgba(252,92,2,0.10) 42%, transparent 68%)", filter: "blur(22px)" }}
      />

      {/* Искры */}
      {SPARKS.map((s, i) => (
        <motion.div
          key={i}
          aria-hidden
          className="absolute rounded-full pointer-events-none"
          style={{ left: s.left, top: s.top, width: 10, height: 10, background: i % 2 ? "#FC5C02" : "#B6FF00", boxShadow: `0 0 18px ${i % 2 ? "#FC5C02" : "#B6FF00"}` }}
          animate={{ y: [0, -20, 0], opacity: [0.25, 1, 0.25], scale: [0.7, 1.3, 0.7] }}
          transition={{ duration: 2.6, delay: s.d, ease: "easeInOut", repeat: Infinity }}
        />
      ))}

      {/* Плавающая композиция */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-8"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1, y: [0, -14, 0] }}
        transition={{
          opacity: { duration: 0.5 },
          scale: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] },
          y: { duration: 3.6, ease: "easeInOut", repeat: Infinity },
        }}
      >
        {/* ВНИМАНИЕ — пульсирующая плашка */}
        <motion.div
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-6"
          style={{ background: "#FC5C02", boxShadow: "0 0 42px -6px rgba(252,92,2,0.85)" }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.1, ease: "easeInOut", repeat: Infinity }}
        >
          <Zap className="w-5 h-5 text-black" strokeWidth={2.8} fill="black" />
          <span className="font-bold uppercase tracking-[0.2em] text-black text-sm md:text-base" style={{ fontFamily: "var(--font-benzin), system-ui" }}>
            Внимание
          </span>
        </motion.div>

        {/* СКИДКА */}
        <div
          className="font-bold uppercase text-white leading-[0.9] tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(46px, 7.5vw, 120px)", textShadow: "0 0 36px rgba(0,0,0,0.55)" }}
        >
          СКИДКА
        </div>

        {/* −XX% — гигант, лёгкий пульс */}
        <motion.div
          className="font-bold leading-[0.82] tabular-nums"
          style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(110px, 18vw, 300px)", color: "#B6FF00", textShadow: "0 0 80px rgba(182,255,0,0.6), 0 0 150px rgba(182,255,0,0.35)" }}
          animate={{ scale: [1, 1.035, 1] }}
          transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
        >
          {DISCOUNT}
        </motion.div>

        {/* urgency — эхо след. слайда «для тех, кто решает сегодня» */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="font-mono uppercase tracking-[0.22em] text-white/70 text-sm md:text-lg mt-7"
        >
          только для тех, кто решает сегодня
        </motion.div>
      </motion.div>
    </section>
  );
}
