"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Mic, ArrowRight, Zap, Lock, Gift } from "lucide-react";

/**
 * Слайд 85 · OpenWhisper — голос вместо клавиатуры. Текст 1-в-1 STRUCTURE 1040-1048.
 */
const PERKS = [
  { icon: Zap, t: "в 3 раза быстрее" },
  { icon: Lock, t: "локально — не в облако" },
  { icon: Gift, t: "бесплатно" },
];

// демо-команда, которую «надиктовали» голосом → печатается в окно агента
const COMMAND = "Собери лендинг для кофейни — онлайн-запись и тёмная тема";

export function Slide_85_OpenWhisper() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={740}
      background={<SlideBg theme="dark" variant="aura-tr" />}
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ГОЛОС ВМЕСТО КЛАВИАТУРЫ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(32px, 4cqw, 64px)" }}
      >
        + <span className="text-[#B6FF00]">OPENWHISPER</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-base md:text-lg leading-snug max-w-2xl mb-7">
        Бесплатное приложение, превращает голос в текст для агента. Зажал кнопку — наговорил — текст сам в чате Claude Code.
      </motion.div>

      {/* Запись → контекстное окно агента */}
      <div className="flex items-center gap-4 md:gap-6 mb-7 max-w-3xl">
        {/* Модуль записи */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="flex flex-col items-center gap-3 rounded-2xl px-6 py-5 shrink-0" style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.35)" }}>
          <div className="relative">
            <motion.span animate={{ scale: [1, 1.55], opacity: [0.5, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }} className="absolute inset-0 rounded-full" style={{ border: "2px solid #B6FF00" }} />
            <span className="relative w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(182,255,0,0.15)", border: "1px solid rgba(182,255,0,0.5)" }}>
              <Mic className="w-6 h-6 text-[#B6FF00]" strokeWidth={1.8} />
            </span>
          </div>
          <div className="flex items-end gap-0.5 h-6">
            {[40, 80, 55, 100, 65, 85, 45, 70, 50].map((h, i) => (
              <motion.span key={i} animate={{ height: [`${h * 0.35}%`, `${h}%`, `${h * 0.35}%`] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }} className="w-1 rounded-full" style={{ background: "#B6FF00" }} />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full" style={{ background: "#FC5C02" }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">запись</span>
          </div>
        </motion.div>

        {/* Трансформация */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <ArrowRight className="w-7 h-7 text-[#B6FF00]" strokeWidth={2.5} />
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">OpenWhisper</span>
        </div>

        {/* Контекстное окно — промпт Claude Code (печатается голосом) */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.9 }} className="flex-1 min-w-0 rounded-xl overflow-hidden" style={{ background: "#0b0e0a", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 20px 50px -20px rgba(0,0,0,0.65)" }}>
          <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <span className="flex gap-1"><span className="w-2 h-2 rounded-full bg-[#ff5f57]" /><span className="w-2 h-2 rounded-full bg-[#ffbd2e]" /><span className="w-2 h-2 rounded-full bg-[#28c840]" /></span>
            <span className="font-mono text-[10px] text-white/45 ml-1">Claude Code · контекстное окно</span>
          </div>
          <div className="px-3.5 py-3 font-mono text-sm md:text-[15px] leading-relaxed">
            <span className="text-[#B6FF00]">&gt; </span>
            {COMMAND.split("").map((ch, i) => (
              <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 + i * 0.045, duration: 0.01 }} className="text-white/90">{ch}</motion.span>
            ))}
            <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.9, repeat: Infinity }} className="inline-block w-[2px] h-[1.1em] align-middle ml-0.5" style={{ background: "#B6FF00" }} />
          </div>
        </motion.div>
      </div>

      <div className="flex flex-wrap gap-3">
        {PERKS.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.div key={p.t} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 1.4 + i * 0.12 }} className="flex items-center gap-2 rounded-lg px-3.5 py-2" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.22)" }}>
              <Icon className="w-4 h-4 text-[#B6FF00] shrink-0" strokeWidth={1.9} />
              <span className="text-white/85 text-sm font-medium">{p.t}</span>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}
