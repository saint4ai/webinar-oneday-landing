"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { ChecklistItem } from "../ChecklistItem";

/**
 * Слайд 8 · Что получите — «КАКИЕ ЗНАНИЯ ВЫ ЗАБЕРЕТЕ С СОБОЙ»
 * Sub под H1 + 4 пункта с лайм-стрелками →
 */
const BENEFITS = [
  "Поймёте как устроен вайбкодинг — простыми словами",
  "Увидите 5 живых примеров что собирают ученики без знания программирования",
  "Соберёте сами своё первое Android-приложение",
  "Поймёте подходит вам это или нет",
];

export function Slide_08_Benefits() {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      <Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />
      <Spotlight className="bottom-0 right-[10vw] md:bottom-[-20vh]" fill="#FC5C02" />

      <div
        className="relative z-10 h-full flex flex-col justify-center"
        style={{
          paddingRight: "calc(var(--sd-speaker-zone, 30vw) + 48px)",
          paddingLeft: "48px",
        }}
      >
        <div className="flex flex-col gap-8" style={{ maxWidth: "min(900px, 58vw)" }}>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00]"
          >
            // ЧТО ПОЛУЧИТЕ
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase text-white leading-[1.05] tracking-[-0.03em]"
            style={{
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(34px, 4.2vw, 64px)",
            }}
          >
            КАКИЕ ЗНАНИЯ ВЫ <span className="text-[#B6FF00]">ЗАБЕРЕТЕ</span> С СОБОЙ
          </motion.h1>

          {/* 4 пункта со стрелками (icon="arrow") */}
          <div className="flex flex-col gap-3">
            {BENEFITS.map((text, i) => (
              <ChecklistItem key={i} index={i} icon="arrow" staggerMs={180}>
                {text}
              </ChecklistItem>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
