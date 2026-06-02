"use client";

import { motion } from "framer-motion";
import { ObjectionSlide } from "../ObjectionSlide";

/**
 * Слайд 150 · Возражение 1 — нет денег → рассрочка. Текст 1-в-1 STRUCTURE 2098-2104.
 * PLACEHOLDER: скачать логотипы 3 банков — Kaspi Bank, Home Credit Bank KZ, Halyk Bank KZ.
 */
const BANKS = ["Kaspi Bank", "Home Credit", "Halyk Bank"];
const PLANS = [
  { mo: "12 месяцев", sum: "24 242 ₸", note: "в месяц" },
  { mo: "24 месяца", sum: "12 121 ₸", note: "в месяц" },
];

export function Slide_150_ObjNoMoney() {
  return (
    <ObjectionSlide n={1} question="А ЕСЛИ У МЕНЯ НЕТ ДЕНЕГ?" answer="Беспроцентная рассрочка на 12 или 24 месяца через 3 банка." bg="aura-tl">
      <div className="flex flex-col gap-4 max-w-2xl">
        <div className="flex items-center gap-2.5 flex-wrap">
          {BANKS.map((b, i) => (
            <motion.span key={b} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }} className="rounded-lg px-3.5 py-2 text-white/85 text-xs md:text-sm font-semibold border border-dashed" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.2)" }}>
              {b}
            </motion.span>
          ))}
          <span className="text-white/35 text-[10px] font-mono">логотипы банков — placeholder</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          {PLANS.map((p, i) => (
            <motion.div key={p.mo} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.9 + i * 0.14, ease: [0.34, 1.3, 0.64, 1] }} className="rounded-xl px-5 py-3.5" style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.35)" }}>
              <div className="text-white/55 text-xs uppercase tracking-[0.1em] mb-1">{p.mo}</div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-[#B6FF00] tabular-nums" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(22px,2.2vw,34px)" }}>{p.sum}</span>
                <span className="text-white/50 text-xs">{p.note}</span>
              </div>
            </motion.div>
          ))}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 1.2 }} className="flex items-center text-white/60 text-sm">от 290 900 ₸ · без переплат</motion.div>
        </div>
      </div>
    </ObjectionSlide>
  );
}
