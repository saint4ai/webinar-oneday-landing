"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { User } from "lucide-react";

/**
 * Блок C · Смысл 1 — актуальность. После 129 (390), перед Smysl1_Proof.
 * НЕочевидный разворот: не нейросеть заберёт работу, а тот, кто её освоил. Пиктограмма «1 из 7».
 * ⚠ Все цифры — KZ-СМИ (energyprom/inform/finance/astanatimes), подсветить Александру.
 */
const STATS = [
  { v: "23%", t: "используют ИИ для рабочих задач" },
  { v: "60%", t: "банков второго уровня внедрили ИИ" },
  { v: "+25%", t: "пользователей за пару месяцев" },
];

export function Slide_Smysl1_Relevance() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={780} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ПОЧЕМУ ИМЕННО СЕЙЧАС
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.03em] mb-6"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 2.9vw, 46px)" }}
      >
        НЕ НЕЙРОСЕТЬ ЗАБЕРЁТ ТВОЮ РАБОТУ — <span className="text-[#B6FF00]">ЗАБЕРЁТ ТОТ, КТО ЕЁ ОСВОИЛ</span>
      </motion.h1>

      {/* Пиктограмма 1 из 7 */}
      <div className="flex items-center gap-5 mb-6 flex-wrap">
        <div className="flex items-end gap-2">
          {Array.from({ length: 7 }).map((_, i) => {
            const active = i === 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.5 + i * 0.08, ease: [0.25, 1, 0.5, 1] }}
                className="flex items-center justify-center rounded-xl"
                style={{
                  width: 46, height: 56,
                  background: active ? "rgba(182,255,0,0.14)" : "rgba(255,255,255,0.04)",
                  border: active ? "1.5px solid rgba(182,255,0,0.6)" : "1px solid rgba(255,255,255,0.1)",
                  boxShadow: active ? "0 0 34px -6px rgba(182,255,0,0.55)" : "none",
                }}
              >
                <User className="w-6 h-6" strokeWidth={2.2} style={{ color: active ? "#B6FF00" : "rgba(255,255,255,0.28)" }} />
              </motion.div>
            );
          })}
        </div>
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 1.1 }} className="flex flex-col">
          <span className="font-bold leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(20px,2vw,32px)", color: "#fff" }}>каждый седьмой</span>
          <span className="text-white/55 text-sm md:text-base leading-tight mt-1">работающий казахстанец уже использует ИИ</span>
        </motion.div>
      </div>

      {/* Чипсы поддержки */}
      <div className="flex flex-wrap gap-2.5 mb-6">
        {STATS.map((s, i) => (
          <motion.div key={s.v} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 1.25 + i * 0.12 }} className="flex items-center gap-2.5 rounded-xl px-4 py-2.5" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.25)" }}>
            <span className="font-bold text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(18px,1.7vw,26px)" }}>{s.v}</span>
            <span className="text-white/70 text-xs md:text-sm max-w-[160px] leading-tight">{s.t}</span>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.7 }} className="text-white/85 text-base md:text-lg leading-snug max-w-2xl">
        Вопрос не «заменит ли AI». Вопрос — <span className="text-[#B6FF00] font-semibold">успеешь ли ты в первую волну</span>, пока большинство думает, что это сложно.
      </motion.div>
    </SlideLayout>
  );
}
