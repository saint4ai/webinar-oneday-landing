"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 28 · Направление 2 — свой собственный продукт.
 * Реальное видео iPhone-мокапа фитнес-трекера (Higgsfield, зелёнка вырезана
 * хромакеем → VP9-alpha webm) слева: телефон крутится на 360° вокруг оси,
 * приложение листается. Текст 1-в-1 из STRUCTURE.
 * Видео: public/handouts/fitness/iphone_360.webm (прозрачный фон, loop).
 */
export function Slide_28_Direction2() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="26cqw"
      contentMinWidth={560}
      background={
        <>
          <Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />
          {/* подсветка-пьедестал под телефоном */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: "12cqw",
              bottom: "8cqh",
              width: 360,
              height: 360,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(252,92,2,0.18), transparent 70%)",
              filter: "blur(30px)",
            }}
          />
        </>
      }
      leftObject={
        <div
          className="relative flex items-center justify-center"
          style={{ height: "84cqh", maxHeight: "820px" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="relative"
            style={{ height: "100%" }}
          >
            <video
              src="/handouts/fitness/iphone_360.webm"
              poster="/handouts/fitness/iphone_360_poster.png"
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-auto object-contain"
              style={{ filter: "drop-shadow(0 40px 70px rgba(0,0,0,0.7))" }}
            />
          </motion.div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex items-baseline gap-3 mb-3"
      >
        <span className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00]">// НАПРАВЛЕНИЕ</span>
        <span
          className="font-bold leading-none"
          style={{ color: "#B6FF00", fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(40px,5cqw,72px)", textShadow: "0 0 30px rgba(182,255,0,0.4)" }}
        >
          02
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-5"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(23px, 1.4cqw, 26px)",
        }}
      >
        СВОЙ ПРОДУКТ — ДЛЯ СЕБЯ
        <br />
        ИЛИ <span className="text-[#B6FF00]">НА ПОДПИСКУ ДЛЯ ВСЕХ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="text-white text-lg md:text-2xl font-semibold leading-snug mb-4 max-w-xl"
      >
        Идея в голове два года? <span className="text-[#B6FF00]">Сделайте за две недели.</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.85 }}
        className="text-white/65 text-base md:text-lg leading-relaxed max-w-xl"
      >
        Опубликуйте. Зарабатывайте на пользователях.
      </motion.div>
    </SlideLayout>
  );
}
