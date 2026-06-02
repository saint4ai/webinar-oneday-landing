"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд-напоминание о бонусах ПОСЛЕ практики (R6-bonus-reminder).
 * 3 бесплатных бонуса ЗА ДОСМОТР (Higgsfield-карточки) + ценность каждого.
 * 4-й бонус (за отметку в сторис — ИИ-креаторство) озвучивается ОТДЕЛЬНО на своём слайде, сюда не входит.
 */
const BONUSES = [
  { img: "/cards-gifs-screenshots/bonus/bonus-watch1-android.png", val: "30 000 ₸" },
  { img: "/cards-gifs-screenshots/bonus/bonus-watch2-prompts.png", val: "20 000 ₸" },
  { img: "/cards-gifs-screenshots/bonus/bonus-watch3-checklist.png", val: "25 000 ₸" },
];

export function Slide_BonusReminder() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={820} background={<SlideBg theme="dark" variant="dual-bottom" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // НЕ ЗАБУДЬ ЗАБРАТЬ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3.4vw, 52px)" }}
      >
        НАПОМИНАЮ ПРО <span className="text-[#B6FF00]">3 БОНУСА</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mb-6">
        Ты уже собрал приложение. А в конце эфира забираешь ещё это — бесплатно, просто за то, что досмотрел:
      </motion.div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-[940px]">
        {BONUSES.map((b, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, delay: 0.5 + i * 0.15, ease: [0.34, 1.3, 0.64, 1] }} className="flex flex-col items-center gap-2.5">
            <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: "4 / 5", background: "#ffffff", border: "1px solid rgba(182,255,0,0.3)", boxShadow: "0 24px 60px -28px rgba(0,0,0,0.6), 0 0 50px -26px rgba(182,255,0,0.3)" }}>
              <Image src={b.img} alt="Бонус за досмотр" fill className="object-contain" sizes="30vw" priority={i === 0} />
            </div>
            <div className="rounded-md px-3 py-1 text-[13px] font-semibold text-[#B6FF00]" style={{ background: "rgba(182,255,0,0.12)", border: "1px solid rgba(182,255,0,0.3)" }}>
              ценность {b.val}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.1 }} className="inline-flex items-center gap-3 rounded-xl px-4 py-2.5 self-start mt-6" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}>
        <span className="text-white/85 text-sm md:text-base">Все 3 — <span className="text-[#B6FF00] font-semibold">бесплатно</span>. Условие одно: досмотри эфир до конца.</span>
      </motion.div>
    </SlideLayout>
  );
}
