"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { withBase } from "@/lib/api-url";

// thread-03 (noraproai «не вайб-кодера») исключён — он бьёт по смыслу «бизнес ищет вайбкодера»
const SLIDES = [1, 2, 4, 5, 6, 7, 8, 9, 10];
const THREADS_COUNT = SLIDES.length;

/**
 * Карусель скриншотов Threads (9 шт) — РУЧНОЕ листание (стрелки ◀▶ + точки).
 * Авто-прокрутка убрана (Александр листает сам во время эфира). object-contain — целиком.
 */
export function ThreadsCarousel() {
  const [idx, setIdx] = useState(0);
  const go = (d: number) => setIdx((i) => (i + d + THREADS_COUNT) % THREADS_COUNT);
  const indexes = Array.from({ length: THREADS_COUNT }, (_, i) => i);

  return (
    <div className="relative w-full h-full flex flex-col pointer-events-auto">
      {/* Main display — большой текущий скрин */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="absolute inset-0 flex items-center justify-center p-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBase(`/threads/thread-${String(SLIDES[idx]).padStart(2, "0")}.png`)}
              alt={`Запрос вайбкодера в Threads #${idx + 1}`}
              className="max-h-full max-w-full object-contain rounded-xl border border-white/10"
              style={{ boxShadow: "0 24px 60px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(182,255,0,0.05)" }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Стрелки ручного листания */}
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Предыдущий"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          style={{ background: "rgba(0,0,0,0.62)", border: "1px solid rgba(182,255,0,0.45)", backdropFilter: "blur(6px)" }}
        >
          <ChevronLeft className="w-5 h-5 text-[#B6FF00]" strokeWidth={2.6} />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Следующий"
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          style={{ background: "rgba(0,0,0,0.62)", border: "1px solid rgba(182,255,0,0.45)", backdropFilter: "blur(6px)" }}
        >
          <ChevronRight className="w-5 h-5 text-[#B6FF00]" strokeWidth={2.6} />
        </button>
      </div>

      {/* Точки-индикаторы (клик = переход) */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {indexes.map((i) => (
          <button key={i} type="button" onClick={() => setIdx(i)} className="group relative" aria-label={`Скрин ${i + 1}`}>
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === idx ? "w-8 bg-[#B6FF00]" : "w-1.5 bg-white/20 group-hover:bg-white/40"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Counter pill */}
      <div className="absolute top-2 right-2 font-mono text-[10px] tracking-[0.18em] uppercase text-white/45 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full">
        {idx + 1} / {THREADS_COUNT}
      </div>
    </div>
  );
}
