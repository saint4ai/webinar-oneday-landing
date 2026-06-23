"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { QrCode, AtSign, Gift } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Слайд (после 166) · Как забрать сторис-бонус: скан QR → отметка + обратная связь → курс по вирусному контенту через AI.
 * Текст-правка Александра. Финальный дизайн-слайд Александр пришлёт отдельно — пока рабочая версия с QR.
 */
const STEPS: { Icon: LucideIcon; t: string }[] = [
  { Icon: QrCode, t: "Сканируй мой QR-код — это мой Instagram" },
  { Icon: AtSign, t: "Отметь меня в сторис и напиши обратную связь по воркшопу" },
  { Icon: Gift, t: "Я выдаю тебе обучение по созданию вирусного контента через ИИ" },
];

export function Slide_StoriesBonusHowTo() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="26cqw"
      contentMinWidth={500}
      background={<SlideBg theme="dark" variant="lime-right" />}
      leftObject={
        <div className="flex flex-col items-center gap-3 w-full">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3, ease: [0.34, 1.3, 0.64, 1] }} className="rounded-2xl overflow-hidden bg-white p-2.5" style={{ border: "1px solid rgba(182,255,0,0.45)", boxShadow: "0 0 60px -14px rgba(182,255,0,0.5)" }}>
            <Image src="/handouts/insta-qr.jpg" alt="QR Instagram @saint4ai" width={708} height={714} className="block" style={{ width: 210, height: 210 }} />
          </motion.div>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#B6FF00]">сканируй · @saint4ai</span>
        </div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // КАК ЗАБРАТЬ СТОРИС-БОНУС
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.03em] mb-5"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 3cqw, 46px)" }}
      >
        ВИРУСНЫЙ КОНТЕНТ ЧЕРЕЗ AI — <span className="text-[#B6FF00]">В ПОДАРОК</span>
      </motion.h1>

      <div className="flex flex-col gap-3 max-w-xl">
        {STEPS.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.4 + i * 0.15 }} className="flex items-center gap-3.5 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.3)" }}>
              <s.Icon className="w-5 h-5 text-[#B6FF00]" strokeWidth={2} />
            </div>
            <span className="text-white/90 text-sm md:text-base leading-snug">{s.t}</span>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.0 }} className="text-white/25 text-[10px] mt-4">
        [финальный дизайн-слайд — Александр пришлёт]
      </motion.div>
    </SlideLayout>
  );
}
