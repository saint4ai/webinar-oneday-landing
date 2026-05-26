"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { withBase } from "@/lib/api-url";

const THREADS_COUNT = 10;
const AUTO_INTERVAL = 5000; // ms — 5 сек на каждый скрин, чтобы успели прочесть

/**
 * Карусель скриншотов тредса (10 шт) — auto-rotation с возможностью
 * ручного переключения. Скриншоты показываются ЦЕЛИКОМ (object-contain),
 * не обрезаются.
 */
export function ThreadsCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % THREADS_COUNT);
    }, AUTO_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused]);

  const indexes = Array.from({ length: THREADS_COUNT }, (_, i) => i);

  return (
    <div
      className="relative w-full h-full flex flex-col"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Main display — большой текущий скрин */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
            className="absolute inset-0 flex items-center justify-center p-4"
          >
            <img
              src={withBase(`/threads/thread-${String(idx + 1).padStart(2, "0")}.png`)}
              alt={`Запрос вайбкодера в Threads #${idx + 1}`}
              className="max-h-full max-w-full object-contain rounded-xl border border-white/10"
              style={{
                boxShadow: "0 24px 60px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(182,255,0,0.05)",
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicator + thumbnails strip */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {indexes.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            className="group relative"
            aria-label={`Скрин ${i + 1}`}
          >
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === idx
                  ? "w-8 bg-[#B6FF00]"
                  : "w-1.5 bg-white/20 group-hover:bg-white/40"
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
