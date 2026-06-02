"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 104 · Кейс 5 — Я (Александр). Текст по STRUCTURE 1291-1302.
 * Кульминация галереи кейсов — автор. Слот под скрин платформы onAI (добавит Александр).
 */
const STATS = [
  { v: "3 мес", l: "срок" },
  { v: "1", l: "человек" },
  { v: "$1800", l: "на ИИ-разработку" },
  { v: "250+", l: "учатся на платформе" },
];

export function Slide_104_CaseAuthor() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="34vw"
      contentMinWidth={460}
      background={<SlideBg theme="dark" variant="climax" />}
      leftObject={
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
          className="relative w-full rounded-2xl overflow-hidden border flex flex-col"
          style={{ aspectRatio: "16 / 10", borderColor: "rgba(182,255,0,0.32)", background: "#0b0e0a", boxShadow: "0 30px 70px -28px rgba(0,0,0,0.7), 0 0 60px -26px rgba(182,255,0,0.3)" }}
        >
          <div className="flex items-center gap-2 px-3.5 py-2 shrink-0" style={{ background: "rgba(182,255,0,0.07)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-2 font-mono text-[11px] text-white/45">onai.academy</span>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/handouts/screens/platform_onai.png" alt="Платформа onAI.academy" className="w-full h-full object-contain" />
          </div>
        </motion.div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // КЕЙС 5 · АВТОР
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[0.98] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(34px, 4.2vw, 64px)" }}
      >
        И Я <span className="text-[#B6FF00]">ТАКОЙ ЖЕ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/70 text-sm md:text-base leading-snug max-w-xl mb-5">
        Свою школу onAI.academy собрал за 3 месяца. Один. То, что вы видите вокруг — собрано тем же методом.
      </motion.div>

      <div className="flex flex-col gap-0 max-w-xl mb-4">
        <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="rounded-xl px-4 py-3" style={{ background: "rgba(252,92,2,0.07)", border: "1px solid rgba(252,92,2,0.28)" }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#FC5C02] mb-1">было</div>
          <div className="text-white/80 text-sm leading-snug">GetCourse + сторонние AI-сервисы — 200-300К ₸/мес. И всё равно нет нормальной аналитики и AI-наставника 24/7.</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.75 }} className="rounded-xl px-4 py-3 mt-2" style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.35)", boxShadow: "0 0 50px -18px rgba(182,255,0,0.5)" }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#B6FF00] mb-1">стало</div>
          <div className="text-white text-sm md:text-base leading-snug font-medium">Собственная платформа: AI-куратор 24/7, аналитика прогресса, геймификация и достижения, персональный путь.</div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.0 }} className="flex flex-wrap gap-2 max-w-xl">
        {STATS.map((s) => (
          <div key={s.l} className="rounded-lg px-3 py-1.5 flex items-baseline gap-1.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <span className="font-bold text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 16 }}>{s.v}</span>
            <span className="text-white/50 text-[11px]">{s.l}</span>
          </div>
        ))}
      </motion.div>
    </SlideLayout>
  );
}
