"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Check } from "lucide-react";

/**
 * Слайд 64 · Engagement — «ПОНЯТНО ЧТО РЫНОК ЕСТЬ?». Текст 1-в-1 STRUCTURE 787-791.
 * Стопка 9 карточек-пруфов раскладывается (stagger + лёгкий разворот).
 */
const PROOFS = [
  "более 2 млн бизнесов в KZ",
  "13 млн в СНГ",
  "Threads ищет вас",
  "6 каналов клиентов",
  "300–500К за сервис",
  "7–14 дней до запуска",
  "ниша только зарождается",
  "рынка хватит всем",
];

export function Slide_64_MarketEngagement() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={720}
      background={<SlideBg theme="dark" variant="dual-bottom" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ВОПРОС В ЧАТ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(32px, 4.2cqw, 68px)" }}
      >
        ПОНЯТНО ЧТО <span className="text-[#B6FF00]">РЫНОК ЕСТЬ?</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/65 text-base md:text-lg leading-snug mb-7"
      >
        Напишите в чат — было сомнение?
      </motion.div>

      {/* 9 карточек-пруфов раскладываются */}
      <div className="grid grid-cols-3 gap-2.5 max-w-3xl">
        {PROOFS.map((p, i) => (
          <motion.div
            key={p}
            initial={{ opacity: 0, y: 24, rotate: -4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.55 + i * 0.08, ease: [0.34, 1.4, 0.64, 1] }}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.2)" }}
          >
            <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: "rgba(182,255,0,0.16)" }}>
              <Check className="w-3 h-3 text-[#B6FF00]" strokeWidth={3} />
            </span>
            <span className="text-white/85 text-xs md:text-sm leading-tight">{p}</span>
          </motion.div>
        ))}
      </div>
    </SlideLayout>
  );
}
