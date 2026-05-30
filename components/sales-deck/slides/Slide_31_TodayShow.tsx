"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";
import { Smartphone, ArrowRight } from "lucide-react";

/**
 * Слайд 31 · Что сегодня покажу — «СЕГОДНЯ Я ПОКАЖУ».
 * Тема «обещание/переход к практике». Текст 1-в-1 из STRUCTURE.
 */
export function Slide_31_TodayShow() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={640}
      background={<Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ПЛАН НА СЕГОДНЯ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-5"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(30px, 3.8vw, 56px)",
        }}
      >
        СЕГОДНЯ <span className="text-[#B6FF00]">Я ПОКАЖУ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="text-white/75 text-base md:text-xl leading-snug mb-8 max-w-2xl"
      >
        Как из любого из трёх направлений получается рабочий продукт.
      </motion.div>

      {/* Главное обещание — карточка с телефоном */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.7, ease: [0.25, 1, 0.5, 1] }}
        className="rounded-2xl p-6 md:p-8 flex items-center gap-6 max-w-4xl"
        style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.3)" }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "#B6FF00", boxShadow: "0 0 30px rgba(182,255,0,0.5)" }}
        >
          <Smartphone className="w-8 h-8 text-black" strokeWidth={2} />
        </motion.div>
        <div className="min-w-0">
          <div
            className="text-white font-bold text-lg md:text-2xl leading-tight"
            style={{ whiteSpace: "nowrap" }}
          >
            Через час у вас будет своё <span className="text-[#B6FF00]">Android-приложение</span>
          </div>
          <div className="flex items-center gap-2 text-white/55 text-sm md:text-base mt-2">
            <ArrowRight className="w-4 h-4" style={{ color: "#B6FF00" }} />
            и понимание, как сделать ещё
          </div>
        </div>
      </motion.div>
    </SlideLayout>
  );
}
