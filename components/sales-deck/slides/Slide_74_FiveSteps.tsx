"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Globe, MessageSquare, Sparkles, Smartphone, Download, ChevronRight } from "lucide-react";

/**
 * Слайд 74 · 5 шагов сборки. Текст 1-в-1 STRUCTURE 916-927.
 * 5 шагов flow с лайм-стрелками. ⚠️ Выбор 3 тем приложения — на Slide 73 (пометка Александра).
 */
const STEPS = [
  { icon: Globe, t: "Открываем Google AI Studio" },
  { icon: MessageSquare, t: "Описываем что нужно" },
  { icon: Sparkles, t: "AI генерирует приложение" },
  { icon: Smartphone, t: "Тестируем в браузере" },
  { icon: Download, t: "Скачиваем готовое приложение на телефон" },
];

export function Slide_74_FiveSteps() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={760}
      background={<SlideBg theme="dark" variant="lime-right" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ПРАКТИКА · ПЛАН
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-8"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(36px, 4.6cqw, 76px)" }}
      >
        5 <span className="text-[#B6FF00]">ШАГОВ</span>
      </motion.h1>

      <div className="flex items-stretch gap-2.5 mb-8 flex-wrap">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center gap-2.5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.4 + i * 0.15, ease: [0.25, 1, 0.5, 1] }}
                className="flex flex-col gap-2.5 rounded-xl px-4 py-4 w-[150px]"
                style={{ background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.22)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(182,255,0,0.12)" }}>
                    <Icon className="w-4 h-4 text-[#B6FF00]" strokeWidth={1.9} />
                  </div>
                  <span className="font-bold opacity-25 leading-none" style={{ color: "#B6FF00", fontFamily: "var(--font-benzin), system-ui", fontSize: 28 }}>{i + 1}</span>
                </div>
                <div className="text-white/85 text-xs md:text-sm leading-tight font-medium">{s.t}</div>
              </motion.div>
              {i < STEPS.length - 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.55 + i * 0.15 }}>
                  <ChevronRight className="w-5 h-5 text-[#B6FF00]/60" strokeWidth={2.5} />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.3 }}
        className="text-white/70 text-base md:text-lg leading-snug max-w-2xl"
      >
        Дальше — <span className="text-[#B6FF00] font-semibold">практика вживую</span>. Показываю каждый шаг на своём экране.
      </motion.div>
    </SlideLayout>
  );
}
