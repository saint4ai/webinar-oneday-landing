"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 140 · ОТО — «купи до конца суток». Идёт ПОСЛЕ финальной цены (290 900).
 * Живой отсчёт до конца текущих суток (у каждого зрителя свой → честно на автовебе).
 * Без фейк-«осталось N мест».
 */
function useEndOfDayCountdown() {
  const [t, setT] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      let diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      const h = Math.floor(diff / 3600);
      diff %= 3600;
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setT({ h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Slide_140_Timer() {
  const { h, m, s } = useEndOfDayCountdown();

  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="orange-pain" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#FC5C02] mb-4">
        // ТОЛЬКО ОДИН РАЗ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-7"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 3.8cqw, 60px)" }}
      >
        КУПИ <span className="text-[#FC5C02]">ДО КОНЦА СУТОК</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="flex items-end gap-3 mb-3"
      >
        <span
          className="font-bold leading-none tabular-nums"
          style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(56px, 8cqw, 150px)", color: "#FC5C02", textShadow: "0 0 70px rgba(252,92,2,0.4)" }}
        >
          {pad(h)}:{pad(m)}:<motion.span animate={{ opacity: [1, 0.55, 1] }} transition={{ duration: 1, repeat: Infinity }} className="inline-block">{pad(s)}</motion.span>
        </span>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }} className="font-mono text-xs uppercase tracking-[0.16em] text-white/55 mb-6">
        часы : минуты : секунды до конца суток
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }} className="text-white/75 text-base md:text-lg max-w-2xl leading-snug">
        Внёс предоплату <span className="text-[#B6FF00] font-semibold">10 000 ₸</span> до конца суток — фиксируешь <span className="text-[#B6FF00] font-semibold">290 900 ₸ + бонусы</span>. После — обычная цена обучения.
      </motion.div>
    </SlideLayout>
  );
}
