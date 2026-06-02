"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Link2, ArrowRight, Palette, Image as ImageIcon } from "lucide-react";

/**
 * Слайд 91 · Лайфхак — бренд-код по скриншоту. Текст 1-в-1 STRUCTURE 1114-1122.
 * ⚠️ Пометка Александра (1123): следующим слайдом вставить видео-нарезку урока,
 * где он делает в Claude Code документы/презу/дашборд. (видео даст позже)
 */
export function Slide_91_BrandFromScreenshot() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={740}
      background={<SlideBg theme="dark" variant="aura-tl" />}
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ЛАЙФХАК · ДИЗАЙН
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.02em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3vw, 46px)" }}
      >
        ОТПРАВИЛ САЙТ — <span className="text-[#B6FF00]">ОН СКОПИРОВАЛ СТИЛЬ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mb-6">
        Или скриншот, или ссылка — оба работают. Отправь Claude — он вытащит шрифты, цвета, концепцию. Никаких дизайнерских терминов.
      </motion.div>

      <div className="flex items-center gap-4 flex-wrap">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.55 }} className="flex items-center gap-2.5 rounded-xl px-4 py-3 shrink-0" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Link2 className="w-5 h-5 text-white/60" strokeWidth={1.8} />
          <span className="text-white/70 text-sm">ссылка / скрин Canva</span>
        </motion.div>
        <ArrowRight className="w-6 h-6 text-[#B6FF00] shrink-0" strokeWidth={2.5} />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.8 }} className="flex items-center gap-2.5 rounded-xl px-4 py-3 shrink-0" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}>
          <Palette className="w-5 h-5 text-[#B6FF00]" strokeWidth={1.8} />
          <span className="text-[#B6FF00] text-sm font-semibold">твой фирменный стиль готов</span>
        </motion.div>
      </div>

      {/* Слот под скрин Canva color combinations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.0 }} className="mt-6 rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 max-w-2xl" style={{ borderColor: "rgba(182,255,0,0.3)", background: "rgba(182,255,0,0.02)", height: 150 }}>
        <ImageIcon className="w-7 h-7 text-white/30" strokeWidth={1.5} />
        <span className="text-white/45 text-xs font-mono uppercase tracking-[0.1em]">скрин Canva «100 цветовых сочетаний»</span>
        <span className="text-white/25 text-[10px]">+ видео-нарезка урока — Александр даст</span>
      </motion.div>
    </SlideLayout>
  );
}
