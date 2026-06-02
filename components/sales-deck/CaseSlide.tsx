"use client";

import { motion } from "framer-motion";
import { SlideBg } from "./SlideBg";
import { SlideLayout } from "./SlideLayout";
import { BrandLogo } from "./BrandLogo";
import { ArrowDown } from "lucide-react";

export interface CaseSlideProps {
  caseNo: string;            // "1"
  name: string;              // "АЙДОС"
  sub: string;               // одна строка-подзаголовок
  screenshot: string;        // "/testimonials/aidos.png"
  handle: string;            // "Aidos · 22 мая"
  pain: string;              // Точка А (боль) — оранж
  result: string;            // Точка Б (результат) — лайм
  payoff: string;            // итоговый панч (лайм-плашка)
  chips?: string[];          // продукты/каналы
  stack?: string;            // тех-стек (mono)
  variant?: "aura-tl" | "aura-tr" | "lime-right" | "climax";
  objectColumnSize?: string;
}

/**
 * CaseSlide — слайд кейса ученика (Часть IX).
 * Слева — реальный TG-скрин (object-contain, не кроп), справа — имя + боль→результат + панч.
 * Зона спикера справа сохраняется через SlideLayout.
 */
export function CaseSlide({
  caseNo,
  name,
  sub,
  screenshot,
  handle,
  pain,
  result,
  payoff,
  chips,
  stack,
  variant = "aura-tl",
  objectColumnSize = "34vw",
}: CaseSlideProps) {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize={objectColumnSize}
      contentMinWidth={460}
      background={<SlideBg theme="dark" variant={variant} />}
      leftObject={
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
          className="relative rounded-2xl overflow-hidden w-full"
          style={{
            border: "1px solid rgba(182,255,0,0.28)",
            background: "rgba(255,255,255,0.03)",
            boxShadow: "0 40px 90px -32px rgba(0,0,0,0.75), 0 0 60px -24px rgba(182,255,0,0.25)",
          }}
        >
          <div
            className="flex items-center gap-2 px-3.5 py-2"
            style={{ background: "rgba(182,255,0,0.07)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <BrandLogo name="telegram" alt="Telegram" className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px] tracking-[0.06em] text-white/60">{handle}</span>
            <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.14em] text-[#B6FF00]/70">реальный кейс</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshot}
            alt={`Кейс — ${name}`}
            draggable={false}
            className="w-full block"
            style={{ maxHeight: "64vh", objectFit: "contain", background: "#0b0e0a" }}
          />
        </motion.div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // КЕЙС {caseNo}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[0.95] tracking-[-0.03em] mb-2 whitespace-nowrap"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 2.9vw, 46px)" }}
      >
        {name}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="text-white/70 text-sm md:text-base leading-snug max-w-xl mb-5"
      >
        {sub}
      </motion.div>

      {/* Боль → результат */}
      <div className="flex flex-col gap-0 max-w-xl mb-4">
        <motion.div
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-xl px-4 py-3"
          style={{ background: "rgba(252,92,2,0.07)", border: "1px solid rgba(252,92,2,0.28)" }}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#FC5C02] mb-1">было</div>
          <div className="text-white/80 text-sm leading-snug">{pain}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="self-center my-1.5"
        >
          <ArrowDown className="w-5 h-5 text-[#B6FF00]" strokeWidth={2.5} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="rounded-xl px-4 py-3"
          style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.35)", boxShadow: "0 0 50px -18px rgba(182,255,0,0.5)" }}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#B6FF00] mb-1">стало</div>
          <div className="text-white text-sm md:text-base leading-snug font-medium">{result}</div>
        </motion.div>
      </div>

      {/* Продукты-чипы */}
      {chips && chips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.05 }}
          className="flex flex-wrap gap-2 max-w-xl mb-3"
        >
          {chips.map((c) => (
            <span key={c} className="rounded-lg px-2.5 py-1.5 text-white/85 text-xs font-medium" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
              {c}
            </span>
          ))}
        </motion.div>
      )}

      {/* Панч + стек */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="max-w-xl"
      >
        <div className="text-white/80 text-sm md:text-base leading-snug">
          <span className="text-[#B6FF00] font-semibold">{payoff}</span>
        </div>
        {stack && (
          <div className="font-mono text-[11px] text-white/40 mt-1.5">{stack}</div>
        )}
      </motion.div>
    </SlideLayout>
  );
}
