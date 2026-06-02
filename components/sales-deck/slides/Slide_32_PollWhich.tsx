"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 32 · Engagement — «КАКОЕ ИЗ ТРЁХ — ВАШЕ?».
 * Эмоциональный слайд-триггер: 3 большие цифры в лайм-плашках пульсируют,
 * прямой призыв написать 1/2/3 в чат. Текст 1-в-1 из STRUCTURE.
 */
const LABELS = ["сервис для бизнеса", "сервис на подписке", "приложение для себя"];

export function Slide_32_PollWhich() {
  return (
    <SlideLayout
      speakerSide="right"
      contentClassName="items-center text-center"
      background={
        <>
          <Spotlight className="-top-40 left-0 md:-top-20" fill="#B6FF00" />
          <Spotlight className="bottom-0 right-[10vw] md:bottom-[-20vh]" fill="#FC5C02" />
        </>
      }
    >
      <motion.h1
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-3"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(30px, 3.8vw, 56px)",
        }}
      >
        КАКОЕ ИЗ ТРЁХ — <span className="text-[#B6FF00]">ВАШЕ?</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/70 text-base md:text-xl font-mono uppercase tracking-[0.08em] mb-10"
      >
        Напишите 1, 2 или 3 в чат
      </motion.div>

      {/* 3 большие цифры */}
      <div className="flex items-center gap-5 md:gap-8">
        {[1, 2, 3].map((n, i) => (
          <motion.div
            key={n}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 + i * 0.18, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 24px rgba(182,255,0,0.4)",
                  "0 0 50px rgba(182,255,0,0.8)",
                  "0 0 24px rgba(182,255,0,0.4)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
              className="rounded-3xl flex items-center justify-center"
              style={{
                width: "clamp(80px, 9vw, 130px)",
                height: "clamp(80px, 9vw, 130px)",
                background: "#B6FF00",
              }}
            >
              <span className="font-bold text-black leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(48px, 5.5vw, 80px)" }}>{n}</span>
            </motion.div>
            <span className="text-white/55 text-xs md:text-sm uppercase tracking-[0.08em] font-mono">{LABELS[i]}</span>
          </motion.div>
        ))}
      </div>
    </SlideLayout>
  );
}
