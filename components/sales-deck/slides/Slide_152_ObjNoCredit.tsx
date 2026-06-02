"use client";

import { motion } from "framer-motion";
import { ObjectionSlide } from "../ObjectionSlide";
import { TrendingDown, TrendingUp } from "lucide-react";

/** Слайд 152 · Возражение 3 — не хочу кредит → 2 типа. Текст 1-в-1 STRUCTURE 2121-2125. */
export function Slide_152_ObjNoCredit() {
  return (
    <ObjectionSlide n={3} question="Я НЕ ХОЧУ БРАТЬ КРЕДИТ" answer="Тогда сравните два типа кредитов." bg="climax">
      <div className="grid grid-cols-2 gap-4 max-w-3xl">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.7 }} className="rounded-2xl p-4" style={{ background: "rgba(252,92,2,0.08)", border: "1px solid rgba(252,92,2,0.35)" }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-[#FC5C02]" strokeWidth={2.2} />
            <span className="font-bold uppercase text-[#FC5C02] text-sm tracking-[0.06em]" style={{ fontFamily: "var(--font-benzin), system-ui" }}>Глупые кредиты</span>
          </div>
          <div className="text-white/80 text-sm md:text-base mb-2">Новый телефон, отпуск, развлечения.</div>
          <div className="text-white/50 text-xs md:text-sm">Деньги уходят и не возвращаются.</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.85 }} className="rounded-2xl p-4" style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.4)" }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-[#B6FF00]" strokeWidth={2.2} />
            <span className="font-bold uppercase text-[#B6FF00] text-sm tracking-[0.06em]" style={{ fontFamily: "var(--font-benzin), system-ui" }}>Умные кредиты</span>
          </div>
          <div className="text-white/80 text-sm md:text-base mb-2">Образование, бизнес, недвижимость.</div>
          <div className="text-white/65 text-xs md:text-sm">Деньги возвращаются и приносят больше.</div>
        </motion.div>
      </div>
    </ObjectionSlide>
  );
}
