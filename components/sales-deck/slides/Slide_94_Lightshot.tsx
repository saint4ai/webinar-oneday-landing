"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Crop } from "lucide-react";

/**
 * Слайд 94 · Лайфхак — Lightshot. Текст 1-в-1 STRUCTURE 1151-1159.
 * Реальный скрин Lightshot во всю ширину (public/handouts/screens/lightshot.png, широкий ≈3:1).
 */
export function Slide_94_Lightshot() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={740} background={<SlideBg theme="dark" variant="dual-bottom" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ЛАЙФХАК · СКРИНШОТЫ
      </motion.div>
      <motion.h1 initial={{ opacity: 0, clipPath: "inset(-14% 100% 0 0)" }} animate={{ opacity: 1, clipPath: "inset(-14% 0% 0 0)" }} transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }} className="font-bold uppercase text-white leading-[1.06] tracking-[-0.02em] mb-2 pt-1" style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 2.9cqw, 46px)" }}>
        НЕТ КНОПКИ ЭКСПОРТА? <span className="text-[#B6FF00]">СДЕЛАЙ СКРИН</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug max-w-3xl mb-3">
        Любые данные, которые нельзя выгрузить файлом, — делаем скриншот.
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="flex items-center gap-2 flex-wrap mb-4">
        {["Lightshot — выделил область", "Ctrl + C", "Ctrl + V в чат Claude"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-xs" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.22)", color: "rgba(255,255,255,0.85)" }}>
              {i === 0 && <Crop className="w-3.5 h-3.5 text-[#B6FF00]" strokeWidth={2} />}
              {s}
            </span>
            {i < 2 && <span className="text-[#B6FF00]">→</span>}
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.7 }} className="relative inline-block rounded-xl overflow-hidden mb-3" style={{ border: "1px solid rgba(182,255,0,0.25)", maxWidth: "100%" }}>
        <img src="/handouts/screens/lightshot.png" alt="Lightshot — выделенная область" className="block" style={{ maxWidth: "100%", maxHeight: "42cqh" }} />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.0 }} className="text-white/60 text-sm md:text-base">
        Агент читает скриншоты <span className="text-[#B6FF00] font-semibold">не хуже файлов</span>.
      </motion.div>
    </SlideLayout>
  );
}
