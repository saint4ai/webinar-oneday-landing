"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { useCountUp } from "../useCountUp";
import { Image as ImageIcon } from "lucide-react";

/**
 * Слайд 59 · Рынок Казахстана. Текст 1-в-1 STRUCTURE 746-750.
 * Гигант-цифра «2 000 000» + слот под реальный скрин stat.gov.kz (Александр).
 * Цифра — на проверку (источник stat.gov.kz).
 */
export function Slide_59_MarketKZ() {
  const n = useCountUp(2000000, 1.8);

  return (
    <SlideLayout
      speakerSide="right"
      contentClassName="!justify-start !py-0"
      contentMinWidth={720}
      background={<SlideBg theme="dark" variant="dual-bottom" />}
    >
      <div className="flex flex-col h-full w-full justify-center" style={{ paddingTop: "clamp(28px,5vh,56px)", paddingBottom: "clamp(28px,5vh,56px)" }}>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
        >
          // РЫНОК · КАЗАХСТАН
        </motion.div>

        <div className="flex items-center gap-8 flex-wrap">
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="font-bold leading-[0.9] tabular-nums whitespace-nowrap"
              style={{
                fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
                fontSize: "clamp(48px, 5.6vw, 104px)",
                background: "linear-gradient(120deg, #B6FF00 35%, #FC5C02)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                filter: "drop-shadow(0 0 60px rgba(182,255,0,0.3))",
              }}
            >
              {n.toLocaleString("ru-RU")}
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="font-bold uppercase text-white leading-[1.0] tracking-[-0.02em] mt-2"
              style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(26px,3vw,48px)" }}
            >
              БИЗНЕСОВ В КАЗАХСТАНЕ
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-white/55 text-sm md:text-base mt-4"
            >
              По данным <span className="text-white/80">stat.gov.kz</span> — у каждого своя рутина, которую можно закрыть сервисом.
            </motion.div>
          </div>

          {/* Слот под скрин stat.gov.kz */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="rounded-2xl border border-dashed flex flex-col items-center justify-center gap-2 text-center shrink-0"
            style={{ borderColor: "rgba(182,255,0,0.3)", background: "rgba(182,255,0,0.03)", width: "clamp(260px,24vw,360px)", height: "clamp(180px,24vh,260px)" }}
          >
            <ImageIcon className="w-8 h-8 text-white/30" strokeWidth={1.5} />
            <span className="text-white/45 text-xs font-mono uppercase tracking-[0.1em] leading-snug">скрин stat.gov.kz</span>
            <span className="text-white/25 text-[10px]">добавит Александр</span>
          </motion.div>
        </div>
      </div>
    </SlideLayout>
  );
}
