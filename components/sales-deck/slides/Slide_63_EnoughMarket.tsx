"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { MarkerReveal } from "../MarkerReveal";

/**
 * Слайд 63 · Рынка хватит всем. Текст 1-в-1 STRUCTURE 779-783.
 * СВЕТЛЫЙ statement-слайд (light fintech_aura), крупная типографика.
 */
const INK = "#2A2520";
const INK_MUTED = "#6E6354";
const ORANGE = "#FC5C02";

export function Slide_63_EnoughMarket() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={760}
      style={{ background: "var(--brand-cream)" }}
      background={<SlideBg theme="light" variant="light-warm" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-bold mb-5"
        style={{ color: ORANGE }}
      >
        // НИША ТОЛЬКО ЗАРОЖДАЕТСЯ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase leading-[0.98] tracking-[-0.03em] mb-6"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(44px, 6cqw, 104px)", color: INK }}
      >
        РЫНКА ХВАТИТ{" "}
        <MarkerReveal color="#B6FF00" textColor={INK} delay={0.7}>ВСЕМ</MarkerReveal>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="text-lg md:text-2xl leading-snug max-w-2xl mb-3"
        style={{ color: INK }}
      >
        Ниша только зарождается — и начинается <span style={{ color: ORANGE, fontWeight: 700 }}>с нас</span>.
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.75 }}
        className="text-base md:text-lg max-w-2xl"
        style={{ color: INK_MUTED }}
      >
        На нём просто не хватает толковых специалистов.
      </motion.div>
    </SlideLayout>
  );
}
