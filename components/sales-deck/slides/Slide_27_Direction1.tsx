"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";
import { AnalyticsDashboard } from "../AnalyticsDashboard";

/**
 * Слайд 27 · Направление 1 — свой сервис на продажу.
 * Layout «текст сверху + дашборд снизу» (под широкий мокап аналитики).
 * Текст 1-в-1 из STRUCTURE.
 */
export function Slide_27_Direction1() {
  return (
    <SlideLayout
      speakerSide="right"
      contentClassName="!justify-start !py-0"
      background={<Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />}
    >
      <div
        className="flex flex-col h-full w-full justify-center"
        style={{ paddingTop: "clamp(24px,4vh,48px)", paddingBottom: "clamp(24px,4vh,48px)" }}
      >
        {/* ===== ВЕРХ: нумерация + H1 + подзаголовки ===== */}
        <div className="shrink-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-baseline gap-3 mb-2"
          >
            <span className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00]">// НАПРАВЛЕНИЕ</span>
            <span
              className="font-bold leading-none"
              style={{ color: "#B6FF00", fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(32px,3.6vw,56px)", textShadow: "0 0 30px rgba(182,255,0,0.4)" }}
            >
              01
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase text-white leading-[1.04] tracking-[-0.02em]"
            style={{
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(24px, 2.8vw, 46px)",
              wordBreak: "keep-all",
              overflowWrap: "normal",
              hyphens: "none",
            }}
          >
            СВОЙ СЕРВИС, КОТОРЫЙ{" "}
            <span className="text-[#B6FF00]">ПРОДАЁШЬ БИЗНЕСУ</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-baseline gap-x-6 gap-y-2 mt-5"
          >
            <span className="text-white text-lg md:text-2xl font-semibold leading-snug">
              Сделал один раз — <span className="text-[#B6FF00]">продал десять раз.</span>
            </span>
            <span className="text-white/60 text-base md:text-lg">
              Каждому клиенту — за <span className="text-white font-semibold">300–500 тысяч ₸</span>.
            </span>
          </motion.div>
        </div>

        {/* ===== НИЗ: широкий дашборд — крупный, сразу под текстом ===== */}
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="shrink-0 mt-8"
        >
          <div className="w-full max-w-[1240px]">
            <AnalyticsDashboard />
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
