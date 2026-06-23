"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 77 · Сколько стоит на рынке. Текст 1-в-1 STRUCTURE 949-953.
 * Сравнение цен: ты (вайбкодер) 500-800К vs студия от 1.5М. Цифры на проверку.
 */
const ROWS = [
  { label: "ТЫ собрал сам", value: "300–800 тыс ₸", sub: "за заказ", frac: 0.45, grad: "linear-gradient(90deg,#B6FF00,#8FCC00)", vc: "#B6FF00" },
  { label: "Студия", value: "от 1.5 млн ₸", sub: "за то же самое", frac: 1, grad: "linear-gradient(90deg,#FC5C02,#FF7A2A)", vc: "#FC5C02" },
];

export function Slide_77_MarketPrice() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={740}
      background={<SlideBg theme="dark" variant="dual-bottom" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ПРАКТИКА · ЦЕНА РЫНКА
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.4cqw, 52px)" }}
      >
        СКОЛЬКО ТАКОЕ <span className="text-[#B6FF00]">СТОИТ НА РЫНКЕ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/65 text-base md:text-lg leading-snug mb-9"
      >
        От 300 до 800 тысяч ₸ за заказ. Студии берут от 1.5 миллиона.
      </motion.div>

      <div className="flex flex-col gap-5 max-w-3xl">
        {ROWS.map((r, i) => (
          <div key={r.label} className="flex items-center gap-4">
            <span className="text-white/60 text-sm font-mono uppercase tracking-[0.08em] w-[130px] shrink-0">{r.label}</span>
            <div className="relative flex-1 h-12 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: r.frac }}
                transition={{ duration: 1.1, delay: 0.6 + i * 0.25, ease: [0.25, 1, 0.5, 1] }}
                className="absolute inset-y-0 left-0 right-0 rounded-xl origin-left"
                style={{ background: r.grad }}
              />
            </div>
            <div className="shrink-0 w-[175px]">
              <div className="font-bold text-sm md:text-base whitespace-nowrap leading-tight" style={{ fontFamily: "var(--font-benzin), system-ui", color: r.vc }}>{r.value}</div>
              <div className="text-xs text-white/45">{r.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="text-white/45 text-sm md:text-base mt-7 max-w-2xl"
      >
        Ты делаешь то же самое — <span className="text-[#B6FF00] font-semibold">в 2-3 раза дешевле студии</span> и за дни, а не месяцы.
      </motion.div>
    </SlideLayout>
  );
}
