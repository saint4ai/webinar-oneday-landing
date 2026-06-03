"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Gift } from "lucide-react";

/**
 * Слайд 132 · ТИЗЕР предоплаты — плавный заход к бонусам (НЕ вываливаем список в лоб).
 * «Для тех, кто внесёт предоплату 10 000 ₸ — мы подготовили крутые бонусы». Дальше каждый бонус
 * раскрывается отдельным слайдом (134 Claude Code, 135 AI-Таргетолог) → 137b сводка.
 * ⚠ Сумма 10 000 ₸ и конвертации $19 / 2 000 ₽ — на проверку Александру. QR перегенерировать под 10 000 ₸.
 */
export function Slide_132_PrepayBonuses() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="lime-right" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // ПРЕДОПЛАТА = ДОСТУП К БОНУСАМ
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="font-bold uppercase text-white/85 tracking-[-0.01em] leading-[1.05]" style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(22px, 2.6vw, 40px)" }}>
        ДЛЯ ТЕХ, КТО ВНЕСЁТ ПРЕДОПЛАТУ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold leading-[0.95] tabular-nums whitespace-nowrap my-2"
        style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(56px, 8.5vw, 150px)", color: "#B6FF00", textShadow: "0 0 80px rgba(182,255,0,0.4)" }}
      >
        10 000 ₸
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="flex items-center gap-3 flex-wrap mb-5">
        <span className="text-white/80 text-lg md:text-2xl">— мы подготовили для тебя <span className="text-[#B6FF00] font-semibold">крутые бонусы</span></span>
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-white/45 rounded-md px-2.5 py-1" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>≈ $19 · 2 000 ₽</span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }} className="inline-flex items-center gap-3 self-start rounded-xl px-4 py-3 max-w-2xl" style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.3)" }}>
        <Gift className="w-5 h-5 text-[#B6FF00] shrink-0" strokeWidth={2.2} />
        <span className="text-white/85 text-sm md:text-base leading-snug">Сейчас разберу <span className="text-white font-semibold">каждый бонус отдельно</span> — и все они твои бесплатно, просто за то, что закрепишь место сегодня.</span>
      </motion.div>
    </SlideLayout>
  );
}
