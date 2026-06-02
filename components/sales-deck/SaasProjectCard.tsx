"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Image from "next/image";

/**
 * SaasProjectCard — карточка реального SaaS-проекта для Slide 14.
 *
 * Браузер-хром (3 точки + URL-пилюля) → авто-галерея скриншотов (каждые 3 сек)
 * → подпись (название + URL) + tagline + короткое описание.
 *
 * Скриншоты реальные (из public/handouts/projects/...), не placeholder.
 * Уважает prefers-reduced-motion (карусель замирает на первом кадре).
 */
export interface SaasProjectCardProps {
  name: string;
  url: string;
  tagline: string;
  description: string;
  images: string[];
  accent?: "lime" | "orange";
  interval?: number;
  delay?: number;
}

export function SaasProjectCard({
  name,
  url,
  tagline,
  description,
  images,
  accent = "lime",
  interval = 3000,
  delay = 0,
}: SaasProjectCardProps) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const color = accent === "lime" ? "#B6FF00" : "#FC5C02";

  useEffect(() => {
    if (reduce || images.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % images.length), interval);
    return () => clearInterval(t);
  }, [images.length, interval, reduce]);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 1, 0.5, 1] }}
      className="relative flex flex-col rounded-2xl overflow-hidden h-full min-h-0"
      style={{
        background: "rgba(255,255,255,0.035)",
        border: `1px solid ${color}33`,
        boxShadow: `0 30px 70px -30px ${color}40`,
      }}
    >
      {/* Браузер-хром */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 shrink-0"
        style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
        <div
          className="ml-3 flex items-center gap-1.5 px-3 py-1 rounded-md font-mono text-[11px]"
          style={{ background: "rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.6)" }}
        >
          <span style={{ color, fontSize: "9px" }}>●</span>
          {url}
        </div>
      </div>

      {/* Авто-галерея скриншотов */}
      <div className="relative w-full flex-1 min-h-0 overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={reduce ? false : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <Image
              src={images[index]}
              alt={`${name} — экран ${index + 1}`}
              fill
              className="object-contain object-top"
              sizes="40vw"
              priority={index === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Прогресс-точки */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 18 : 6,
                  background: i === index ? color : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Подпись: название + tagline + описание */}
      <div className="flex flex-col gap-1 px-5 py-3.5 shrink-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h4
            className="font-bold uppercase leading-none"
            style={{ fontFamily: "var(--font-benzin)", fontSize: "clamp(17px, 1.4vw, 23px)" }}
          >
            {name}
          </h4>
          <span className="font-mono text-[11px] text-white/40">{url}</span>
        </div>
        <div className="text-[13px] md:text-sm font-semibold" style={{ color }}>
          {tagline}
        </div>
        <p className="text-white/50 text-[12px] md:text-[13px] leading-snug">{description}</p>
      </div>
    </motion.div>
  );
}
