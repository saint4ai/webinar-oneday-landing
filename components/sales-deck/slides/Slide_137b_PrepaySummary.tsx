"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Gift } from "lucide-react";

/**
 * Слайд 137b · Сводка бонусов ЗА ПРЕДОПЛАТУ — Хормози-стек перед раскрытием финальной цены (131).
 * Идёт после Б-3 (136), перед 131. Числа = ценники бонусов (50/49/100К → 199К), подсвечены Александру.
 */
const BONUSES = [
  { t: "Обучение «Claude Code · Базовый»", d: "5 уроков · доступ сразу после предоплаты", p: "50 000 ₸" },
  { t: "AI-Таргетолог — готовый инструмент", d: "мой работающий сервис у тебя", p: "49 000 ₸" },
  { t: "Готовый источник заказов", d: "Топ-5 TG-каналов + Threads-бот 24/7", p: "100 000 ₸" },
];

export function Slide_137b_PrepaySummary() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="lime-right" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ИТОГ БОНУСОВ ЗА ПРЕДОПЛАТУ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-5"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 3vw, 46px)" }}
      >
        ТРИ БОНУСА — <span className="text-[#B6FF00]">УЖЕ В ПОДАРОК</span>
      </motion.h1>

      <div className="flex flex-col max-w-3xl mb-4">
        {BONUSES.map((b, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.4 + i * 0.14 }} className="flex items-center justify-between gap-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <Gift className="w-4 h-4 shrink-0 text-[#B6FF00]" strokeWidth={2.4} />
              <div className="min-w-0">
                <div className="text-white font-semibold text-sm md:text-base leading-tight">{b.t}</div>
                <div className="text-white/45 text-[13px] leading-tight">{b.d}</div>
              </div>
            </div>
            <span className="font-bold tabular-nums shrink-0 text-white/45 line-through" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(15px,1.4vw,20px)" }}>{b.p}</span>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 1.0 }} className="flex items-center gap-4 flex-wrap max-w-3xl rounded-xl px-5 py-3.5" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 50px -18px rgba(182,255,0,0.5)" }}>
        <span className="text-white/70 text-sm md:text-base">Всего бонусов: <span className="line-through text-white/40">199 000 ₸</span> →</span>
        <span className="font-bold uppercase text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(20px,2.2vw,32px)" }}>БЕСПЛАТНО за предоплату 5 000 ₸</span>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.3 }} className="text-white/55 text-xs md:text-sm mt-2.5 max-w-2xl">
        И это — только за то, что закрепил место сегодня. Само обучение — отдельно, и о нём дальше.
      </motion.div>
    </SlideLayout>
  );
}
