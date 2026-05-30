"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Users, Store, BadgeDollarSign, Check } from "lucide-react";

/**
 * Слайд 75 · Готово — своё приложение. Текст 1-в-1 STRUCTURE 930-934.
 * Стилизованный телефон с приложением (трекер привычек) + 3 исхода.
 */
const HABITS = [
  ["Спорт", true],
  ["Вода 2 л", true],
  ["Чтение", false],
  ["Медитация", true],
] as const;
const OUTCOMES = [
  { icon: Users, t: "Показывать друзьям" },
  { icon: Store, t: "Выложить в Play Market" },
  { icon: BadgeDollarSign, t: "Продавать" },
];

export function Slide_75_AppDone() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="30vw"
      contentMinWidth={620}
      background={<SlideBg theme="dark" variant="aura-tr" />}
      leftObject={
        <motion.div
          initial={{ opacity: 0, y: 24, rotate: -3 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
          className="relative"
          style={{ width: 260, height: 540, borderRadius: 42, background: "#0A0B0F", border: "8px solid #1B1F26", boxShadow: "0 40px 80px -24px rgba(0,0,0,0.8), 0 0 60px -20px rgba(182,255,0,0.3)" }}
        >
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full" style={{ background: "#1B1F26" }} />
          <div className="absolute inset-2 rounded-[34px] overflow-hidden p-4 flex flex-col" style={{ background: "linear-gradient(180deg,#0E1207,#0A0B0F)" }}>
            <div className="text-white font-bold text-base mt-5 mb-1">Мои привычки</div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="font-bold text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 30 }}>7</span>
              <span className="text-white/50 text-xs">дней подряд 🔥</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {HABITS.map(([name, done], i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.9 + i * 0.12 }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: done ? "rgba(182,255,0,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${done ? "rgba(182,255,0,0.3)" : "rgba(255,255,255,0.08)"}` }}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: done ? "#B6FF00" : "transparent", border: done ? "none" : "1.5px solid rgba(255,255,255,0.25)" }}>
                    {done && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                  </span>
                  <span className={done ? "text-white text-sm" : "text-white/50 text-sm"}>{name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      }
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ПРАКТИКА · РЕЗУЛЬТАТ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.02em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3vw, 48px)" }}
      >
        ГОТОВО — У ВАС <span className="text-[#B6FF00]">СВОЁ ПРИЛОЖЕНИЕ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="text-white/65 text-base md:text-lg leading-snug max-w-xl mb-7"
      >
        Можно показывать друзьям, выкладывать в Play Market, продавать.
      </motion.div>

      <div className="flex flex-col gap-3 max-w-md">
        {OUTCOMES.map((o, i) => {
          const Icon = o.icon;
          return (
            <motion.div
              key={o.t}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.7 + i * 0.13 }}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.2)" }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(182,255,0,0.12)" }}>
                <Icon className="w-4 h-4 text-[#B6FF00]" strokeWidth={1.9} />
              </div>
              <span className="text-white font-semibold text-sm md:text-base">{o.t}</span>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}
