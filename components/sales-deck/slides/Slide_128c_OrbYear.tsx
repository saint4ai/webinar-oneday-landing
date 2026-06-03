"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 128c · ОРБ ×2 — «умножить на год». Между 128b (окупаемость с первого заказа) и 129 (390).
 * Приём референса: разовый доход × частота = крупная годовая сумма. Числа ⚠ на проверку (иллюстрация рынка, не обещание).
 */
export function Slide_128c_OrbYear() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="aura-tr" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ПОСЧИТАЕМ ДАЛЬШЕ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.03] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3.2vw, 50px)" }}
      >
        ОДИН ЗАКАЗ ОКУПАЕТ. <span className="text-[#B6FF00]">ОСТАЛЬНЫЕ — ТВОИ</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/70 text-sm md:text-lg leading-snug max-w-2xl mb-7">
        Первый заказ закрывает вложенное. Со второго — ты в плюсе.
      </motion.div>

      {/* Уравнение месяца: A × B на одной строке, итог = C во всю ширину (выровнен, не съезжает) */}
      <div className="flex flex-col gap-3.5 mb-7" style={{ maxWidth: 840 }}>
        {/* входы: A × B */}
        <div className="flex items-stretch gap-3 md:gap-4">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6, ease: [0.25, 1, 0.5, 1] }} className="flex-1 rounded-2xl px-5 py-4 flex flex-col justify-center" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="font-bold leading-none whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(20px,2.1vw,34px)", color: "#fff" }}>300–800 тыс ₸</div>
            <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.12em] text-white/45 mt-1.5">за один заказ</div>
          </motion.div>
          <motion.span initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.85 }} className="self-center shrink-0 font-bold text-white/35" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(20px,2vw,32px)" }}>×</motion.span>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.0, ease: [0.25, 1, 0.5, 1] }} className="flex-1 rounded-2xl px-5 py-4 flex flex-col justify-center" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="font-bold leading-none whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(20px,2.1vw,34px)", color: "#fff" }}>3–4 заказа</div>
            <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.12em] text-white/45 mt-1.5">в месяц — не поток</div>
          </motion.div>
        </div>
        {/* итог: = C во всю ширину */}
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.35, ease: [0.25, 1, 0.5, 1] }} className="w-full rounded-2xl px-6 py-5 flex items-center gap-4 md:gap-5" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.45)", boxShadow: "0 0 56px -12px rgba(182,255,0,0.4)" }}>
          <span className="shrink-0 font-bold text-[#FC5C02]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(28px,2.8vw,46px)" }}>=</span>
          <div className="min-w-0">
            <div className="font-bold leading-none whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(34px,4vw,62px)", color: "#B6FF00", textShadow: "0 0 60px rgba(182,255,0,0.45)" }}>1,5–3 млн ₸</div>
            <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.12em] text-[#B6FF00]/75 mt-2">в месяц · с одного навыка</div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.7 }} className="text-white/85 text-base md:text-xl leading-snug max-w-2xl">
        <span className="text-[#B6FF00] font-bold">Вайбкодинг</span> — навык делать любую задачу для бизнеса без сложных знаний. Важно <span className="text-[#B6FF00] font-semibold">намерение</span>.
      </motion.div>
    </SlideLayout>
  );
}
