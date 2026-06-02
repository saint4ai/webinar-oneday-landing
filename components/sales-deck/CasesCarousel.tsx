"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { withBase } from "@/lib/api-url";

/**
 * CasesCarousel — карусель кейсов учеников прошлого потока (ИИ-менеджеры в ОП).
 * 39 скринов-телефонов, авто-переключение каждую СЕКУНДУ (быстрый proof-флэш).
 * Скрин показывается целиком (object-contain). Прогресс-бар + счётчик N/39.
 */
const COUNT = 39;
const INTERVAL = 1000; // 1 сек на кейс — по ТЗ Александра

export function CasesCarousel() {
  const [idx, setIdx] = useState(0);
  const ref = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    ref.current = setInterval(() => setIdx((i) => (i + 1) % COUNT), INTERVAL);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={idx}
            src={withBase(`/cases-ai-managers/case-${String(idx + 1).padStart(2, "0")}.png`)}
            alt={`Кейс ученика прошлого потока №${idx + 1}`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }}
            className="absolute max-h-full max-w-full object-contain rounded-2xl border border-white/10"
            style={{ boxShadow: "0 24px 60px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(182,255,0,0.05)" }}
          />
        </AnimatePresence>
      </div>

      {/* Прогресс-бар на 1 сек + счётчик */}
      <div className="mt-3 flex items-center gap-2.5 shrink-0">
        <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            key={idx}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: INTERVAL / 1000, ease: "linear" }}
            className="h-full rounded-full bg-[#B6FF00]"
          />
        </div>
        <span className="font-mono text-[10px] tracking-[0.12em] text-white/55 tabular-nums shrink-0">
          {idx + 1}/{COUNT}
        </span>
      </div>
    </div>
  );
}
