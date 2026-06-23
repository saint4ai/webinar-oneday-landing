"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 35b · Панчлайн — почему такие сервисы монетизируются.
 * H1 + крупная лайм-мысль «платят за экономию времени». Слева парящий
 * доллар-с-крыльями (SVG + float + parallax). Текст 1-в-1 из STRUCTURE.
 */
export function Slide_35b_WhyMonetizes() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="22cqw"
      objectOverflow="visible"
      background={<Spotlight className="-top-40 left-0 md:-top-20" fill="#B6FF00" />}
      leftObject={<FlyingDollar />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ПОЧЕМУ ЭТО ПОКУПАЮТ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.03em]"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(21px, 2.5cqw, 38px)",
          wordBreak: "keep-all",
          overflowWrap: "normal",
        }}
      >
        AI-СЕРВИС, КОТОРЫЙ РЕШАЕТ{" "}
        <span className="text-[#B6FF00]">ОДНУ ЗАДАЧУ БИЗНЕСА</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="text-white text-lg md:text-2xl font-semibold leading-snug mt-6 max-w-2xl"
      >
        Люди платят не за AI — а за{" "}
        <span className="text-[#B6FF00]">экономию времени</span>, меньше ручной рутины и меньше ошибок.
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.85 }}
        className="mt-4"
      >
        <span
          className="inline-block font-bold uppercase"
          style={{ background: "#B6FF00", color: "#000", padding: "0.15em 0.5em", borderRadius: "0.15em", fontFamily: "var(--font-benzin)", fontSize: "clamp(20px,2.2cqw,34px)" }}
        >
          Всё это = деньги
        </span>
      </motion.div>
    </SlideLayout>
  );
}

/** Парящий доллар с крыльями — SVG + float + лёгкий tilt. */
function FlyingDollar() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
      style={{ width: 360, height: 360 }}
      className="relative"
    >
      {/* лайм-glow */}
      <div
        className="absolute inset-[18%] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(182,255,0,0.28) 0%, transparent 70%)", filter: "blur(34px)" }}
      />
      <motion.div
        animate={{ y: [0, -16, 0], rotate: [-3, 3, -3] }}
        transition={{ y: { duration: 4, ease: "easeInOut", repeat: Infinity }, rotate: { duration: 6, ease: "easeInOut", repeat: Infinity } }}
        className="relative w-full h-full"
      >
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full drop-shadow-[0_20px_40px_rgba(182,255,0,0.4)]">
          {/* левое крыло */}
          <path d="M 70 95 Q 20 70 12 100 Q 30 105 45 112 Q 25 112 18 130 Q 40 128 58 120 Q 45 130 42 148 Q 62 136 72 118 Z" fill="#B6FF00" opacity="0.9" />
          {/* правое крыло */}
          <path d="M 130 95 Q 180 70 188 100 Q 170 105 155 112 Q 175 112 182 130 Q 160 128 142 120 Q 155 130 158 148 Q 138 136 128 118 Z" fill="#B6FF00" opacity="0.9" />
          {/* монета */}
          <circle cx="100" cy="110" r="44" fill="#0a0a0a" stroke="#B6FF00" strokeWidth="4" />
          <circle cx="100" cy="110" r="44" fill="url(#coinGlow)" />
          <text x="100" y="128" textAnchor="middle" fontSize="52" fontWeight="800" fill="#B6FF00" fontFamily="var(--font-benzin), system-ui">$</text>
          <defs>
            <radialGradient id="coinGlow" cx="0.4" cy="0.3" r="0.8">
              <stop offset="0%" stopColor="#B6FF00" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#B6FF00" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </motion.div>
    </motion.div>
  );
}
