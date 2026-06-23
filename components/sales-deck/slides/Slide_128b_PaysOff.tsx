"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 128b · Беат «окупаемость» — между 490 (полная) и 390.
 * Приём «разовая инвестиция vs регулярный доход»: один заказ на рынке окупает обучение.
 * Честно — без обещаний заработка. Слово «курс» НЕ используем → «обучение». Числа на проверку.
 */
const BARS = [
  { label: "ОБУЧЕНИЕ", value: "490 000 ₸", frac: 0.42, grad: "linear-gradient(90deg,#8A9099,#C4C9CF)", vc: "#C4C9CF", glow: false },
  { label: "ОДИН ЗАКАЗ НА РЫНКЕ", value: "300–800 тыс ₸", frac: 1, grad: "linear-gradient(90deg,#B6FF00,#8FCC00)", vc: "#B6FF00", glow: true },
];
const PROOF = [
  "Владислав — собрал сервис, продаёт экспедиторам",
  "Айдос — пишет приложения для компании из США",
];

export function Slide_128b_PaysOff() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="aura-tr" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ДАВАЙ ПОСЧИТАЕМ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.02] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.5cqw, 56px)" }}
      >
        ВЕРНЁТСЯ <span className="text-[#B6FF00]">С ПЕРВОГО ЗАКАЗА</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/70 text-sm md:text-lg leading-snug max-w-2xl mb-6">
        На рынке такой сервис стоит 300–800 тысяч за заказ. Обучение — 490. Один клиент окупает всё целиком.
      </motion.div>

      <div className="flex flex-col gap-3.5 max-w-3xl mb-3">
        {BARS.map((r, i) => (
          <div key={r.label} className="flex items-center gap-4">
            <span className="text-white/60 text-xs md:text-sm font-mono uppercase tracking-[0.06em] w-[170px] shrink-0">{r.label}</span>
            <div className="relative flex-1 h-11 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: r.frac }}
                transition={{ duration: 1.1, delay: 0.6 + i * 0.3, ease: [0.25, 1, 0.5, 1] }}
                className="absolute inset-y-0 left-0 right-0 rounded-xl origin-left"
                style={{ background: r.grad, boxShadow: r.glow ? "0 0 40px -6px rgba(182,255,0,0.6)" : "none" }}
              />
            </div>
            <div className="shrink-0 w-[185px]">
              <div className="font-bold text-sm md:text-base whitespace-nowrap leading-tight" style={{ fontFamily: "var(--font-benzin), system-ui", color: r.vc }}>{r.value}</div>
            </div>
          </div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 1.3 }} className="text-white/55 text-sm md:text-base max-w-2xl mb-5">
        Достаточно одного клиента — и ты вернул вложенное. Дальше доход твой.
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.5 }} className="text-white/85 text-base md:text-lg leading-snug max-w-2xl mb-4">
        490 — это не плата за видеоуроки. Это <span className="text-[#B6FF00] font-semibold">вход в навык, который потом находит заказы сам</span>.
      </motion.div>

      <div className="flex flex-wrap gap-2.5">
        {PROOF.map((p, i) => (
          <motion.div key={p} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.7 + i * 0.12 }} className="flex items-center gap-2 rounded-lg px-3.5 py-2" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.22)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#B6FF00] shrink-0" />
            <span className="text-white/85 text-xs md:text-sm">{p}</span>
          </motion.div>
        ))}
      </div>
    </SlideLayout>
  );
}
