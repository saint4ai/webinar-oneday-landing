"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Zap, Layers, BarChart3, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Блок C · Смысл — доход ×3,5 через эффективность.
 * Симметричная схема: 3 зоны слева + хаб «ТЫ+AI» + 3 зоны справа. Без наложений и обрезки.
 * ⚠ «3,5×» — со слов Александра (иллюстрация), источник на проверку.
 */
type Zone = { Icon: LucideIcon; zone: string; benefit: string };
const LEFT: Zone[] = [
  { Icon: CheckCircle2, zone: "КАЧЕСТВО", benefit: "меньше ошибок" },
  { Icon: Sparkles, zone: "УМЕНИЯ", benefit: "собираешь сам" },
  { Icon: Clock, zone: "СВОБОДА", benefit: "рутина на ИИ" },
];
const RIGHT: Zone[] = [
  { Icon: Zap, zone: "СКОРОСТЬ", benefit: "час вместо дня" },
  { Icon: Layers, zone: "ОБЪЁМ", benefit: "больше задач" },
  { Icon: BarChart3, zone: "РЕШЕНИЯ", benefit: "данные → выводы" },
];

function ZoneCard({ z, reverse, delay }: { z: Zone; reverse: boolean; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: reverse ? -16 : 16, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.34, 1.3, 0.64, 1] }}
      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 ${reverse ? "flex-row-reverse" : ""}`}
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(182,255,0,0.3)", boxShadow: "0 12px 30px -18px rgba(0,0,0,0.6)" }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(182,255,0,0.12)", border: "1px solid rgba(182,255,0,0.4)" }}>
        <z.Icon className="w-[18px] h-[18px] text-[#B6FF00]" strokeWidth={2.2} />
      </div>
      <div className={`min-w-0 leading-tight ${reverse ? "text-right" : ""}`}>
        <div className="font-bold text-white text-sm uppercase tracking-[0.02em]" style={{ fontFamily: "var(--font-benzin), system-ui" }}>{z.zone}</div>
        <div className="text-white/55 text-[12px]">{z.benefit}</div>
      </div>
    </motion.div>
  );
}

export function Slide_Smysl3b_Earn35x() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={820} background={<SlideBg theme="dark" variant="aura-tr" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-2">
        // ПОЧЕМУ ОДНИ РАСТУТ, А ДРУГИЕ СТОЯТ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3.3vw, 52px)", paddingTop: "0.06em" }}
      >
        СО ЗНАНИЕМ AI — В <span className="text-[#B6FF00]">3,5× БОЛЬШЕ</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/70 text-sm md:text-base leading-snug max-w-2xl mb-6">
        Не умнее — <span className="text-white font-semibold">эффективнее</span>. Вайбкодинг усиливает сразу 6 зон:
      </motion.div>

      {/* Симметричная схема: 3 слева · хаб · 3 справа */}
      <div className="grid items-center gap-x-5 md:gap-x-8 w-full max-w-4xl mb-6" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        <div className="flex flex-col gap-3">
          {LEFT.map((z, i) => <ZoneCard key={z.zone} z={z} reverse delay={0.55 + i * 0.1} />)}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.45, ease: [0.34, 1.4, 0.64, 1] }}
          className="flex flex-col items-center justify-center rounded-full text-center shrink-0"
          style={{ width: 150, height: 150, background: "radial-gradient(circle, rgba(182,255,0,0.22), rgba(182,255,0,0.06) 70%)", border: "2px solid #B6FF00", boxShadow: "0 0 60px -8px rgba(182,255,0,0.6)" }}
        >
          <span className="font-bold uppercase text-white leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 28 }}>ТЫ</span>
          <span className="font-bold uppercase leading-none mt-1" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 24, color: "#B6FF00" }}>+ AI</span>
        </motion.div>

        <div className="flex flex-col gap-3">
          {RIGHT.map((z, i) => <ZoneCard key={z.zone} z={z} reverse={false} delay={0.55 + i * 0.1} />)}
        </div>
      </div>

      {/* Контраст ×1 vs ×3,5 */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.3 }} className="flex items-center gap-3 flex-wrap text-sm md:text-base max-w-4xl">
        <span className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-white/45" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <span className="font-bold" style={{ fontFamily: "var(--font-benzin), system-ui" }}>×1</span> кто не учит AI — всё вручную: дольше, меньше
        </span>
        <span className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-white" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.42)" }}>
          <span className="font-bold text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui" }}>×3,5</span> ты — успеваешь и берёшь больше
        </span>
      </motion.div>
    </SlideLayout>
  );
}
