"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import Image from "next/image";
import { Link2, ArrowRight, Palette } from "lucide-react";

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
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3cqw, 46px)" }}
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

      {/* Скрин Canva «100 цветовых сочетаний» + ссылка */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.0 }} className="mt-6 flex items-start gap-5 flex-wrap max-w-3xl">
        <div className="rounded-xl overflow-hidden shrink-0" style={{ width: 230, border: "1px solid rgba(182,255,0,0.28)", boxShadow: "0 24px 60px -24px rgba(0,0,0,0.7)" }}>
          <Image src="/handouts/canva-palettes.png" alt="Canva — 100 цветовых сочетаний" width={1638} height={1392} className="w-full h-auto block" />
        </div>
        <div className="flex flex-col gap-2 pt-1 min-w-0">
          <div className="flex items-center gap-2 text-white/55 text-xs font-mono uppercase tracking-[0.12em]"><Palette className="w-3.5 h-3.5 text-[#B6FF00]" strokeWidth={1.8} />Canva · 100 готовых палитр</div>
          <a href="https://www.canva.com/ru_ru/obuchenie/100-cvetovyx-sochetnij/" target="_blank" rel="noopener noreferrer" className="text-[#B6FF00] text-sm font-medium underline decoration-[#B6FF00]/40 break-all">canva.com/ru_ru/obuchenie/100-cvetovyx-sochetnij</a>
          <span className="text-white/25 text-[10px]">+ видео-нарезка урока — Александр даст</span>
        </div>
      </motion.div>
    </SlideLayout>
  );
}
