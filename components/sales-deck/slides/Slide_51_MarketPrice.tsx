"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";
import { LiquidBackground } from "../LiquidBackground";

/**
 * Слайд 51 · Сколько стоит. Текст 1-в-1 STRUCTURE 617-621.
 * Гигант-счётчик «300 000 — 500 000 ₸» (counter на обе границы).
 */
function useCountUp(target: number, duration = 1.6, delay = 0.35) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const id = setTimeout(() => {
      const tick = (now: number) => {
        if (!start) start = now;
        const p = Math.min((now - start) / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setV(Math.floor(target * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
        else setV(target);
      };
      raf = requestAnimationFrame(tick);
    }, delay * 1000);
    return () => {
      clearTimeout(id);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);
  return v;
}

export function Slide_51_MarketPrice() {
  const from = useCountUp(300000);
  const to = useCountUp(500000);

  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={720}
      background={
        <>
          <LiquidBackground variant="mesh" opacity={0.34} />
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{ bottom: "-16rem", left: "18%", width: 620, height: 620, borderRadius: "50%", background: "radial-gradient(circle, rgba(252,92,2,0.18), transparent 66%)", filter: "blur(24px)" }}
          />
        </>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ЦЕНА НА РЫНКЕ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-6"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(30px, 3.6vw, 56px)",
        }}
      >
        СКОЛЬКО <span className="text-[#B6FF00]">ЭТО СТОИТ</span>
      </motion.h1>

      {/* Гигант-цифра */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="flex items-baseline gap-3 flex-nowrap whitespace-nowrap mb-6"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif" }}
      >
        <span
          className="font-bold leading-none tabular-nums"
          style={{ fontSize: "clamp(40px, 5.4vw, 100px)", background: "linear-gradient(120deg, #B6FF00 30%, #FC5C02)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 0 50px rgba(182,255,0,0.3))" }}
        >
          {from.toLocaleString("ru-RU")}
        </span>
        <span className="font-bold leading-none text-white/40" style={{ fontSize: "clamp(30px, 4vw, 66px)" }}>—</span>
        <span
          className="font-bold leading-none tabular-nums"
          style={{ fontSize: "clamp(40px, 5.4vw, 100px)", background: "linear-gradient(120deg, #B6FF00, #FC5C02 75%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 0 50px rgba(252,92,2,0.3))" }}
        >
          {to.toLocaleString("ru-RU")}
        </span>
        <span className="font-bold leading-none" style={{ fontSize: "clamp(30px, 4vw, 66px)", color: "#FC5C02" }}>₸</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="text-white/70 text-base md:text-xl leading-snug max-w-2xl"
      >
        От 300 до 500 тысяч за один внедрённый микросервис под задачу.
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.85 }}
        className="text-white/45 text-sm md:text-base leading-snug max-w-2xl mt-2"
      >
        Не про полноценную платформу — про микросервис, который решает конкретную боль.
      </motion.div>
    </SlideLayout>
  );
}
