"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { FileText, Library, ListChecks, Camera } from "lucide-react";

/**
 * Слайд-напоминание о бонусах ПОСЛЕ практики (R6-bonus-reminder).
 * 4 бесплатных бонуса за участие + продающие описания по Хормози (ценность каждого). Удерживает зрителя до продажи.
 */
const BONUSES = [
  { icon: FileText, t: "Гайд: Android-приложение через Google AI Studio", d: "Соберёшь рабочее приложение без кода за вечер — по шагам.", val: "30 000 ₸" },
  { icon: Library, t: "Библиотека 30 промптов для Claude Code", d: "Готовые формулировки — копируешь и экономишь часы проб.", val: "20 000 ₸" },
  { icon: ListChecks, t: "Чек-лист 9 типов AI-сервисов", d: "Что покупают ПРЯМО СЕЙЧАС — бери нишу и собирай под заказ.", val: "25 000 ₸" },
  { icon: Camera, t: "PDF «AI Workspace» за сторис", d: "Структура папки, с которой Claude Code работает как часы.", val: "15 000 ₸" },
];

export function Slide_BonusReminder() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={780} background={<SlideBg theme="dark" variant="dual-bottom" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // НЕ ЗАБУДЬ ЗАБРАТЬ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.6vw, 56px)" }}
      >
        НАПОМИНАЮ ПРО <span className="text-[#B6FF00]">4 БОНУСА</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mb-5">
        Ты уже собрал приложение. А в конце эфира забираешь ещё это — бесплатно, просто за то, что досмотрел:
      </motion.div>

      <div className="grid grid-cols-2 gap-3 max-w-3xl mb-4">
        {BONUSES.map((b, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 + i * 0.13 }} className="relative flex items-start gap-3 rounded-2xl p-4" style={{ background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.22)" }}>
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.3)" }}>
              <b.icon className="w-5 h-5 text-[#B6FF00]" strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm md:text-base leading-tight">{b.t}</div>
              <div className="text-white/55 text-xs md:text-sm leading-snug mt-0.5">{b.d}</div>
              <div className="inline-flex items-center mt-1.5 rounded px-2 py-0.5 text-[11px] font-semibold text-[#B6FF00]" style={{ background: "rgba(182,255,0,0.12)" }}>ценность {b.val}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.1 }} className="inline-flex items-center gap-3 rounded-xl px-4 py-2.5 self-start" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}>
        <span className="text-white/85 text-sm md:text-base">Все 4 — <span className="text-[#B6FF00] font-semibold">бесплатно</span>. Условие одно: досмотри эфир до конца.</span>
      </motion.div>
    </SlideLayout>
  );
}
