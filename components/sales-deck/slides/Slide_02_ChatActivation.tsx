"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";

/**
 * Слайд 2 · Активация чата — «ДАВАЙТЕ ЗНАКОМИТЬСЯ»
 * 4 вопроса аудитории. Цифры 1-4 лаймом, snap-up появление.
 */
const QUESTIONS = [
  "Как вас зовут",
  "Из какого вы города",
  "Чем сейчас занимаетесь",
  "Что привело вас на воркшоп? Какие идеи, мысли, желания?",
];

export function Slide_02_ChatActivation() {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      <Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />

      <div
        className="relative z-10 h-full flex flex-col justify-center"
        style={{
          paddingRight: "calc(var(--sd-speaker-zone, 30vw) + 48px)",
          paddingLeft: "48px",
        }}
      >
        <div className="flex flex-col gap-8" style={{ maxWidth: "min(900px, 60vw)" }}>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00]"
          >
            // АКТИВАЦИЯ ЧАТА
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em]"
            style={{
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(40px, 5vw, 80px)",
            }}
          >
            ДАВАЙТЕ <span className="text-[#B6FF00]">ЗНАКОМИТЬСЯ</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-white/65 text-lg md:text-xl"
          >
            Напишите в чат:
          </motion.div>

          {/* 4 вопроса с лайм-цифрами */}
          <div className="flex flex-col gap-3 mt-2">
            {QUESTIONS.map((q, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: 0.8 + i * 0.15,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="flex items-start gap-4"
              >
                <span
                  className="shrink-0 font-bold leading-none"
                  style={{
                    color: "#B6FF00",
                    fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
                    fontSize: "clamp(28px, 3vw, 44px)",
                    textShadow: "0 0 18px rgba(182,255,0,0.4)",
                    minWidth: "1.5em",
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-white/90 text-lg md:text-2xl leading-snug pt-1">
                  {q}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
