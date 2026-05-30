"use client";

import { motion } from "framer-motion";
import { Flame, Footprints, Heart, Moon, Play } from "lucide-react";

/**
 * FitnessAppMockup — экран фитнес-трекера для iPhone mockup (Направление 2).
 * Тёмный premium, лайм-акцент, живое кольцо активности + бары шагов.
 */
const LIME = "#B6FF00";
const ORANGE = "#FC5C02";
const STEPS = [0.4, 0.6, 0.5, 0.8, 0.65, 0.9, 1.0];

export function FitnessAppMockup() {
  return (
    <div
      className="w-full h-full flex flex-col text-white"
      style={{
        background: "radial-gradient(120% 70% at 50% 0%, #0d140d 0%, #060806 45%, #000 100%)",
        fontFamily: "var(--font-jetbrains-mono), system-ui, sans-serif",
      }}
    >
      {/* status bar */}
      <div className="flex items-center justify-between px-[7%] pt-[3.5%] pb-[1%] text-[8px] font-medium text-white/90">
        <span>9:41</span>
        <div className="flex items-center gap-[3px]">
          <div className="flex items-end gap-[1px]">
            <div className="w-[2px] h-[3px] bg-white rounded-[1px]" /><div className="w-[2px] h-[4px] bg-white rounded-[1px]" /><div className="w-[2px] h-[5px] bg-white rounded-[1px]" /><div className="w-[2px] h-[6px] bg-white rounded-[1px]" />
          </div>
          <div className="ml-[2px] w-[15px] h-[7px] rounded-[2px] border border-white/80 relative"><div className="absolute inset-[1px] rounded-[1px] bg-white" style={{ width: "75%" }} /></div>
        </div>
      </div>

      {/* header */}
      <div className="px-[7%] pt-[4%] pb-[2%]">
        <div className="text-[7px] text-white/45 uppercase tracking-[0.14em]">Сегодня · вторник</div>
        <div className="text-[15px] font-bold text-white leading-none mt-[3px]">Моя активность</div>
      </div>

      {/* Кольцо активности */}
      <div className="flex items-center justify-center py-[4%]">
        <div className="relative" style={{ width: "130px", height: "130px" }}>
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <motion.circle
              initial={{ strokeDasharray: "0 100" }}
              animate={{ strokeDasharray: "78 22" }}
              transition={{ duration: 1.6, delay: 0.4, ease: [0.25, 1, 0.5, 1] }}
              cx="18" cy="18" r="15.9155" fill="none" stroke={LIME} strokeWidth="3" strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${LIME})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-bold leading-none" style={{ color: LIME, fontSize: "30px", fontFamily: "var(--font-benzin), system-ui" }}>78%</span>
            <span className="text-[7px] text-white/45 uppercase tracking-[0.1em] mt-1">цель дня</span>
          </div>
        </div>
      </div>

      {/* Метрики 3 в ряд */}
      <div className="grid grid-cols-3 gap-[3%] px-[6%] mb-[3%]">
        {[
          { icon: Footprints, val: "8 240", label: "шагов", c: LIME },
          { icon: Flame, val: "640", label: "ккал", c: ORANGE },
          { icon: Heart, val: "72", label: "пульс", c: LIME },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="rounded-xl p-[8%] flex flex-col gap-[4px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Icon className="w-[12px] h-[12px]" style={{ color: m.c }} />
              <span className="font-bold leading-none" style={{ color: "#fff", fontSize: "14px", fontFamily: "var(--font-benzin), system-ui" }}>{m.val}</span>
              <span className="text-[7px] text-white/40 uppercase tracking-[0.06em]">{m.label}</span>
            </div>
          );
        })}
      </div>

      {/* График шагов за неделю */}
      <div className="px-[6%] flex-1 min-h-0 flex flex-col">
        <div className="rounded-xl p-[5%] flex-1 flex flex-col" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-between mb-[8px]">
            <span className="text-[8px] text-white/55 uppercase tracking-[0.1em]">Шаги · неделя</span>
            <div className="flex items-center gap-[3px]" style={{ color: LIME }}>
              <Moon className="w-[8px] h-[8px]" />
              <span className="text-[7px]">сон 7ч 20м</span>
            </div>
          </div>
          <div className="flex items-end gap-[5px] flex-1" style={{ minHeight: "60px" }}>
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.08, ease: [0.25, 1, 0.5, 1] }}
                className="flex-1 rounded-t-[2px] origin-bottom"
                style={{ height: `${s * 100}%`, background: i === STEPS.length - 1 ? LIME : `${LIME}55` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[6px] text-white/30 mt-[5px] uppercase">
            <span>пн</span><span>вт</span><span>ср</span><span>чт</span><span>пт</span><span>сб</span><span>вс</span>
          </div>
        </div>
      </div>

      {/* Кнопка старт тренировки */}
      <div className="px-[6%] py-[4%]">
        <div className="rounded-full py-[3%] flex items-center justify-center gap-[6px]" style={{ background: LIME, boxShadow: `0 4px 16px ${LIME}40` }}>
          <Play className="w-[10px] h-[10px] text-black" fill="#000" />
          <span className="text-[9px] font-bold uppercase text-black tracking-[0.05em]">Начать тренировку</span>
        </div>
      </div>

      <div className="flex justify-center pb-[2%]">
        <div className="w-[28%] h-[3px] rounded-full bg-white/55" />
      </div>
    </div>
  );
}
