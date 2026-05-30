"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Check, User } from "lucide-react";

/**
 * Слайд 108 · Вопрос 1 — «А Я СМОГУ?». Текст 1-в-1 STRUCTURE 1343-1352.
 * KNOCKOUT: сомнение в заголовке-кавычках → ответ лаймом. 5 аватаров с лайм-галочками
 * появляются, 6-й силуэт «достраивается» лаймом — это вы.
 */
const PEOPLE = [
  "Айдос не писал код",
  "Ренат не учил программирование",
  "Мерей — тренер по фитнесу",
];

export function Slide_108_CanIDoIt() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={720}
      background={<SlideBg theme="dark" variant="aura-tl" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ВОПРОС 1
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(34px, 4.4vw, 64px)" }}
      >
        «А Я <span className="text-[#FC5C02]">СМОГУ?</span>»
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/70 text-base md:text-lg leading-snug max-w-2xl mb-6"
      >
        Вы только что увидели 5 ответов.
      </motion.div>

      {/* 5 аватаров с галочками + 6-й — это вы */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        {[0, 1, 2, 3, 4].map((n) => (
          <motion.div
            key={n}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.55 + n * 0.12, ease: [0.34, 1.4, 0.64, 1] }}
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(182,255,0,0.3)" }}
          >
            <User className="w-6 h-6 text-white/80" strokeWidth={1.8} />
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.75 + n * 0.12, ease: [0.34, 1.56, 0.64, 1] }}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "#B6FF00", boxShadow: "0 0 14px rgba(182,255,0,0.6)" }}
            >
              <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
            </motion.span>
          </motion.div>
        ))}

        <span className="text-white/30 text-2xl px-1 self-center">+</span>

        {/* 6-й — это вы, достраивается лаймом */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.4, ease: [0.34, 1.4, 0.64, 1] }}
          className="relative flex flex-col items-center gap-1.5"
        >
          <div
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{ border: "1.5px dashed rgba(182,255,0,0.6)" }}
          >
            <motion.div
              initial={{ height: "0%" }}
              animate={{ height: "100%" }}
              transition={{ duration: 0.9, delay: 1.7, ease: [0.25, 1, 0.5, 1] }}
              className="absolute bottom-0 left-0 right-0"
              style={{ background: "rgba(182,255,0,0.18)" }}
            />
            <User className="relative w-6 h-6 text-[#B6FF00]" strokeWidth={2} />
          </div>
          <span className="text-[#B6FF00] text-[11px] font-mono font-bold uppercase tracking-[0.12em]">это вы</span>
        </motion.div>
      </div>

      {/* knockout-ответ */}
      <div className="flex flex-col gap-2.5 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="text-white/65 text-sm md:text-base leading-snug"
        >
          {PEOPLE.join(". ")}.
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.9 }}
          className="text-white text-base md:text-xl font-semibold leading-snug"
        >
          Если они смогли — у вас <span className="text-[#B6FF00]">95% шанс</span> что сможете тоже.
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.2 }}
          className="text-white/60 text-sm md:text-base leading-snug"
        >
          5% — кто бросает на первой неделе. Не потому что «не дано», а потому что «не хочу».
          {" "}
          <span className="text-white font-semibold">Если читаешь это до сих пор — ты в 95%.</span>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
