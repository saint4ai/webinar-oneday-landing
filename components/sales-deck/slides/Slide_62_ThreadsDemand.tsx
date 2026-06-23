"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { ThreadsCarousel } from "../ThreadsCarousel";

/**
 * Слайд 62 · Запросы Threads. Текст 1-в-1 STRUCTURE 770-775.
 * Переиспользует существующий ThreadsCarousel (10 реальных скринов запросов).
 */
export function Slide_62_ThreadsDemand() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="28cqw"
      contentMinWidth={500}
      background={<SlideBg theme="dark" variant="aura-tl" />}
      leftObject={
        <div className="h-[84cqh] w-full max-w-[440px] flex items-center justify-center px-2">
          <ThreadsCarousel />
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // СПРОС · THREADS
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.02em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 2.3cqw, 35px)" }}
      >
        А В THREADS — <span className="text-[#B6FF00]">БИЗНЕС ИЩЕТ ВАС</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="text-white/65 text-base md:text-lg leading-snug max-w-md"
      >
        Реальные запросы прямо сейчас. Люди уже ищут того, кто соберёт им сервис — а ты можешь быть этим человеком.
      </motion.div>
    </SlideLayout>
  );
}
