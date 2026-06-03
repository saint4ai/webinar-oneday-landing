"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { X, Check } from "lucide-react";

/**
 * Слайд 112 · Это не курс — это поток. Текст 1-в-1 STRUCTURE 1402-1410.
 * 2 колонки бок-о-бок: серая «КУРС» (минусы) vs лайм «ПОТОК» (плюсы).
 */
const COURSE = [
  "«Посмотрел видео, получил сертификат»",
  "Удачи дальше в одиночку",
  "Лежит на полке",
];
const STREAM = [
  "30 человек заходят вместе",
  "5 недель работают как команда",
  "Выходят с первыми клиентами",
];

export function Slide_112_NotCourse() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={740} background={<SlideBg theme="dark" variant="lime-right" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ФОРМАТ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-8"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.4vw, 52px)" }}
      >
        ЭТО НЕ КУРС — ЭТО <span className="text-[#B6FF00]">ОБУЧЕНИЕ С КОМЬЮНИТИ</span>
      </motion.h1>

      <div className="grid grid-cols-2 gap-4 max-w-3xl">
        {/* КУРС — серая колонка */}
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className="rounded-2xl p-6"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="font-bold uppercase text-white/45 tracking-[0.08em] mb-5" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 22 }}>
            КУРС
          </div>
          <div className="flex flex-col gap-3.5">
            {COURSE.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.12 }}
                className="flex items-start gap-2.5"
              >
                <X className="w-4 h-4 mt-0.5 shrink-0 text-white/35" strokeWidth={2.5} />
                <span className="text-white/55 text-sm md:text-base leading-snug">{t}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ПОТОК — лайм колонка (светится) */}
        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className="rounded-2xl p-6"
          style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 60px -18px rgba(182,255,0,0.5)" }}
        >
          <div className="font-bold uppercase text-[#B6FF00] tracking-[0.08em] mb-5" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 22 }}>
            КОМЬЮНИТИ
          </div>
          <div className="flex flex-col gap-3.5">
            {STREAM.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.12 }}
                className="flex items-start gap-2.5"
              >
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#B6FF00]" strokeWidth={2.8} />
                <span className="text-white text-sm md:text-base leading-snug font-medium">{t}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
