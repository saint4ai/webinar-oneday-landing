"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Check } from "lucide-react";

/**
 * 2-е окно продаж · Рекап бонусов ПЕРЕД вторым QR.
 * Напоминание: что забираешь за предоплату + что за полную оплату. Идёт после «программа кратко», перед QR.
 * ⚠ Цифры/ценность — зона Александра (per-item ценники намеренно не дублируем, они на сводках 141/155).
 */
const PREPAY = [
  "Claude Code — базовый старт с нуля",
  "AI-Таргетолог как готовый навык",
];
const FULLPAY = [
  "Обучение «AI-менеджеры в отделы продаж»",
  "Два договора на внедрение под ключ",
  "Публикация приложения в App Store и Google Play",
  "Источник заказов — Telegram-канал с заявками",
];

function Group({ title, items, delay }: { title: string; items: string[]; delay: number }) {
  return (
    <div className="flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className="font-mono text-[10px] md:text-[11px] tracking-[0.18em] uppercase font-bold text-[#FC5C02] mb-3"
      >
        {title}
      </motion.div>
      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: delay + 0.12 + i * 0.1 }}
            className="flex items-start gap-2.5"
          >
            <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#B6FF00]" strokeWidth={2.8} />
            <span className="text-white/90 text-sm md:text-base leading-snug">{it}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function Slide_Window2BonusRecap() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ВСЁ, ЧТО ТЫ ЗАБИРАЕШЬ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-6"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3.2vw, 50px)" }}
      >
        НАПОМИНАЮ ПРО <span className="text-[#B6FF00]">БОНУСЫ</span>
      </motion.h1>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4 max-w-3xl mb-6">
        <Group title="За предоплату 5 000 ₸" items={PREPAY} delay={0.35} />
        <Group title="За полную оплату" items={FULLPAY} delay={0.55} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 1.1 }}
        className="inline-flex items-center max-w-3xl rounded-xl px-5 py-3.5"
        style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}
      >
        <span className="text-white/85 text-sm md:text-base">
          Всё это — <span className="text-[#B6FF00] font-semibold">бесплатно</span>, сверх самого обучения. Места по предоплате ограничены.
        </span>
      </motion.div>
    </SlideLayout>
  );
}
