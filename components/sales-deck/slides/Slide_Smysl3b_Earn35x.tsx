"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Zap, Layers, BarChart3, Clock, Sparkles, CheckCircle2 } from "lucide-react";

/**
 * Блок C · Смысл — доход ×3,5 через эффективность. Этап продажи, после Smysl3_Career.
 * Mind map: вайбкодинг усиливает 6 человеческих зон → специалист с AI делает больше и эффективнее.
 * Контраст с теми, кто не учит AI (×1, всё вручную).
 * ⚠ «3,5×» — со слов Александра, подсветить (иллюстрация рынка, источник на проверку).
 */
const W = 820;
const H = 350;
const CX = W / 2;
const CY = H / 2;

const ZONES = [
  { Icon: Zap, zone: "СКОРОСТЬ", benefit: "час вместо дня", x: CX, y: 34 },
  { Icon: Layers, zone: "ОБЪЁМ", benefit: "больше задач", x: W - 92, y: 118 },
  { Icon: BarChart3, zone: "РЕШЕНИЯ", benefit: "данные → выводы", x: W - 92, y: H - 118 },
  { Icon: Clock, zone: "СВОБОДА", benefit: "рутина на ИИ", x: CX, y: H - 34 },
  { Icon: Sparkles, zone: "УМЕНИЯ", benefit: "собираешь сам", x: 92, y: H - 118 },
  { Icon: CheckCircle2, zone: "КАЧЕСТВО", benefit: "меньше ошибок", x: 92, y: 118 },
];

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

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/70 text-sm md:text-base leading-snug max-w-2xl mb-4">
        Не умнее — <span className="text-white font-semibold">эффективнее</span>. Вайбкодинг усиливает сразу 6 зон:
      </motion.div>

      {/* Mind map: хаб + 6 зон */}
      <div className="relative mb-4" style={{ width: W, maxWidth: "100%", height: H }}>
        {/* связи */}
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none" aria-hidden>
          {ZONES.map((z, i) => (
            <motion.line
              key={i}
              x1={CX} y1={CY} x2={z.x} y2={z.y}
              stroke="rgba(182,255,0,0.35)" strokeWidth={1.5}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 + i * 0.08 }}
            />
          ))}
        </svg>

        {/* хаб */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.45, ease: [0.34, 1.4, 0.64, 1] }}
          className="absolute flex flex-col items-center justify-center rounded-full text-center"
          style={{ left: CX, top: CY, width: 150, height: 150, transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(182,255,0,0.22), rgba(182,255,0,0.06) 70%)", border: "2px solid #B6FF00", boxShadow: "0 0 60px -10px rgba(182,255,0,0.6)" }}
        >
          <span className="font-bold uppercase text-white leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 26 }}>ТЫ</span>
          <span className="font-bold uppercase leading-none mt-1" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 22, color: "#B6FF00" }}>+ AI</span>
        </motion.div>

        {/* узлы-зоны */}
        {ZONES.map((z, i) => (
          <motion.div
            key={z.zone}
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, delay: 0.7 + i * 0.09, ease: [0.34, 1.3, 0.64, 1] }}
            className="absolute flex items-center gap-2.5 rounded-xl px-3 py-2"
            style={{ left: z.x, top: z.y, transform: "translate(-50%,-50%)", width: 168, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(182,255,0,0.3)", boxShadow: "0 12px 30px -16px rgba(0,0,0,0.6)" }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(182,255,0,0.12)", border: "1px solid rgba(182,255,0,0.4)" }}>
              <z.Icon className="w-4 h-4 text-[#B6FF00]" strokeWidth={2.2} />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="font-bold text-white text-[13px] uppercase tracking-[0.02em] truncate" style={{ fontFamily: "var(--font-benzin), system-ui" }}>{z.zone}</div>
              <div className="text-white/55 text-[11px] truncate">{z.benefit}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Контраст ×1 vs ×3,5 */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.5 }} className="flex items-center gap-3 flex-wrap text-sm md:text-base max-w-3xl">
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
