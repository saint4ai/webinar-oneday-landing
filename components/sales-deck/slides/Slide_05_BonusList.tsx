"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { LiquidBackground } from "../LiquidBackground";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 5 · Список бонусов — «ТРИ БОНУСА В КОНЦЕ»
 * Реальные Higgsfield-карточки (v4_bonus*) внутри glassmorphism-плиток
 * с rounded-3xl + лайм/оранж glow по периметру.
 *
 * 📐 Layout через SlideLayout (Grid), без leftObject — content шире.
 */
const BONUSES = [
  {
    num: "01",
    img: "/bonuses/bonus-1.png",
    title: "Гайд по Android",
    body: "Своё рабочее приложение соберёшь за 30 минут с Google AI Studio.",
    accent: "lime" as const,
  },
  {
    num: "02",
    img: "/bonuses/bonus-2.png",
    title: "30 промптов",
    body: "30 маркетинговых промптов для продвижения своих продуктов.",
    accent: "orange" as const,
  },
  {
    num: "03",
    img: "/bonuses/bonus-3.png",
    title: "Чек-лист 9 сервисов",
    body: "Какие сервисы в спросе, что покупает бизнес и что сейчас востребовано.",
    accent: "lime" as const,
  },
];

const ACCENT = { lime: "#B6FF00", orange: "#FC5C02" };

export function Slide_05_BonusList() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={640}
      background={
        <>
          <LiquidBackground variant="liquid-metal" opacity={0.18} />
          <Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />
        </>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // СПИСОК БОНУСОВ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-7"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(30px, 3.6cqw, 52px)",
        }}
      >
        ТРИ БОНУСА <span className="text-[#B6FF00]">В КОНЦЕ</span>
      </motion.h1>

      {/* 3 бонус-карточки в ряд: PNG-карточка (Higgsfield) + краткое описание под ней. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "20px" }}>
        {BONUSES.map((b, i) => {
          const color = ACCENT[b.accent];
          return (
            <motion.div
              key={b.num}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.18, ease: [0.25, 1, 0.5, 1] }}
              className="flex flex-col gap-3"
            >
              <motion.div
                whileHover={{ y: -6 }}
                className="relative rounded-3xl overflow-hidden border border-white/10 group"
                style={{
                  background: "#0a0a0a",
                  boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 30px 60px -25px ${color}55, 0 0 50px -15px ${color}40`,
                }}
              >
                <div className="relative w-full aspect-[4/5]">
                  <Image
                    src={b.img}
                    alt={b.title}
                    fill
                    sizes="(max-width: 1280px) 28vw, 320px"
                    className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                    priority={i === 0}
                  />
                </div>
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 1.5px ${color}80, 0 0 40px ${color}40` }}
                />
              </motion.div>
              <p className="text-white/70 text-[13px] md:text-sm leading-snug text-center px-1">
                {b.body}
              </p>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}
