"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Check } from "lucide-react";

/**
 * Слайд 56 · Research 4/5 — «ЧТО ДЕЛАЕТ ИДЕЮ СИЛЬНОЙ». Текст 1-в-1 STRUCTURE 680-696.
 * 7 критериев, лайм-галочки загораются по очереди (интервал ~0.25с).
 */
const CRITERIA = [
  "Боль повторяется каждый день или каждую неделю.",
  "Боль отнимает время — минимум 1 час в неделю.",
  "Боль создаёт ошибки — есть цена этих ошибок.",
  "Боль стоит денег — прямо или через потерянное время.",
  "Проблему уже решают вручную или в Excel — ценность подтверждена.",
  "У решения есть ясная польза за 30 секунд объяснения.",
  "Решение можно проверить быстрым тестом за 1-2 дня.",
];

export function Slide_56_Research4() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={760}
      background={<SlideBg theme="dark" variant="aura-tr" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // RESEARCH · 4 / 5
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-3"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(28px, 3.4cqw, 52px)",
        }}
      >
        ЧТО ДЕЛАЕТ ИДЕЮ <span className="text-[#B6FF00]">СИЛЬНОЙ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="text-white/65 text-sm md:text-base leading-snug mb-6"
      >
        Если <span className="text-[#B6FF00] font-semibold">5 из 7</span> — собирай. Если <span className="font-semibold" style={{ color: "#FC5C02" }}>меньше 3 — пропускай</span>.
      </motion.div>

      {/* 7 критериев */}
      <div className="grid grid-cols-1 gap-3 max-w-3xl mb-6">
        {CRITERIA.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.22, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-center gap-3.5"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.35, delay: 0.6 + i * 0.22, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(182,255,0,0.14)", border: "1px solid rgba(182,255,0,0.35)" }}
            >
              <Check className="w-5 h-5 text-[#B6FF00]" strokeWidth={3} />
            </motion.span>
            <span className="text-white/90 text-lg md:text-xl leading-snug">
              <span className="text-[#B6FF00]/60 font-mono text-sm mr-2.5">{i + 1}</span>{c}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Лайм-блок */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.2 }}
        className="inline-flex items-center rounded-xl px-4 py-2.5 max-w-3xl"
        style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.3)" }}
      >
        <span className="text-white/85 text-sm md:text-base leading-snug">
          7 критериев — без них идея остаётся идеей, <span className="text-[#B6FF00] font-semibold">не продуктом.</span>
        </span>
      </motion.div>
    </SlideLayout>
  );
}
