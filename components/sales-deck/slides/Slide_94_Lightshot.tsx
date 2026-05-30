"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Crop, Image as ImageIcon } from "lucide-react";

/**
 * Слайд 94 · Лайфхак — Lightshot. Текст 1-в-1 STRUCTURE 1151-1159.
 * ⚠️ Пометка Александра (1151): скачать оригинальный логотип Lightshot.
 */
export function Slide_94_Lightshot() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={740} background={<SlideBg theme="dark" variant="dual-bottom" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ЛАЙФХАК · СКРИНШОТЫ
      </motion.div>
      <motion.h1 initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }} animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }} className="font-bold uppercase text-white leading-[1.02] tracking-[-0.02em] mb-2" style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3vw, 48px)" }}>
        НЕТ КНОПКИ ЭКСПОРТА? <span className="text-[#B6FF00]">СДЕЛАЙ СКРИН</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mb-3">
        Любая программа, любой сайт, любая таблица — если данные нельзя выгрузить файлом, делаем скриншот.
      </motion.div>

      {/* шаги Lightshot */}
      <div className="flex items-center gap-2.5 flex-wrap mb-6">
        {["Lightshot — выделил область", "Ctrl + C", "Ctrl + V в чат Claude"].map((s, i) => (
          <motion.div key={s} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.55 + i * 0.13 }} className="flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-xs md:text-sm" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.22)", color: "rgba(255,255,255,0.85)" }}>
              {i === 0 && <Crop className="w-3.5 h-3.5 text-[#B6FF00]" strokeWidth={2} />}
              {s}
            </span>
            {i < 2 && <span className="text-[#B6FF00]">→</span>}
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.0 }} className="rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 max-w-2xl mb-4" style={{ borderColor: "rgba(182,255,0,0.3)", background: "rgba(182,255,0,0.02)", height: 140 }}>
        <ImageIcon className="w-7 h-7 text-white/30" strokeWidth={1.5} />
        <span className="text-white/45 text-xs font-mono uppercase tracking-[0.1em]">скрин Lightshot — выделенная область</span>
        <span className="text-white/25 text-[10px]">+ логотип Lightshot — Александр даст</span>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.3 }} className="text-white/55 text-sm md:text-base">
        Агент читает скриншоты <span className="text-[#B6FF00] font-semibold">не хуже файлов</span>.
      </motion.div>
    </SlideLayout>
  );
}
