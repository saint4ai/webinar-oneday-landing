"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "../AnimatedNumber";

/**
 * Слайд 1.2 (или 2.x) · Authority statement
 * «900+ учеников за 1.5 года»
 * Layout: hero — большая анимированная цифра по центру с pulse-border
 */
export function Slide_02_Authority() {
  return (
    <section
      className="relative w-full h-screen overflow-hidden bg-black flex flex-col justify-center"
      style={{
        paddingLeft: "calc(var(--sd-speaker-zone, 30vw) + 48px)",
        paddingRight: "48px",
      }}
    >
      <div className="flex flex-col gap-10 max-w-[1100px] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00]"
        >
          // ЭТО НЕ ПЕРВЫЙ МОЙ ПОТОК
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
          className="font-bold uppercase text-white leading-[1.05] tracking-[-0.03em]"
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(40px, 4.5vw, 80px)",
          }}
        >
          За последние <span className="text-[#B6FF00]">1,5 года</span> в onAI Academy<br />я обучил...
        </motion.h2>

        {/* Большая цифра 900+ с pulse-border */}
        <div className="flex items-center justify-start mt-6">
          <AnimatedNumber
            value={900}
            suffix="+"
            duration={2.2}
            size="xl"
            label="учеников · внедрение ИИ-менеджеров в бизнесы"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 2.5 }}
          className="text-white/70 text-lg md:text-xl leading-relaxed max-w-[700px] mt-4"
        >
          Это не первый поток. Это <span className="text-white font-semibold">проверенная программа</span>,
          которая уже принесла результат сотням людей.
        </motion.div>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 180 }}
          transition={{ duration: 0.7, delay: 2.8 }}
          className="h-[2px] bg-[#B6FF00] mt-2"
        />
      </div>
    </section>
  );
}
