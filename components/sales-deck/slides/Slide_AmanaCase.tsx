"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { IPhoneCarousel } from "../IPhoneCarousel";
import { Check } from "lucide-react";

/**
 * Кейс Александра «Amana BURAQ» — демо-MVP фронтенда мобильного инвест-приложения (#214).
 * iPhone-мокап со свайп-каруселью реальных экранов. NDA: без названия клиента/ниши, упор на уровень.
 * Идёт после Slide_104_CaseAuthor (кластер «мои проекты»).
 */
const SCREENS = [
  "/cards-gifs-screenshots/cases-amana/01-portfolio.png",
  "/cards-gifs-screenshots/cases-amana/02-market.png",
  "/cards-gifs-screenshots/cases-amana/06-asset-detail.png",
  "/cards-gifs-screenshots/cases-amana/08-buyflow.png",
  "/cards-gifs-screenshots/cases-amana/10-wallet.png",
  "/cards-gifs-screenshots/cases-amana/04-analytics.png",
  "/cards-gifs-screenshots/cases-amana/11-biometrics.png",
  "/cards-gifs-screenshots/cases-amana/13-widget.png",
];

const POINTS = [
  "Все экраны: портфель, маркет, сделки, кошелёк, вход по лицу, аналитика.",
  "Выглядит как приложение крупного банка — без дизайн-студии и команды.",
  "Один человек собрал то, под что обычно нанимают команду.",
];

export function Slide_AmanaCase() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="24cqw"
      contentMinWidth={500}
      background={<SlideBg theme="dark" variant="aura-tl" />}
      leftObject={<IPhoneCarousel images={SCREENS} interval={1800} />}
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3 self-start">
        // ЕЩЁ ОДИН МОЙ ПРОЕКТ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.02] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 1.6cqw, 30px)" }}
      >
        МОБИЛЬНОЕ ПРИЛОЖЕНИЕ ДЛЯ <span className="text-[#B6FF00]">ИНВЕСТ-ПЛАТФОРМЫ</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/70 text-sm md:text-lg leading-snug max-w-xl mb-5">
        Демо-версия мобильного приложения: все экраны, как у настоящего банковского сервиса. С ним компания выходила к инвесторам.
      </motion.div>

      <div className="flex flex-col gap-2.5 max-w-xl mb-5">
        {POINTS.map((p, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.5 + i * 0.13 }} className="flex items-start gap-2.5">
            <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#B6FF00]" strokeWidth={2.8} />
            <span className="text-white/85 text-sm md:text-base leading-snug">{p}</span>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.0 }} className="text-white/85 text-base md:text-lg leading-snug max-w-xl">
        Это и есть вайбкодинг — <span className="text-[#B6FF00] font-semibold">собирать продукты, которые раньше требовали студию</span>.
      </motion.div>
    </SlideLayout>
  );
}
