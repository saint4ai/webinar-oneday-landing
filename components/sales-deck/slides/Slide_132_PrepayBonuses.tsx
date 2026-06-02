"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Gift } from "lucide-react";

/** Слайд 132 · Условие предоплаты + анонс бонусов. Текст 1-в-1 STRUCTURE 1737-1751. DL-7. */
const STEPS = [
  { n: "1", t: "Предоплата 5 000 ₸", d: "сейчас" },
  { n: "2", t: "Полная оплата", d: "в течение 24 часов" },
  { n: "3", t: "Цена закреплена за тобой", d: "по цене этого дня" },
];
const BONUSES = [
  { b: "Б-1", t: "Обучение «Claude Code · Базовый»", d: "3 часа · 5 уроков · доступ сразу" },
  { b: "Б-2", t: "AI-Таргетолог — готовый инструмент", d: "мой работающий сервис у тебя" },
  { b: "Б-3", t: "Топ-5 TG-каналов + Threads-бот", d: "источник заказов 24/7" },
];

export function Slide_132_PrepayBonuses() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="lime-right" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // УСЛОВИЕ + БОНУСЫ ЗА ПРЕДОПЛАТУ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-5"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 3vw, 46px)" }}
      >
        ПРЕДОПЛАТА <span className="text-[#B6FF00]">5 000 ₸</span> — И НАЧНИ СЕГОДНЯ
      </motion.h1>

      <div className="flex items-stretch gap-3 mb-5 flex-wrap">
        {STEPS.map((s, i) => (
          <motion.div key={s.n} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.4 + i * 0.14 }} className="flex-1 min-w-[170px] rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="font-bold text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 22 }}>{s.n}</span>
            <div className="text-white font-semibold text-sm md:text-base mt-1 leading-tight">{s.t}</div>
            <div className="text-white/45 text-xs md:text-sm">{s.d}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2.5 max-w-3xl">
        {BONUSES.map((b, i) => (
          <motion.div key={b.b} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 1.0 + i * 0.14 }} className="rounded-xl px-3.5 py-3" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.28)" }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Gift className="w-3.5 h-3.5 text-[#B6FF00] shrink-0" strokeWidth={2.2} />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#B6FF00]">{b.b}</span>
            </div>
            <div className="text-white font-semibold text-xs md:text-sm leading-tight">{b.t}</div>
            <div className="text-white/45 text-[13px] mt-0.5 leading-snug">{b.d}</div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.6 }} className="text-white/70 text-sm md:text-base mt-4 max-w-2xl">
        Это не «приходи через 2 недели». Это <span className="text-[#B6FF00] font-semibold">начни сегодня вечером</span>.
      </motion.div>
    </SlideLayout>
  );
}
