"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 126 · Где учитесь — платформа. Текст 1-в-1 STRUCTURE 1627-1633.
 * PLACEHOLDER: вставить скриншот/видео платформы onai.academy (Александр даст).
 */
const PERKS = ["Все уроки, материалы и чек-листы в одном месте", "AI-наставник отвечает на вопросы 24/7", "Учитесь с любого устройства"];

export function Slide_126_Platform() {
  return (
    <SlideLayout speakerSide="right" contentClassName="!justify-start !py-0" contentMinWidth={740} background={<SlideBg theme="dark" variant="lime-right" />}>
      <div className="flex flex-col h-full w-full" style={{ paddingTop: "clamp(34px,6cqh,68px)", paddingBottom: "clamp(28px,4cqh,52px)" }}>
        <div className="shrink-0">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
            // ГДЕ УЧИТЕСЬ
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
            style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.6cqw, 56px)" }}
          >
            НА НАШЕЙ <span className="text-[#B6FF00]">ПЛАТФОРМЕ</span>
          </motion.h1>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base mb-4">
            onai.academy — собственная платформа с AI-наставником.
          </motion.div>
          <div className="flex flex-wrap gap-2 mb-3">
            {PERKS.map((p, i) => (
              <motion.span key={p} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.55 + i * 0.1 }} className="rounded-lg px-3 py-2 text-white/85 text-xs md:text-sm" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.22)" }}>{p}</motion.span>
            ))}
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, delay: 0.7, ease: [0.25, 1, 0.5, 1] }} className="flex-1 min-h-0 mt-3">
          <div className="relative w-full h-full rounded-xl overflow-hidden border flex items-center justify-center" style={{ borderColor: "rgba(182,255,0,0.28)", background: "#0b0e0a", boxShadow: "0 30px 70px -28px rgba(0,0,0,0.7), 0 0 60px -26px rgba(182,255,0,0.25)" }}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src="/video/platform.mp4" autoPlay loop muted playsInline className="w-full h-full object-contain" />
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
