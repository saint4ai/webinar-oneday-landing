"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/** Слайд 170 · Финальный кадр. Текст 1-в-1 STRUCTURE 2331-2332. */
export function Slide_170_FinalFrame() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.h1
        initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.0, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase leading-[0.95] tracking-[-0.04em] mb-6"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(48px, 7vw, 140px)", color: "#B6FF00", textShadow: "0 0 90px rgba(182,255,0,0.3)" }}
      >
        УВИДИМСЯ
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.8 }} className="flex items-center gap-3 text-white/75 text-base md:text-2xl font-medium">
        <span className="text-[#B6FF00]">@saint4ai</span>
        <span className="text-white/30">·</span>
        <span>onai.academy</span>
      </motion.div>
    </SlideLayout>
  );
}
