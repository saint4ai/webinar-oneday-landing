"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 124 · Метод Vibe Engine — 6 принципов. Текст 1-в-1 STRUCTURE 1603-1614.
 * DESIGN-LANGUAGE: DL-2 swiss. 6 принципов в 2 колонки с ghost-номерами.
 */
const PRINCIPLES = [
  { t: "Контекст важнее модели", d: "качество зависит не от модели, а от количества контекста." },
  { t: "Память агента — основа проекта", d: "без неё проект разваливается на 3-й сессии." },
  { t: "Сначала структура, потом код", d: "планируем долго — пишем коротко." },
  { t: "Делегируй всё, что можно", d: "если агент может — это не для тебя." },
  { t: "Готовые модули, а не код с нуля", d: "соединяй проверенное, не изобретай заново." },
  { t: "Маленькие шаги, частые сохранения", d: "один шаг — одно сохранение версии проекта." },
];

export function Slide_124_VibeEngine() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="aura-tr" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // АВТОРСКИЙ МЕТОД
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 3vw, 46px)" }}
      >
        МЕТОД VIBE ENGINE — <span className="text-[#B6FF00]">6 ПРИНЦИПОВ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug mb-6 max-w-2xl">
        Не куча трюков. Авторский фреймворк, по которому я сам собираю свои продукты.
      </motion.div>

      <div className="grid grid-cols-2 gap-x-7 gap-y-4 max-w-3xl mb-5">
        {PRINCIPLES.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.5 + i * 0.1, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-start gap-3 pt-3"
            style={{ borderTop: "1px solid rgba(182,255,0,0.28)" }}
          >
            <span className="font-bold leading-none shrink-0 select-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(20px,2vw,30px)", color: "transparent", WebkitTextStroke: "1.2px rgba(182,255,0,0.5)" }}>
              {i + 1}
            </span>
            <div className="min-w-0">
              <div className="text-white font-bold text-sm md:text-base leading-tight">{p.t}</div>
              <div className="text-white/55 text-xs md:text-sm leading-snug mt-0.5">{p.d}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 1.2 }} className="inline-block rounded-xl px-4 py-3 max-w-3xl" style={{ background: "rgba(182,255,0,0.09)", border: "1px solid rgba(182,255,0,0.38)" }}>
        <span className="text-white text-sm md:text-base font-medium">Эти 6 принципов — <span className="text-[#B6FF00]">двигатель Vibe Engine</span>. На них собрана вся программа.</span>
      </motion.div>
    </SlideLayout>
  );
}
