"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 127 · Ценность программы по рыночным ценам. Текст 1-в-1 STRUCTURE 1641-1658.
 * 7 компонентов слева, лайм-цены справа, внизу большой ИТОГО (crescendo).
 * PLACEHOLDER: цены требуют ресёрча Александра — слот «· добавит Александр».
 */
const ROWS = [
  "10 модулей · 50 уроков (3-4 месяца обучения у эксперта-практика)",
  "Метод onAI — авторская система памяти агента (модуль 3)",
  "Готовые шаблоны и промпты + 6 принципов Vibe Engine",
  "Сквозной кейс — свой AI-сервис в интернете (за время курса)",
  "Шаблоны договора, брифа и КП для работы с клиентами",
  "Доступ в OPUS.CLUB на 12 месяцев",
  "Готовая платёжка: Robokassa + Telegram-уведомления (модуль 9)",
];

export function Slide_127_ValueDecomposition() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={760}
      background={<SlideBg theme="dark" variant="lime-right" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ЦЕННОСТЬ ПРОГРАММЫ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3.2vw, 50px)" }}
      >
        ЧТО ВНУТРИ — <span className="text-[#B6FF00]">ПО РЫНОЧНЫМ ЦЕНАМ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="text-white/65 text-sm md:text-base leading-snug mb-6"
      >
        Разложим программу по компонентам и сравним с реальной ценой курса.
      </motion.div>

      {/* 7 компонентов — компонент слева, цена-слот справа */}
      <div className="flex flex-col gap-2 max-w-3xl mb-6">
        {ROWS.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.16, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-center gap-4 rounded-xl px-4 py-2.5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <span className="text-[#B6FF00]/55 font-mono text-sm shrink-0 w-5">{i + 1}</span>
            <span className="text-white/85 text-[15px] md:text-base leading-snug flex-1 min-w-0">{r}</span>
            <span
              className="shrink-0 font-mono text-xs md:text-sm px-3 py-1 rounded-md"
              style={{ color: "#B6FF00", border: "1px dashed rgba(182,255,0,0.4)", background: "rgba(182,255,0,0.05)" }}
            >
              · добавит Александр
            </span>
          </motion.div>
        ))}
      </div>

      {/* ИТОГО — crescendo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 + ROWS.length * 0.16 + 0.2, ease: [0.34, 1.56, 0.64, 1] }}
        className="inline-flex items-center gap-4 rounded-2xl px-6 py-4 max-w-3xl"
        style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 50px -12px rgba(182,255,0,0.5)" }}
      >
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">ИТОГО</span>
        <span
          className="font-bold leading-none text-[#B6FF00]"
          style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(26px,3vw,46px)" }}
        >
          · добавит Александр ₸
        </span>
      </motion.div>
    </SlideLayout>
  );
}
