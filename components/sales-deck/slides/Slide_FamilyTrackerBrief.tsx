"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Users, ListChecks, Trophy, Palette, Bell, Shield } from "lucide-react";

/**
 * Практика · ТЗ для семейного трекера привычек (через Google AI Studio).
 * Показываем: не «сделай трекер», а детальное глобальное ТЗ (собрано через ui-ux-pro-max).
 * Полный промпт — в PRACTICE_family_tracker_prompt.md.
 */
const SPEC = [
  { icon: Users, t: "Мультиюзер", d: "вся семья: родители + дети, роли и доступы, добавление по коду" },
  { icon: ListChecks, t: "Привычки + цели", d: "свои привычки у каждого + общие семейные цели" },
  { icon: Trophy, t: "Геймификация", d: "серии, очки, награды от родителей — без давления" },
  { icon: Palette, t: "Премиум-дизайн", d: "светлая и тёмная тема, тёплая палитра, Lora + Raleway" },
  { icon: Bell, t: "Мягкие напоминания", d: "по времени, ненавязчиво" },
  { icon: Shield, t: "Безопасно детям", d: "детский режим проще, контроль у родителя" },
];

export function Slide_FamilyTrackerBrief() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={780} background={<SlideBg theme="dark" variant="aura-tr" />}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#FC5C02] mb-4"
      >
        // ПРАКТИКА · ТЗ ДЛЯ BLOOM
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(22px, 2.7cqw, 40px)" }}
      >
        ОТДАЁМ AI ОДНО <span className="text-[#B6FF00]">ДЕТАЛЬНОЕ ТЗ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/65 text-base md:text-lg leading-snug mb-7 max-w-xl"
      >
        Не «сделай трекер», а точное задание. Чем детальнее ТЗ — тем премиальнее результат.
      </motion.div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-3.5 max-w-3xl">
        {SPEC.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.t}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.5 + i * 0.08 }}
              className="flex items-start gap-3 rounded-xl px-3.5 py-3"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.3)" }}>
                <Icon className="w-4 h-4 text-[#B6FF00]" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <div className="text-white font-bold text-sm md:text-base leading-tight" style={{ fontFamily: "var(--font-benzin), system-ui" }}>{s.t}</div>
                <div className="text-white/50 text-xs md:text-[13px] leading-snug mt-0.5">{s.d}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.1 }}
        className="mt-5 inline-flex items-center gap-2 self-start rounded-lg px-3 py-2 font-mono text-[12px]"
        style={{ background: "rgba(252,92,2,0.08)", border: "1px solid rgba(252,92,2,0.3)", color: "rgba(255,255,255,0.75)" }}
      >
        <span className="text-[#FC5C02] font-bold">▸</span> полное ТЗ собрано через скилл <span className="text-white font-semibold">ui-ux-pro-max</span> → копипастим в Google AI Studio
      </motion.div>
    </SlideLayout>
  );
}
