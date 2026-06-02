"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 125 · Кто ведёт программу. Текст 1-в-1 STRUCTURE 1619-1622.
 * Видео-герой (Александр) — public/video/who_teaches.mp4 (autoplay/loop/muted).
 */
export function Slide_125_WhoTeaches() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="27vw"
      contentMinWidth={480}
      background={<SlideBg theme="dark" variant="aura-tl" />}
      leftObject={
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
          className="relative w-full rounded-2xl overflow-hidden border"
          style={{ aspectRatio: "3 / 4", borderColor: "rgba(182,255,0,0.3)", background: "#0b0e0a", boxShadow: "0 30px 80px -30px rgba(0,0,0,0.75), 0 0 60px -26px rgba(182,255,0,0.3)" }}
        >
          <video src="/video/who_teaches.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
        </motion.div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // КОМАНДА
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-5"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.4vw, 50px)" }}
      >
        КТО ВЕДЁТ <span className="text-[#B6FF00]">ПРОГРАММУ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/75 text-base md:text-lg leading-relaxed max-w-xl mb-3">
        Я веду основные занятия. Курирую первый поток — и из него буду набирать кураторов. Отвечаю в чате и на созвонах.
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="text-white/55 text-sm md:text-base leading-snug max-w-xl">
        Приглашённые эксперты — практики с реальными кейсами.
      </motion.div>
    </SlideLayout>
  );
}
