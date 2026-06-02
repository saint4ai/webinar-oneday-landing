"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { X, Check } from "lucide-react";

/**
 * Слайд 130 · С курсом vs самостоятельно. Текст 1-в-1 STRUCTURE 1696-1715.
 * DESIGN-LANGUAGE: DL-6 comparison. 2 колонки: оранж «без курса» / лайм «с курсом».
 */
const WITHOUT = [
  "Идея так и висит в голове — как уже год. Воз и ныне там.",
  "Собираешь по обрывкам с форумов 4–6 месяцев — и всё равно кривое.",
  "Застрял без объяснений — бросил на полпути, как в прошлый раз.",
  "Пока ты тычешься — кто-то уже собрал и продал.",
];
const WITH = [
  "Готовая карта — первый рабочий результат за 8 недель.",
  "Шаблоны и промпты — не сжигаешь деньги и токены на пробы.",
  "Куратор ответит: застрял утром — к обеду едешь дальше.",
  "Модуль 10: оффер, скрипты, КП — первый клиент в течение месяца.",
];

export function Slide_130_WithVsWithout() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="dual-bottom" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // КАК ТЫ БУДЕШЬ ДВИГАТЬСЯ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-1"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 3vw, 46px)" }}
      >
        С ОБУЧЕНИЕМ ИЛИ <span className="text-[#B6FF00]">В ОДИНОЧКУ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/60 text-sm md:text-base mb-5">
        Один и тот же путь — но сроки, деньги и нервы разные.
      </motion.div>

      <div className="grid grid-cols-2 gap-4 max-w-3xl">
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.45, ease: [0.25, 1, 0.5, 1] }} className="rounded-2xl p-5" style={{ background: "rgba(252,92,2,0.05)", border: "1px solid rgba(252,92,2,0.25)" }}>
          <div className="font-bold uppercase tracking-[0.06em] mb-4" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 18, color: "#FC5C02" }}>БЕЗ ОБУЧЕНИЯ</div>
          <div className="flex flex-col gap-3">
            {WITHOUT.map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <X className="w-4 h-4 mt-0.5 shrink-0 text-[#FC5C02]/70" strokeWidth={2.5} />
                <span className="text-white/60 text-xs md:text-sm leading-snug">{t}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.45, ease: [0.25, 1, 0.5, 1] }} className="rounded-2xl p-5" style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 60px -18px rgba(182,255,0,0.5)" }}>
          <div className="font-bold uppercase tracking-[0.06em] mb-4" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 18, color: "#B6FF00" }}>С ОБУЧЕНИЕМ</div>
          <div className="flex flex-col gap-3">
            {WITH.map((t, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#B6FF00]" strokeWidth={2.8} />
                <span className="text-white text-xs md:text-sm leading-snug font-medium">{t}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.3 }} className="text-white/70 text-sm md:text-base mt-4 max-w-3xl">
        Это не «что лучше». Это сколько ты сэкономишь времени и денег — и <span className="text-[#B6FF00] font-semibold">навык останется с тобой навсегда</span>.
      </motion.div>
    </SlideLayout>
  );
}
