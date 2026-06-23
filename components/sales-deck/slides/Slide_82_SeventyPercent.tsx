"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { FileText, Send, Presentation, BarChart3, ClipboardList, Mail, Mic } from "lucide-react";

/**
 * Слайд 82 · 70% офисной рутины. Текст 1-в-1 STRUCTURE 1001-1011.
 */
const TASKS = [
  { icon: FileText, t: "Договоры" },
  { icon: Send, t: "КП" },
  { icon: Presentation, t: "Презентации" },
  { icon: BarChart3, t: "Аналитика" },
  { icon: ClipboardList, t: "Отчёты" },
  { icon: Mail, t: "Письма" },
  { icon: Mic, t: "Расшифровки созвонов" },
];

export function Slide_82_SeventyPercent() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={740}
      background={<SlideBg theme="dark" variant="climax" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ПОСЫЛ БЛОКА
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 3.8cqw, 58px)" }}
      >
        <span className="text-[#B6FF00]">70%</span> ТВОЕЙ ОФИСНОЙ РУТИНЫ
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/65 text-base md:text-lg leading-snug max-w-2xl mb-7"
      >
        Можно делегировать AI как программисту. Любая работа за компьютером — повторяющиеся задачи.
      </motion.div>

      {/* 7 типов задач */}
      <div className="flex flex-wrap gap-2.5 max-w-3xl mb-6">
        {TASKS.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.div
              key={t.t}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.55 + i * 0.1, ease: [0.34, 1.4, 0.64, 1] }}
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(182,255,0,0.2)" }}
            >
              <Icon className="w-4 h-4 text-[#B6FF00] shrink-0" strokeWidth={1.9} />
              <span className="text-white/85 text-sm md:text-base font-medium">{t.t}</span>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="inline-flex items-center rounded-xl px-4 py-2.5"
        style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.3)" }}
      >
        <span className="text-white/85 text-sm md:text-base leading-snug">
          <span className="text-[#B6FF00] font-semibold">12-15 свободных часов в неделю</span> — это арифметика моих учеников. Я так живу каждый день.
        </span>
      </motion.div>
    </SlideLayout>
  );
}
