"use client";
import React from "react";
import { motion } from "framer-motion";
import { CodeTerminal } from "./code-terminal";
import { GlitchImage } from "./glitch-image";

/**
 * Контейнер для фото Александра.
 * БЕЗ лампы. Чистая премиум-рамка: тёмный grid + угловые акценты + оранжевая тень + маска снизу.
 */
export const PortraitFrame = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.9, ease: "easeOut" }}
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: "#0a0a0a",
        backgroundImage: `
          radial-gradient(ellipse at top, rgba(252, 92, 2, 0.14) 0%, rgba(0,0,0,0) 60%),
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 48px 48px, 48px 48px",
        boxShadow: `
          0 0 0 1px rgba(255,255,255,0.06),
          0 40px 80px -20px rgba(252, 92, 2, 0.3),
          0 30px 60px -15px rgba(0, 0, 0, 0.8),
          inset 0 1px 0 0 rgba(255,255,255,0.04)
        `,
      }}
    >
      {/* Фото + терминал ЗА ним */}
      <div
        className="relative aspect-[4/5] w-full"
        style={{
          maskImage:
            "linear-gradient(to bottom, black 0%, black 88%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 88%, transparent 100%)",
        }}
      >
        {/* Анимированный terminal — z-0 (за фото) */}
        <CodeTerminal />

        {/* Александр — z-10, alpha-cutout + лёгкий глитч раз в 3 секунды */}
        <GlitchImage
          src="/alex-cutout.avif"
          alt="Александр — основатель onAI.academy"
          className="absolute inset-0"
          intervalMs={3000}
        />
      </div>

      {/* Подпись под фото — в одну строку */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 w-max max-w-[calc(100%-1.5rem)]">
        <div className="bg-black/85 backdrop-blur-xl border border-white/15 rounded-full px-4 sm:px-5 py-2 flex items-center gap-2 sm:gap-2.5 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#cdeb52] animate-pulse flex-shrink-0" />
          <span className="font-bold text-[13px] sm:text-sm text-white">
            Александр
          </span>
          <span className="text-white/25 text-xs">·</span>
          <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.16em] text-white/55">
            founder onAI.academy
          </span>
        </div>
      </div>

      {/* Угловые акценты */}
      <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#fc5c02]/40 rounded-tl-2xl" />
      <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#fc5c02]/40 rounded-tr-2xl" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#cdeb52]/30 rounded-bl-2xl" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#cdeb52]/30 rounded-br-2xl" />
    </motion.div>
  );
};
