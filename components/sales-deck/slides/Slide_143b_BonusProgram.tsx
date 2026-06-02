"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Star } from "lucide-react";

/**
 * Слайд 143b · ПРОГРАММА главного бонуса за покупку — «ИИ-менеджер для отдела продаж» (5 модулей).
 * Идёт сразу после Slide_143 (кейсы). Упаковка вкусно: на каждый модуль — результат, не «теория про…».
 * Модули 1-в-1 от Александра (2026-06-02).
 */
const MODULES = [
  { n: "01", t: "Введение в профессию", r: "Кто платит за внедрение ИИ-менеджеров и сколько — твой первый шаг и первый чек." },
  { n: "02", t: "Связки решений под ниши", r: "Готовые схемы под клиники, стоматологии, салоны красоты и другие услуги — внедряешь по шаблону, не изобретаешь." },
  { n: "03", t: "Интеграция с AmoCRM и Bitrix24", r: "ИИ-менеджер живёт прямо в CRM клиента — ведёт сделку и не теряет ни одной заявки." },
  { n: "04", t: "N8N: автоматизация и работа с API", r: "Связываешь ИИ-менеджера с любым сервисом клиента без программиста — заявки, оплаты, уведомления на автомате." },
  { n: "05", t: "Продажи на высокий чек", r: "Как упаковать и закрыть клиента на внедрение — без скидок и «я подумаю»." },
];

export function Slide_143b_BonusProgram() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4 self-start"
        style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}
      >
        <Star className="w-3.5 h-3.5 text-[#B6FF00]" strokeWidth={2.4} fill="#B6FF00" />
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] font-bold text-[#B6FF00]">
          ГЛАВНЫЙ БОНУС · ПРОГРАММА
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-6"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.4vw, 52px)" }}
      >
        5 МОДУЛЕЙ — <span className="text-[#B6FF00]">ОТ НУЛЯ ДО ПРОДАЖ</span>
      </motion.h1>

      <div className="flex flex-col gap-2.5 max-w-3xl">
        {MODULES.map((m, i) => (
          <motion.div
            key={m.n}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.35 + i * 0.12 }}
            className="flex items-start gap-4 rounded-xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderLeft: "2px solid #B6FF00" }}
          >
            <span
              className="font-bold leading-none shrink-0"
              style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(20px,1.9vw,30px)", color: "#B6FF00", minWidth: 42 }}
            >
              {m.n}
            </span>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-base md:text-lg leading-tight">{m.t}</span>
              <span className="text-white/55 text-sm md:text-[15px] leading-snug mt-0.5">{m.r}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </SlideLayout>
  );
}
