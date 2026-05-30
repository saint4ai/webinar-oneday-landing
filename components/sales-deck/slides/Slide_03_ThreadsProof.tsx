"use client";

import { motion } from "framer-motion";
import { ThreadsCarousel } from "../ThreadsCarousel";

/**
 * Слайд 3.x · Proof of demand
 * Layout: left text (compact) + right ThreadsCarousel (full size, all 10 screens)
 */
export function Slide_03_ThreadsProof() {
  return (
    <section
      className="relative w-full h-screen overflow-hidden bg-black"
      style={{
        paddingRight: "calc(var(--sd-speaker-zone, 30vw) + 48px)",
        paddingLeft: "48px",
        paddingTop: "48px",
        paddingBottom: "48px",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] h-full gap-12 items-center relative z-10">
        {/* LEFT — текст */}
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00]"
          >
            // СЕЙЧАС В ТРЕДС · ЖИВЫЕ ЗАПРОСЫ
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase text-white leading-[1.05] tracking-[-0.03em]"
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(32px, 3.5vw, 64px)",
            }}
          >
            Бизнес ищет тех, кто умеет{" "}
            <span className="bg-[#B6FF00] text-black px-[0.1em] py-[0.02em] rounded-[0.1em]">
              собирать на AI
            </span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-white/70 text-base md:text-lg leading-relaxed max-w-[480px]"
          >
            Не выдумано. Не из LinkedIn-отчётов. Реальные запросы прямо сейчас в Threads:
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="flex flex-col gap-3 mt-2"
          >
            <div className="flex items-baseline gap-3">
              <span className="text-[#B6FF00] font-bold text-2xl leading-none">→</span>
              <span className="text-white/85">
                Бюджеты <span className="text-[#B6FF00] font-semibold">от 20М ₸</span> на разработку
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-[#B6FF00] font-bold text-2xl leading-none">→</span>
              <span className="text-white/85">Открытые вакансии «вайбкодер / ИИ-специалист»</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-[#B6FF00] font-bold text-2xl leading-none">→</span>
              <span className="text-white/85">Запросы на технического партнёра в проект</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 180 }}
            transition={{ duration: 0.7, delay: 1.2 }}
            className="h-[2px] bg-[#B6FF00] mt-4"
          />
        </div>

        {/* RIGHT — карусель из всех 10 скринов */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="h-full min-h-[600px] relative"
        >
          <ThreadsCarousel />
        </motion.div>
      </div>
    </section>
  );
}
