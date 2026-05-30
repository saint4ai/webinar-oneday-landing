"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { GlitchText } from "../GlitchText";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 11 · Engagement пожар — «КАК ВАМ ТАКОЙ ФОРМАТ?»
 * Огромный «ОГОНЬ» прижат по правому краю content-колонки + 3D fire emoji слева от него.
 * 📐 SlideLayout с зоной спикера справа (25-30vw).
 *
 * АЛЕКСАНДР: «Терминатор-рука из лавы — 5 сек через Higgsfield» → TODO.
 */
export function Slide_11_PollFire() {
  return (
    <SlideLayout
      speakerSide="right"
      contentClassName="items-end text-right"
      background={
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none z-[1]"
          style={{
            background:
              "radial-gradient(ellipse at center bottom, rgba(252,92,2,0.35) 0%, rgba(182,255,0,0.12) 35%, transparent 70%)",
          }}
        />
      }
    >
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="font-bold uppercase text-white leading-[1.05] tracking-[-0.02em] mb-4"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(26px, 3vw, 44px)",
        }}
      >
        КАК ВАМ ТАКОЙ ФОРМАТ?
      </motion.h2>

      {/* ОГОНЬ + 3D-эмодзи в одной строке */}
      <div className="flex items-center justify-end gap-4 md:gap-6 w-full">
        {/* 3D fire emoji — плавающий, слева от слова */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: 0,
            y: [0, -12, 0],
          }}
          transition={{
            opacity: { duration: 0.5, delay: 0.4 },
            scale: { duration: 0.5, delay: 0.4 },
            rotate: { duration: 0.5, delay: 0.4 },
            y: { duration: 2.4, ease: "easeInOut", repeat: Infinity, delay: 0.9 },
          }}
          className="relative shrink-0"
          style={{
            width: "clamp(90px, 12vw, 180px)",
            height: "clamp(90px, 12vw, 180px)",
            filter: "drop-shadow(0 0 50px rgba(252,92,2,0.75)) drop-shadow(0 0 90px rgba(252,92,2,0.45))",
          }}
        >
          <Image
            src="/handouts/emoji/fire_3d.png"
            alt="🔥"
            fill
            sizes="(max-width: 1280px) 11vw, 180px"
            className="object-contain"
            priority
          />
        </motion.div>

        {/* Огромное ОГОНЬ */}
        <GlitchText
          text="ОГОНЬ"
          intensity="subtle"
          loop
          className="font-bold uppercase leading-[0.9] tracking-[-0.04em]"
          style={{
            color: "#B6FF00",
            fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(90px, 12vw, 220px)",
            textShadow:
              "0 0 60px rgba(182,255,0,0.55), 0 0 120px rgba(252,92,2,0.4)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="text-white/75 text-sm md:text-base font-mono uppercase tracking-[0.1em] mt-8"
      >
        Напишите в чат слово «ОГОНЬ» если готовы
      </motion.div>
    </SlideLayout>
  );
}
