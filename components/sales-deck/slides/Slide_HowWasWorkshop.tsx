"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Финал · Engagement «Как вам воркшоп, друзья?».
 * Идёт ПОСЛЕ «Спасибо, что остались / увидимся», ПЕРЕД финал-кадром. Гонит активность в чат на самом выходе.
 */
export function Slide_HowWasWorkshop() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="climax" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // НАПИШИ В ЧАТ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.75, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[0.98] tracking-[-0.03em] mb-5"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3.4cqw, 61px)" }}
      >
        КАК ВАМ <span className="text-[#B6FF00]">ВОРКШОП</span>, ДРУЗЬЯ?
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="text-white/65 text-base md:text-xl max-w-2xl">
        Что забираешь в работу уже сегодня? Напиши одним словом в чат — мне правда важно.
      </motion.div>
    </SlideLayout>
  );
}
