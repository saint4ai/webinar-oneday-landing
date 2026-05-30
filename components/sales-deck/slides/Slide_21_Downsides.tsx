"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";
import { AlertTriangle } from "lucide-react";

/**
 * Слайд 21 · Минусы честно — «А ЕСТЬ МИНУСЫ?» (часть 1 из 2).
 * Тема «проблема/честность» → оранж-акцент, лёгкая тряска карточки.
 * Текст 1-в-1 из STRUCTURE (первая половина — суть проблемы).
 */
export function Slide_21_Downsides() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={620}
      background={
        <>
          <Spotlight className="-top-40 right-0 md:-top-20" fill="#FC5C02" />
          <Spotlight className="bottom-0 left-[10vw] md:bottom-[-20vh]" fill="#FC5C02" />
        </>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#FC5C02] mb-4"
      >
        // ЧЕСТНО О МИНУСАХ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-3"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(30px, 3.8vw, 56px)",
        }}
      >
        А ЕСТЬ <span className="text-[#FC5C02]">МИНУСЫ?</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="text-white text-lg md:text-xl font-semibold mb-7"
      >
        Да, один важный — если нет понимания архитектуры.
      </motion.div>

      {/* Карточка проблемы с лёгкой тряской на входе */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: [0, -4, 4, -3, 3, 0] }}
        transition={{
          opacity: { duration: 0.4, delay: 0.7 },
          x: { duration: 0.5, delay: 0.7, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
        }}
        className="rounded-2xl p-7 md:p-8 max-w-3xl"
        style={{
          background: "rgba(252,92,2,0.06)",
          border: "1px solid rgba(252,92,2,0.25)",
        }}
      >
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(252,92,2,0.15)", border: "1px solid rgba(252,92,2,0.4)" }}
          >
            <AlertTriangle className="w-6 h-6" style={{ color: "#FC5C02" }} strokeWidth={2} />
          </div>
          <div className="text-white font-semibold text-lg md:text-2xl leading-snug pt-1">
            Без знания, как устроены фронтенд и бэкенд — начинаются проблемы:
          </div>
        </div>

        <ul className="space-y-3.5 mt-5 pl-1">
          {[
            "Долгие отклики по кнопкам, приложение тормозит",
            "Ошибки в консоли — и непонятно, как чинить через AI",
            'Говоришь «пофикси» — агент крутит итерации, а проблема остаётся',
            "Сжигаешь токены, тратишь больше денег — а результата нет",
          ].map((line, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 1.0 + i * 0.15 }}
              className="flex items-start gap-3 text-white/80 text-base md:text-lg leading-snug"
            >
              <span className="mt-2.5 w-2 h-2 rounded-full shrink-0" style={{ background: "#FC5C02" }} />
              {line}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </SlideLayout>
  );
}
