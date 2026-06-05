"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 127 · Что внутри — по рыночным ценам. Текст 1-в-1 STRUCTURE 1641-1655.
 * DESIGN-LANGUAGE: DL-6 value-stack. 7 компонентов + цена справа + ИТОГО.
 * ВНИМАНИЕ (STRUCTURE PLACEHOLDER): цены — гипотеза Александра, НЕ подтверждены.
 * Нужны реальные рыночные KZ-цены. Помечено «*ориентир».
 */
const ITEMS = [
  { t: "10 модулей · 54 урока", d: "5 недель с экспертом-практиком · уроки по 15–20 мин", p: "280 000" },
  { t: "Метод onAI", d: "авторская система памяти агента (модуль 3)", p: "100 000" },
  { t: "Шаблоны и промпты + 6 принципов Vibe Engine", d: "", p: "80 000" },
  { t: "Сквозной кейс", d: "свой AI-сервис в интернете за время обучения", p: "100 000" },
  { t: "Шаблоны договора, брифа и КП", d: "для работы с клиентами", p: "60 000" },
  { t: "Модуль продаж «Первый платящий клиент»", d: "доводим до первого чека от клиента", p: "100 000" },
  { t: "Готовая платёжка", d: "Robokassa + Telegram-уведомления (модуль 9)", p: "50 000" },
];

export function Slide_127_ValueDecomposition() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-2">
        // ЦЕННОСТЬ ПРОГРАММЫ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 3vw, 46px)" }}
      >
        ЧТО ВНУТРИ — <span className="text-[#B6FF00]">ПО РЫНОЧНЫМ ЦЕНАМ</span>
      </motion.h1>

      <div className="flex flex-col max-w-3xl mb-3">
        {ITEMS.map((it, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 + i * 0.09 }}
            className="flex items-center justify-between gap-4 py-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="min-w-0">
              <span className="text-white font-semibold text-sm md:text-base">{it.t}</span>
              {it.d && <span className="text-white/40 text-xs md:text-sm"> · {it.d}</span>}
            </div>
            <span className="font-bold tabular-nums shrink-0 text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(15px,1.4vw,20px)" }}>{it.p} ₸</span>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 1.2 }} className="flex items-baseline justify-between gap-4 max-w-3xl rounded-xl px-5 py-3" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}>
        <span className="font-bold uppercase text-white tracking-[0.04em]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(18px,2vw,30px)" }}>ИТОГО</span>
        <span className="font-bold tabular-nums text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(24px,3vw,48px)" }}>770 000 ₸</span>
      </motion.div>
    </SlideLayout>
  );
}
