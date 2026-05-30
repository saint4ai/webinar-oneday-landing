"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 107 · «У ВАС СЕЙЧАС В ГОЛОВЕ 3 ВОПРОСА». Текст 1-в-1 STRUCTURE 1330-1339.
 * INTERROGATION: три больших знака «?» картами с лайм-glow появляются по очереди,
 * под каждым — сам вопрос. Завязка прививки от возражений.
 */
const QUESTIONS = [
  "А я смогу?",
  "А реально ли заработать?",
  "А сколько это стоит и где взять время?",
];

export function Slide_107_ThreeQuestions() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={720}
      background={<SlideBg theme="dark" variant="lime-right" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ПРИВИВКА ОТ ВОЗРАЖЕНИЙ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 3.8vw, 58px)" }}
      >
        У ВАС СЕЙЧАС В ГОЛОВЕ <span className="text-[#B6FF00]">3 ВОПРОСА</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/65 text-base md:text-lg leading-snug max-w-2xl mb-7"
      >
        Давайте честно — я знаю какие.
      </motion.div>

      {/* 3 знака вопроса картами */}
      <div className="grid grid-cols-3 gap-4 max-w-3xl mb-6">
        {QUESTIONS.map((q, i) => (
          <motion.div
            key={q}
            initial={{ opacity: 0, y: 26, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 + i * 0.25, ease: [0.34, 1.4, 0.64, 1] }}
            className="relative rounded-2xl px-4 py-5 flex flex-col items-center text-center gap-3"
            style={{ background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.25)" }}
          >
            <motion.span
              animate={{ opacity: [1, 0.55, 1] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
              className="font-bold leading-none"
              style={{
                fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
                fontSize: "clamp(64px, 8vw, 120px)",
                color: "#B6FF00",
                textShadow: "0 0 60px rgba(182,255,0,0.55), 0 0 120px rgba(182,255,0,0.25)",
              }}
            >
              ?
            </motion.span>
            <span className="text-white/90 text-sm md:text-base font-semibold leading-tight">{q}</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.6 }}
        className="text-white/75 text-base md:text-lg leading-snug max-w-2xl"
      >
        Разберёмся по очереди — коротко, без воды. Программу обсудим дальше.
      </motion.div>
    </SlideLayout>
  );
}
