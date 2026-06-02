"use client";

import { motion } from "framer-motion";

/**
 * BonusPriceReveal — сквозная механика ценности бонуса: рыночная цена → зачёркивание (оранж) → «Бесплатно» (лайм).
 * Используется в BonusCardSlide (предоплата/OTO) и в слайдах бонусов за просмотр.
 */
export function BonusPriceReveal({ marketPrice, delay = 0.9 }: { marketPrice: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay - 0.4 }}
      className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl px-3.5 py-2.5 mb-4 self-start max-w-full"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">на рынке</span>
      <div className="relative inline-block">
        <span className="font-bold text-white/55 tabular-nums whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(16px,1.5vw,22px)" }}>{marketPrice}</span>
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.4, delay, ease: "easeInOut" }}
          className="absolute left-0 right-0 top-1/2 h-[2.5px] origin-left rounded-full"
          style={{ background: "#FC5C02", boxShadow: "0 0 10px rgba(252,92,2,0.6)" }}
        />
      </div>
      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: delay + 0.25 }} className="text-white/30 text-lg leading-none">→</motion.span>
      <motion.span
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, delay: delay + 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold text-[#B6FF00] whitespace-nowrap"
        style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(16px,1.5vw,22px)", textShadow: "0 0 24px rgba(182,255,0,0.5)" }}
      >
        БЕСПЛАТНО <span className="text-[#B6FF00]/60 text-[13px] font-normal">· бонусом</span>
      </motion.span>
    </motion.div>
  );
}
