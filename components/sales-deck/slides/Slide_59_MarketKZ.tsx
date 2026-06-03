"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { useCountUp } from "../useCountUp";

/**
 * Слайд 59 · Рынок Казахстана. Текст 1-в-1 STRUCTURE 746-750.
 * Текст сверху + большой реальный скрин stat.gov.kz снизу (public/handouts/screens/statgov_kz.png).
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
      <div className="flex flex-col h-full w-full" style={{ paddingTop: "clamp(26px,4.5vh,52px)", paddingBottom: "clamp(22px,3.5vh,44px)" }}>
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-2 shrink-0">
          // РЫНОК · КАЗАХСТАН
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-bold leading-[1.06] tabular-nums whitespace-nowrap shrink-0 pt-1"
          style={{
            fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(44px, 5vw, 92px)",
            background: "linear-gradient(120deg, #B6FF00 35%, #FC5C02)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 0 60px rgba(182,255,0,0.3))",
          }}
        >
          {n.toLocaleString("ru-RU")}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }} className="font-bold uppercase text-white leading-[1.0] tracking-[-0.02em] mt-1 shrink-0" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(22px,2.6vw,42px)" }}>
          БИЗНЕСОВ В КАЗАХСТАНЕ
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.7 }} className="text-white/55 text-sm md:text-base mt-2 mb-3 shrink-0 max-w-2xl">
          По данным <span className="text-white/80">stat.gov.kz</span> — у каждого своя рутина, которую можно закрыть сервисом.
        </motion.div>

        {/* Большой реальный скрин stat.gov.kz */}
        <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, delay: 0.6, ease: [0.25, 1, 0.5, 1] }} className="flex-1 min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/handouts/screens/statgov_kz.png" alt="stat.gov.kz — число активных бизнесов в Казахстане" className="w-full h-full object-contain object-left" />
        </motion.div>
      </div>
    </SlideLayout>
  );
}
