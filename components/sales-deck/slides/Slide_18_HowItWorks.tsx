"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";
import { MessageSquareText, Code2, FlaskConical, Rocket, Terminal } from "lucide-react";

/**
 * Слайд 18 · Как это работает — «ВЫГЛЯДИТ ЭТО ТАК».
 * 5 шагов flow в столбик с лайм-коннекторами, прогрессивное появление.
 * Текст 1-в-1 из STRUCTURE.
 *
 * Тема «процесс/механика» → анимация: пошаговое раскрытие сверху вниз + рисующиеся коннекторы.
 */
const STEPS = [
  { icon: Terminal, t: "Открываете AI-инструмент", s: "Claude Code, Cursor, Google AI Studio" },
  { icon: MessageSquareText, t: "Пишете словами что хотите", s: "обычный язык, без кода" },
  { icon: Code2, t: "AI пишет код", s: "за вас, целиком" },
  { icon: FlaskConical, t: "Тестируете", s: "смотрите что получилось" },
  { icon: Rocket, t: "Рабочее приложение или сайт", s: "готово к запуску" },
];

export function Slide_18_HowItWorks() {
  return (
    <SlideLayout
      speakerSide="right"
      background={<Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // КАК ЭТО РАБОТАЕТ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-8"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(30px, 3.8cqw, 56px)",
        }}
      >
        ВЫГЛЯДИТ <span className="text-[#B6FF00]">ЭТО ТАК</span>
      </motion.h1>

      {/* 5 шагов с коннекторами */}
      <div className="flex flex-col max-w-3xl">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isLast = i === STEPS.length - 1;
          return (
            <div key={i} className="relative">
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.18, ease: [0.25, 1, 0.5, 1] }}
                className="flex items-center gap-5"
              >
                {/* Номер + иконка */}
                <div
                  className="relative w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: isLast ? "#B6FF00" : "rgba(182,255,0,0.1)",
                    border: isLast ? "none" : "1px solid rgba(182,255,0,0.3)",
                    boxShadow: isLast ? "0 0 30px rgba(182,255,0,0.5)" : "none",
                  }}
                >
                  <Icon className="w-7 h-7" style={{ color: isLast ? "#000" : "#B6FF00" }} strokeWidth={2} />
                  <span
                    className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold"
                    style={{ background: "#0a0a0a", border: "1px solid rgba(182,255,0,0.4)", color: "#B6FF00" }}
                  >
                    {i + 1}
                  </span>
                </div>
                {/* Текст шага */}
                <div className="py-1">
                  <div className="text-white font-semibold text-lg md:text-2xl leading-tight">{step.t}</div>
                  <div className="text-white/50 text-sm md:text-base mt-1">{step.s}</div>
                </div>
              </motion.div>

              {/* Коннектор-стрелка вниз */}
              {!isLast && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + i * 0.18 + 0.12 }}
                  className="ml-8 origin-top"
                  style={{ height: "26px", width: "2px", background: "linear-gradient(to bottom, rgba(182,255,0,0.5), rgba(182,255,0,0.15))" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </SlideLayout>
  );
}
