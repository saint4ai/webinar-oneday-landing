"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Image as ImageIcon, TrendingUp } from "lucide-react";

/**
 * Слайд 61 · Запросы Yandex. Текст 1-в-1 STRUCTURE 762-766.
 * График роста ×7 (бары снизу вверх) + слот под реальный скрин Yandex (Александр).
 * Цифра ×7 — на проверку (источник Yandex Wordstat).
 */
const BARS = [13, 17, 22, 30, 40, 55, 72, 92, 100]; // рост ~×7 от первого к последнему

export function Slide_61_YandexDemand() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={720}
      background={<SlideBg theme="dark" variant="lime-right" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // СПРОС · YANDEX
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.4vw, 52px)" }}
      >
        ЗА 2 ГОДА ЗАПРОСЫ ВЫРОСЛИ <span className="text-[#B6FF00]">В 7 РАЗ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/60 text-sm md:text-base mb-7"
      >
        По «AI-ассистент для бизнеса» в Yandex.
      </motion.div>

      <div className="flex items-end gap-6 flex-wrap">
        {/* График-бары */}
        <div className="flex items-end gap-2 h-[200px] md:h-[240px]">
          {BARS.map((hgt, i) => (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.6, delay: 0.6 + i * 0.08, ease: [0.25, 1, 0.5, 1] }}
              className="w-7 md:w-9 rounded-t origin-bottom"
              style={{
                height: `${hgt}%`,
                background: i === BARS.length - 1 ? "linear-gradient(180deg, #FC5C02, #B6FF00)" : `rgba(182,255,0,${0.25 + (i / BARS.length) * 0.6})`,
                boxShadow: i === BARS.length - 1 ? "0 0 24px rgba(252,92,2,0.5)" : "none",
              }}
            />
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="self-start flex items-center gap-1.5 ml-1"
          >
            <TrendingUp className="w-6 h-6 text-[#FC5C02]" strokeWidth={2.5} />
            <span className="font-bold leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(28px,3vw,44px)", color: "#FC5C02" }}>×7</span>
          </motion.div>
        </div>

        {/* Слот под скрин Yandex */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="rounded-2xl border border-dashed flex flex-col items-center justify-center gap-2 text-center shrink-0"
          style={{ borderColor: "rgba(182,255,0,0.3)", background: "rgba(182,255,0,0.03)", width: "clamp(240px,22vw,320px)", height: "clamp(160px,22vh,230px)" }}
        >
          <ImageIcon className="w-7 h-7 text-white/30" strokeWidth={1.5} />
          <span className="text-white/45 text-xs font-mono uppercase tracking-[0.1em] leading-snug">скрин Yandex Wordstat</span>
          <span className="text-white/25 text-[10px]">добавит Александр</span>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
