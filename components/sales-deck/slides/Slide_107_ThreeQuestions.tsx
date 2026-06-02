"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 107 · «У вас в голове 3 вопроса». Текст 1-в-1 STRUCTURE 1330-1339.
 * DESIGN-LANGUAGE: DL-3 editorial × DL-5 cinematic (см. references/DESIGN_LANGUAGES.md).
 * НЕ дефолт-сетка: гигантские ghost-номера outline + вопросы во всю ширину + hairline-линии +
 * dot-grid текстура + шторный clip-path reveal. Оранж-кикер (возражение = оранж-семантика).
 */
const QUESTIONS = [
  { n: "01", q: "А Я", hl: "СМОГУ?" },
  { n: "02", q: "А РЕАЛЬНО ЛИ", hl: "ЗАРАБОТАТЬ?" },
  { n: "03", q: "СКОЛЬКО СТОИТ И ГДЕ ВЗЯТЬ", hl: "ВРЕМЯ?" },
];

export function Slide_107_ThreeQuestions() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={760}
      background={
        <>
          <SlideBg theme="dark" variant="orange-pain" />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              maskImage: "radial-gradient(ellipse 85% 75% at 28% 42%, #000 38%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 85% 75% at 28% 42%, #000 38%, transparent 100%)",
            }}
          />
        </>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#FC5C02] mb-3">
        // ДАВАЙТЕ ЧЕСТНО — Я ЗНАЮ КАКИЕ
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }} className="text-white/50 font-mono text-xs uppercase tracking-[0.2em] mb-5">
        У вас сейчас в голове
      </motion.div>

      <div className="flex flex-col max-w-3xl">
        {QUESTIONS.map((item, i) => (
          <motion.div
            key={item.n}
            initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.28, ease: [0.25, 1, 0.5, 1] }}
            className="relative flex items-center gap-5 py-4"
            style={{ borderTop: i === 0 ? "1px solid rgba(255,255,255,0.12)" : undefined, borderBottom: "1px solid rgba(255,255,255,0.12)" }}
          >
            <span
              className="font-bold leading-none shrink-0 select-none"
              style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(46px, 6vw, 92px)", color: "transparent", WebkitTextStroke: "1.5px rgba(182,255,0,0.45)" }}
            >
              {item.n}
            </span>
            <span
              className="font-bold uppercase text-white leading-[0.98] tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(22px, 2.8vw, 40px)" }}
            >
              {item.q} <span className="text-[#B6FF00]">{item.hl}</span>
            </span>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.35 }} className="text-white/60 text-sm md:text-base mt-6 max-w-2xl">
        Разберёмся по очереди — <span className="text-white/90 font-medium">коротко, без воды.</span>
      </motion.div>
    </SlideLayout>
  );
}
