"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Scissors, UtensilsCrossed, Calculator, TrendingUp, Dumbbell } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Слайд 50 · Engagement — «СМОГЛИ БЫ НАЙТИ КЛИЕНТА?».
 * Посыл (правка Александра): оглянись вокруг — у кого рядом есть боль, которую
 * решает автоматизация / готовое приложение. Топ-5 ниш + краткие решения.
 * Ниши иллюстративные (KZ МСБ), без «исключающего» оранжа.
 */
const NICHES: { icon: LucideIcon; niche: string; solution: string }[] = [
  { icon: Scissors, niche: "Салоны красоты", solution: "онлайн-запись, напоминания клиентам, загрузка мастеров" },
  { icon: UtensilsCrossed, niche: "Рестораны и кафе", solution: "бронь столов, приём заказов в боте, учёт по сменам" },
  { icon: Calculator, niche: "Бухгалтеры", solution: "автосводка отчётов, контроль сроков, ответы по Налоговому кодексу" },
  { icon: TrendingUp, niche: "Отделы продаж", solution: "AI-помощник: КП, follow-up, квалификация заявок" },
  { icon: Dumbbell, niche: "Фитнес-студии и тренеры", solution: "CRM: расписание, программы, оплаты, прогресс клиентов" },
];

export function Slide_50_Engagement2() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={760}
      background={<SlideBg theme="dark" variant="dual-bottom" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ВОПРОС В ЧАТ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-3"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(28px, 3.6vw, 54px)",
        }}
      >
        СМОГЛИ БЫ НАЙТИ <span className="text-[#B6FF00]">КЛИЕНТА?</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/70 text-base md:text-lg leading-snug max-w-2xl mb-6"
      >
        Оглянитесь вокруг: если у людей или бизнеса рядом есть боль, которую решает автоматизация или готовое приложение — это ваш клиент. Вот частые ниши и решения:
      </motion.div>

      {/* Топ-5 ниш → решения */}
      <div className="flex flex-col gap-2.5 max-w-3xl w-full">
        {NICHES.map((n, i) => {
          const Icon = n.icon;
          return (
            <motion.div
              key={n.niche}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.12, ease: [0.25, 1, 0.5, 1] }}
              className="flex items-center gap-3.5 rounded-xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.25)" }}
              >
                <Icon className="w-5 h-5 text-[#B6FF00]" strokeWidth={1.9} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-white font-bold text-base md:text-lg leading-tight">{n.niche}</span>
                <span className="text-white/30 mx-2">→</span>
                <span className="text-white/65 text-sm md:text-[15px] leading-snug">{n.solution}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}
