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

      {/* Уравнение года: входы сверху, итог — отдельной строкой с «=» и крупнее */}
      <div className="flex flex-col gap-3.5 mb-6">
        {/* входы: A × B */}
        <div className="flex items-stretch gap-3 md:gap-4 flex-wrap">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6, ease: [0.25, 1, 0.5, 1] }} className="rounded-2xl px-5 py-4 flex flex-col justify-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="font-bold leading-none whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(22px,2.4vw,38px)", color: "#fff" }}>300–800 тыс ₸</div>
            <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.12em] text-white/45 mt-1.5">за один заказ</div>
          </motion.div>
          <motion.span initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.85 }} className="self-center font-bold text-white/40" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(22px,2.2vw,34px)" }}>×</motion.span>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.0, ease: [0.25, 1, 0.5, 1] }} className="rounded-2xl px-5 py-4 flex flex-col justify-center" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="font-bold leading-none whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(22px,2.4vw,38px)", color: "#fff" }}>3–4 заказа</div>
            <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.12em] text-white/45 mt-1.5">за год — не поток</div>
          </motion.div>
        </div>
        {/* итог: = C */}
        <div className="flex items-center gap-3 md:gap-4">
          <motion.span initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 1.25 }} className="font-bold text-[#FC5C02] shrink-0" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(26px,2.6vw,42px)" }}>=</motion.span>
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.4, ease: [0.25, 1, 0.5, 1] }} className="rounded-2xl px-6 py-4 flex flex-col justify-center" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.45)", boxShadow: "0 0 50px -10px rgba(182,255,0,0.4)" }}>
            <div className="font-bold leading-none whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(30px,3.6vw,58px)", color: "#B6FF00", textShadow: "0 0 60px rgba(182,255,0,0.45)" }}>1,5–3 млн ₸</div>
            <div className="font-mono text-[10px] md:text-xs uppercase tracking-[0.12em] text-[#B6FF00]/70 mt-1.5">в год · с одного навыка</div>
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.7 }} className="text-white/85 text-base md:text-lg leading-snug max-w-2xl">
        Без офиса, без команды, без склада. <span className="text-[#B6FF00] font-semibold">Один навык — и заказы окупают его раз за разом.</span>
      </motion.div>
    </SlideLayout>
  );
}
