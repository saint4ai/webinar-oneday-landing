"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { NicheTag } from "../NicheTag";

/**
 * Слайд 43 · Боль — Руководитель. Текст 1-в-1 STRUCTURE 488-501.
 * Higgsfield-сцена (владелец смотрит на силуэты команды) + orange-pain фон.
 * Плавающие load-бейджи 80ч (перегруз) / 12ч (простой). Пара к Slide 44.
 */
const HIDDEN = ["кто перегружен", "у кого есть ресурс", "кто застрял и ждёт помощи", "где аврал", "где узкое место"];
const CONSEQ = [
  "Перегруженный выгорает и уходит через 3 месяца — а ты не успел его разгрузить.",
  "Узкие места тормозят всю команду — задачи стоят, а ты не видишь где.",
  "Не понимаешь, кому передать задачи, чтобы команда работала ровно.",
];

export function Slide_43_ManagerPain() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="28cqw"
      contentMinWidth={500}
      background={<SlideBg theme="dark" variant="orange-pain" />}
      leftObject={
        <div className="relative h-full w-full overflow-hidden">
          <Image src="/handouts/niches/pain_owner.png" alt="Владелец в стрессе пытается понять кто работает, а кто бездействует" fill className="object-cover object-center" sizes="35vw" priority />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 50%, rgba(10,11,15,0.55) 80%, #0A0B0F)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,11,15,0.5), transparent 30%)" }} />

          {/* load-бейджи поверх силуэтов */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: [0, 1, 1], y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="absolute top-[34%] left-[16%] rounded-lg px-2.5 py-1.5"
            style={{ background: "rgba(252,92,2,0.16)", border: "1px solid rgba(252,92,2,0.5)", backdropFilter: "blur(4px)" }}
          >
            <div className="font-bold text-sm leading-none" style={{ color: "#FC5C02" }}>80 ч/нед</div>
            <div className="text-[10px] text-white/60 mt-0.5">перегруз</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: [0, 1, 1], y: 0 }}
            transition={{ duration: 0.5, delay: 1.3 }}
            className="absolute top-[58%] left-[40%] rounded-lg px-2.5 py-1.5"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(4px)" }}
          >
            <div className="font-bold text-sm leading-none text-white/70">12 ч/нед</div>
            <div className="text-[10px] text-white/45 mt-0.5">есть ресурс</div>
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
        <NicheTag label="РУКОВОДИТЕЛЬ" tone="orange" />
        <span className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold" style={{ color: "#FC5C02" }}>// БОЛЬ</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.02em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 2.9cqw, 44px)" }}
      >
        КОМАНДА РАБОТАЕТ НЕРАВНОМЕРНО — <span style={{ color: "#FC5C02" }}>А ТЫ НЕ ВИДИШЬ ГДЕ ПОМОЧЬ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="text-white/65 text-sm md:text-base leading-snug max-w-xl mb-5"
      >
        Один пашет за троих и выгорает. Другой недогружен и теряет интерес.
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="text-white/55 text-sm leading-snug max-w-xl mb-2"
      >
        Asana, Bitrix, Jira показывают <span className="text-white/80">сколько задач закрыто</span>. Но не показывают:
      </motion.div>
      <div className="flex flex-wrap gap-2 max-w-xl mb-5">
        {HIDDEN.map((h, i) => (
          <motion.span
            key={h}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.75 + i * 0.1 }}
            className="text-xs px-2.5 py-1 rounded-md"
            style={{ background: "rgba(252,92,2,0.07)", border: "1px solid rgba(252,92,2,0.25)", color: "rgba(252,92,2,0.95)" }}
          >
            {h}
          </motion.span>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 max-w-xl">
        {CONSEQ.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 1.3 + i * 0.15 }}
            className="flex items-start gap-2 text-white/60 text-xs md:text-sm leading-snug"
          >
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#FC5C02" }} />
            {c}
          </motion.div>
        ))}
      </div>
    </SlideLayout>
  );
}
