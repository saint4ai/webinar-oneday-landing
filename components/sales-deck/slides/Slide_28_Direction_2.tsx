"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";

/**
 * Слайд 28 · Направление 2 — свой собственный продукт
 * Layout: текст слева (30/70), iPhone-видео с прозрачным фоном справа.
 * Видео iphone_360_transparent.webm — Higgsfield Kling 3.0 → ffmpeg chroma key.
 * Background — чёрный + лайм Spotlight + оранж secondary glow.
 */
export function Slide_28_Direction_2() {
  return (
    <section className="relative w-full h-full overflow-hidden bg-black">
      {/* Двойной spotlight: лайм сверху + оранж снизу для атмосферы */}
      <Spotlight className="-top-40 right-0 md:right-20 md:-top-20" fill="#B6FF00" />
      <Spotlight className="bottom-0 right-[10cqw] md:bottom-[-20cqh]" fill="#FC5C02" />

      {/* === iPhone 360° видео справа === */}
      <div
        className="pointer-events-none absolute top-0 bottom-0 z-[2] flex items-center justify-center"
        style={{ width: "55cqw", left: 0 }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          src="/videos/iphone_360_transparent.webm"
          className="w-full h-full object-contain"
          style={{ background: "transparent" }}
        />
      </div>

      {/* === Текст слева === */}
      <div
        className="pointer-events-none relative z-10 h-full flex flex-col justify-center"
        style={{
          paddingRight: "calc(var(--sd-speaker-zone, 30cqw) + 48px)",
          paddingLeft: "48px",
        }}
      >
        <div className="flex flex-col gap-6" style={{ maxWidth: "min(720px, 45cqw)" }}>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00]"
          >
            // НАПРАВЛЕНИЕ 2
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase text-white leading-[1.05] tracking-[-0.04em]"
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(28px, 3cqw, 56px)",
            }}
          >
            СВОЙ{" "}
            <span className="bg-[#B6FF00] text-black px-[0.12em] py-[0.02em] rounded-[0.1em]">
              ПРОДУКТ
            </span>
            <br />
            ДЛЯ СВОЕЙ ЖИЗНИ
            <br />
            <span className="text-white/85">ИЛИ ДЛЯ МАСС.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="text-white text-base md:text-lg leading-snug mt-2"
            style={{ maxWidth: "min(860px, 100%)" }}
          >
            Идея в голове два года?{" "}
            <span className="text-[#B6FF00] font-semibold">Сделайте за две недели.</span>{" "}
            Опубликуйте. Зарабатывайте на пользователях.
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.05 }}
            className="text-white/65 text-sm md:text-base leading-relaxed -mt-2"
          >
            SaaS-решение, фитнес-трекер, заметки, дашборд. Любой сервис — твой.
          </motion.div>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 180 }}
            transition={{ duration: 0.7, delay: 1.25, ease: [0.25, 1, 0.5, 1] }}
            className="h-[2px] bg-[#B6FF00] mt-3"
          />
        </div>
      </div>
    </section>
  );
}
