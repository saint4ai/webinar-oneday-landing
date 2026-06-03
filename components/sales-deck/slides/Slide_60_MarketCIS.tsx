"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { useCountUp } from "../useCountUp";

/**
 * Слайд 60 · Рынок СНГ. Текст 1-в-1 STRUCTURE 754-758.
 * Гигант «13 000 000» + сравнение-шкала KZ 2 млн → СНГ 13 млн. Цифры на проверку.
 */
export function Slide_60_MarketCIS() {
  const n = useCountUp(13000000, 1.9);

  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={720}
      background={<SlideBg theme="dark" variant="aura-tr" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // РЫНОК · СНГ
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="flex items-baseline gap-4 flex-wrap"
      >
        <span
          className="font-bold leading-[1.0] tabular-nums"
          style={{
            fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(44px, 5.6vw, 104px)",
            paddingTop: "0.08em",
            background: "linear-gradient(120deg, #B6FF00 30%, #FC5C02)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 0 60px rgba(252,92,2,0.28))",
          }}
        >
          {n.toLocaleString("ru-RU")}
        </span>
        <span className="font-bold uppercase text-white leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(30px,3.6vw,60px)" }}>В СНГ</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-white/65 text-base md:text-xl mt-3 mb-9"
      >
        Если выходить шире.
      </motion.div>

      {/* Сравнение KZ → СНГ */}
      <div className="flex flex-col gap-4 max-w-3xl">
        {[
          { label: "Казахстан", value: "более 2 млн", frac: 2 / 13, c: "#B6FF00", delay: 0.7 },
          { label: "СНГ", value: "13 млн", frac: 1, c: "linear-gradient(90deg, #B6FF00, #FC5C02)", delay: 0.95 },
        ].map((b) => (
          <div key={b.label} className="flex items-center gap-4">
            <span className="text-white/60 text-sm font-mono uppercase tracking-[0.1em] w-[110px] shrink-0">{b.label}</span>
            <div className="relative flex-1 h-9 rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: b.frac }}
                transition={{ duration: 1.1, delay: b.delay, ease: [0.25, 1, 0.5, 1] }}
                className="absolute inset-y-0 left-0 right-0 rounded-lg origin-left"
                style={{ background: b.c }}
              />
            </div>
            <span className="font-bold text-[#B6FF00] text-sm md:text-base shrink-0 whitespace-nowrap tabular-nums" style={{ fontFamily: "var(--font-benzin), system-ui" }}>{b.value}</span>
          </div>
        ))}
      </div>
    </SlideLayout>
  );
}
