"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { NicheTag } from "../NicheTag";
import { Clock } from "lucide-react";

/**
 * Слайд 47 · Боль — HR. Текст 1-в-1 STRUCTURE 555-567.
 * Higgsfield-сцена (уставший HR + стопка резюме) + orange-pain фон.
 * Часы-оверлей 12:00 → 24:00. Пара к Slide 48 (решение).
 */
const POINTS = [
  ["200 откликов", "вахта на Тенгиз через hh.kz"],
  ["12 часов", "HR читает каждое резюме"],
  ["только 20", "реально подходят (допуск, опыт, язык)"],
  ["180 — мусор", "откликаются на всё подряд"],
];

export function Slide_47_HRPain() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="28vw"
      contentMinWidth={500}
      background={<SlideBg theme="dark" variant="orange-pain" />}
      leftObject={
        <div className="relative h-screen w-full overflow-hidden">
          <Image src="/handouts/niches/pain_hr.png" alt="Уставший HR со стопкой резюме" fill className="object-cover object-center" sizes="35vw" priority />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 50%, rgba(10,11,15,0.55) 80%, #0A0B0F)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,11,15,0.5), transparent 30%)" }} />

          {/* часы-оверлей */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="absolute top-[10%] left-[10%] flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={{ background: "rgba(252,92,2,0.16)", border: "1px solid rgba(252,92,2,0.5)", backdropFilter: "blur(4px)" }}
          >
            <Clock className="w-4 h-4" strokeWidth={2.2} style={{ color: "#FC5C02" }} />
            <span className="font-mono font-bold text-sm" style={{ color: "#FC5C02" }}>12:00 → 24:00</span>
          </motion.div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center gap-3 mb-3"
      >
        <NicheTag label="HR" tone="orange" />
        <span className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold" style={{ color: "#FC5C02" }}>// БОЛЬ</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.02em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(23px, 2.7vw, 41px)" }}
      >
        HR ПЕРЕЧИТЫВАЕТ 200 РЕЗЮМЕ ВРУЧНУЮ — <span style={{ color: "#FC5C02" }}>НЕДЕЛЯ НА ПЕРВЫЙ ЗВОНОК</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="text-white/65 text-sm md:text-base leading-snug max-w-xl mb-6"
      >
        Каждое резюме — 3-5 минут. 200 откликов — 12-16 часов чистого чтения. И большинство — не то.
      </motion.div>

      {/* 4 факта */}
      <div className="grid grid-cols-2 gap-3 max-w-xl mb-6">
        {POINTS.map((p, i) => (
          <motion.div
            key={p[0]}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.6 + i * 0.12 }}
            className="rounded-xl px-3.5 py-2.5"
            style={{ background: i === 3 ? "rgba(252,92,2,0.07)" : "rgba(255,255,255,0.03)", border: `1px solid ${i === 3 ? "rgba(252,92,2,0.28)" : "rgba(255,255,255,0.07)"}` }}
          >
            <div className="font-bold leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(18px,1.7vw,26px)", color: i === 3 ? "#FC5C02" : "#FFFFFF" }}>{p[0]}</div>
            <div className="text-white/50 text-[11px] md:text-xs mt-1 leading-tight">{p[1]}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="text-white/45 text-xs md:text-sm leading-snug max-w-xl"
      >
        Пока HR доходит до 20 целевых — они уже устроились в другом месте. Вакансия висит ещё месяц.
      </motion.div>
    </SlideLayout>
  );
}
