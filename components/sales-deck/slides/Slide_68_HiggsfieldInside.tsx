"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Terminal, ArrowRight } from "lucide-react";

/**
 * Слайд 68 · Higgsfield внутри Claude. Текст 1-в-1 STRUCTURE 842-852.
 * Поток: терминал Claude Code с командой → готовая бонус-карточка (реальная).
 */
export function Slide_68_HiggsfieldInside() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={700}
      background={<SlideBg theme="dark" variant="aura-tr" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ИНСТРУМЕНТ 3 · HIGGSFIELD
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.4cqw, 52px)" }}
      >
        HIGGSFIELD <span className="text-[#B6FF00]">ВНУТРИ CLAUDE</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mb-6"
      >
        Не открываете сайт. Не возитесь с интерфейсом. Говорите — он делает.
      </motion.div>

      {/* Поток: терминал → карточка */}
      <div className="flex items-center gap-5 mb-6 flex-wrap">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="rounded-xl overflow-hidden shrink-0"
          style={{ width: 320, background: "#0A0B0F", border: "1px solid rgba(182,255,0,0.25)" }}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8">
            <Terminal className="w-3.5 h-3.5 text-[#B6FF00]" strokeWidth={2} />
            <span className="font-mono text-[11px] text-white/45">claude code</span>
          </div>
          <div className="px-3.5 py-3 font-mono text-[12px] leading-relaxed">
            <div className="text-white/50">$ <span className="text-white/85">сгенери карточку бонуса</span></div>
            <div className="text-white/50">{"  "}на наш бренд, 4:5</div>
            <div className="text-[#B6FF00] mt-1">✦ Higgsfield: готово → /public</div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.95 }} className="shrink-0">
          <ArrowRight className="w-7 h-7 text-[#B6FF00]" strokeWidth={2.5} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.1, ease: [0.25, 1, 0.5, 1] }}
          className="relative rounded-xl overflow-hidden shrink-0"
          style={{ width: 176, height: 220, background: "#0b0e0a", boxShadow: "0 24px 50px -16px rgba(0,0,0,0.7), 0 0 50px -16px rgba(182,255,0,0.4)" }}
        >
          <Image src="/bonuses/bonus-1.png" alt="Готовая бонус-карточка, сгенерённая через Claude + Higgsfield" fill className="object-contain" sizes="200px" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="inline-flex items-center rounded-xl px-4 py-2.5 mb-3"
        style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.3)" }}
      >
        <span className="text-white/85 text-sm md:text-base leading-snug">
          Эта презентация на <span className="text-[#B6FF00] font-semibold">30% собрана</span> через связку Claude Code + Higgsfield.
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.6 }}
        className="text-white/45 text-xs md:text-sm leading-snug max-w-2xl"
      >
        Каждая бонус-карточка, крутящееся видео, фон, скриншоты — сделаны вот так. Картинки и видео скачиваются и кладутся в папку проекта сами.
      </motion.div>
    </SlideLayout>
  );
}
