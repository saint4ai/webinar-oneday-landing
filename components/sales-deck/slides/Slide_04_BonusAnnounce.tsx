"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";
import { GiftBox3D } from "../GiftBox3D";

/**
 * Слайд 4 · Бонусы анонс — «БОНУСЫ ЗА ПРОСМОТР ДО КОНЦА»
 *
 * Подарок: реальный Higgsfield-рендер (v4_bonus2_giftbox_B) с float + tilt
 * вместо CSS-куба. Лайм-glow по периметру.
 *
 * 📐 Layout через SlideLayout (Grid) — НЕ absolute+padding.
 */
export function Slide_04_BonusAnnounce() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="28cqw"
      objectOverflow="visible"
      background={
        <Spotlight className="-top-40 left-0 md:left-20 md:-top-20" fill="#B6FF00" />
      }
      leftObject={<GiftBox3D size={400} />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // БОНУСЫ ЗА ПРОСМОТР ДО КОНЦА
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.05] tracking-[-0.03em]"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(28px, 3.4cqw, 50px)",
        }}
      >
        ДЛЯ ТЕХ КТО ПРОЙДЁТ ВОРКШОП{" "}
        <span className="bg-[#B6FF00] text-black px-[0.12em] py-[0.02em] rounded-[0.1em]">
          ДО КОНЦА
        </span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.65 }}
        className="text-white text-base md:text-lg leading-snug mt-6"
      >
        В конце эфира получите{" "}
        <span className="text-[#B6FF00] font-semibold">кодовое слово</span>. Отправите его мне в инстаграм — получите бонусы.
      </motion.div>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: 140 }}
        transition={{ duration: 0.7, delay: 0.95, ease: [0.25, 1, 0.5, 1] }}
        className="h-[2px] bg-[#B6FF00] mt-6"
      />
    </SlideLayout>
  );
}
