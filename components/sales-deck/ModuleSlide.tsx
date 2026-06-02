"use client";

import { motion } from "framer-motion";
import { SlideBg } from "./SlideBg";
import { SlideLayout } from "./SlideLayout";

/**
 * ModuleSlide — слайд МОДУЛЯ программы (DL-2 swiss). Пара со ModuleResultSlide (модуль → результат).
 * Гигант-ghost номер + «МОДУЛЬ N» + title + бейдж + обещание + ДЕТАЛЬНЫЙ список уроков.
 * Уроки 1-в-1 из course/vibe_coding_pro/program.md (только названия — без «секретного соуса»: имён скиллов/MCP/сервисов).
 */
export interface ModuleSlideProps {
  no: string;        // "01"
  lessons: string;   // бейдж: "4 урока"
  title: string;     // "ЗАПУСК ДВИГАТЕЛЯ"
  promise: string;   // подзаголовок-обещание (Sub из STRUCTURE)
  items: string[];   // названия уроков (детализация)
  variant?: "aura-tl" | "aura-tr" | "lime-right" | "dual-bottom" | "climax";
}

export function ModuleSlide({ no, lessons, title, promise, items, variant = "aura-tl" }: ModuleSlideProps) {
  const twoCols = items.length > 5;
  return (
    <SlideLayout speakerSide="right" contentMinWidth={820} background={<SlideBg theme="dark" variant={variant} />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // ПРОГРАММА · VIBE CODING PRO
      </motion.div>

      <div className="flex items-center gap-5 md:gap-7 mb-4">
        <motion.span
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
          className="font-bold leading-[0.8] shrink-0 select-none"
          style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(56px, 7vw, 116px)", color: "transparent", WebkitTextStroke: "2px rgba(182,255,0,0.5)" }}
        >
          {no}
        </motion.span>
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-white/55">Модуль {no}</span>
            <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#B6FF00]" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.3)" }}>{lessons}</span>
          </div>
          <h1 className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em]" style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 3vw, 48px)" }}>
            {title}
          </h1>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }} className="max-w-3xl pt-3.5 mb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
        <div className="text-white/70 text-base md:text-lg font-light leading-snug">{promise}</div>
      </motion.div>

      {/* Детальный список уроков */}
      <div className={`grid ${twoCols ? "grid-cols-2 gap-x-7 gap-y-2" : "grid-cols-1 gap-y-2"} max-w-3xl`}>
        {items.map((lesson, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 + i * 0.07 }}
            className="flex items-start gap-2.5"
          >
            <span
              className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center font-bold text-[11px] leading-none mt-0.5"
              style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.3)", color: "#B6FF00", fontFamily: "var(--font-benzin), system-ui" }}
            >
              {i + 1}
            </span>
            <span className="text-white/85 text-sm md:text-[15px] leading-snug">{lesson}</span>
          </motion.div>
        ))}
      </div>
    </SlideLayout>
  );
}
