"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { GraduationCap, Users, Inbox } from "lucide-react";

/**
 * Блок H · 2-е окно — мост: напоминаю про основное обучение (после bait-контента, перед программой и 2-м окном продаж).
 * Идёт после 160_FinalEngagement, перед ProgramRecap.
 */
const CHIPS = [
  { icon: GraduationCap, t: "10 модулей по шагам" },
  { icon: Users, t: "кураторы и проверка домашек" },
  { icon: Inbox, t: "где брать первых клиентов" },
];

export function Slide_RemindMainTraining() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={780} background={<SlideBg theme="dark" variant="aura-tr" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ВЕРНЁМСЯ К ГЛАВНОМУ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 4cqw, 60px)" }}
      >
        А ТЕПЕРЬ — ПРО <span className="text-[#B6FF00]">ОСНОВНОЕ ОБУЧЕНИЕ</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/70 text-base md:text-xl leading-snug max-w-2xl mb-7">
        Всё, что я показал сегодня, — только верхушка. Полная система — внутри обучения.
      </motion.div>

      <div className="flex flex-wrap gap-2.5 mb-7">
        {CHIPS.map((c, i) => (
          <motion.div key={c.t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.6 + i * 0.13 }} className="flex items-center gap-2.5 rounded-xl px-4 py-2.5" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.28)" }}>
            <c.icon className="w-4.5 h-4.5 text-[#B6FF00] shrink-0" strokeWidth={2} />
            <span className="text-white/85 text-sm md:text-base">{c.t}</span>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.1 }} className="text-white/85 text-base md:text-lg leading-snug max-w-2xl">
        От установки Claude Code <span className="text-[#B6FF00] font-semibold">до первого клиента, который платит</span>. С куратором рядом.
      </motion.div>
    </SlideLayout>
  );
}
