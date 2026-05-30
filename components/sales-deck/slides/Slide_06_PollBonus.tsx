"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { QuestionMarkPulse } from "../QuestionMarkPulse";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 6 · Engagement — «БОНУСЫ ЗА ПРОСМОТР ДО КОНЦА?»
 * Большой пульсирующий «?» слева + заголовок справа.
 *
 * 📐 Layout через SlideLayout (Grid).
 */
export function Slide_06_PollBonus() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="28vw"
      objectOverflow="visible"
      background={
        <>
          <Spotlight className="-top-40 right-0 md:right-20 md:-top-20" fill="#B6FF00" />
          <Spotlight className="bottom-0 left-[10vw] md:bottom-[-20vh]" fill="#FC5C02" />
        </>
      }
      leftObject={
        <div className="flex items-center justify-center w-full h-full">
          <QuestionMarkPulse symbol="?" />
        </div>
      }
    >
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[0.95] tracking-[-0.03em]"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(28px, 3.6vw, 56px)",
        }}
      >
        БОНУСЫ <br />
        ЗА <span className="bg-[#B6FF00] text-black px-[0.12em] py-[0.02em] rounded-[0.1em]">ПРОСМОТР</span>
        <br />
        ДО КОНЦА?
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="text-white/75 text-base md:text-xl leading-snug mt-6 max-w-md"
      >
        Напишите в чат — стоит того, чтобы посмотреть до конца?
      </motion.div>
    </SlideLayout>
  );
}
