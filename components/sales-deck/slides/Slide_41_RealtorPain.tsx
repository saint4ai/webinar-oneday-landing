"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { NicheTag } from "../NicheTag";

/**
 * Слайд 41 · Боль — Риелтор. Текст 1-в-1 STRUCTURE 455-469.
 * Higgsfield-сцена (уставший риелтор за ноутом) слева + orange-pain фон.
 * Счётчик 40 мин × 30 = 30 часов. Пара к Slide 42 (решение).
 */
const PLATFORMS = [
  { n: "Krisha", t: "факты: метраж, ремонт, этаж", c: "#13B45A" },
  { n: "Instagram", t: "эмоции: «солнце с балкона»", c: "#E1306C" },
  { n: "OLX", t: "коротко: цена, район, контакт", c: "#7AC143" },
  { n: "Threads", t: "живой пост для семьи", c: "#FFFFFF" },
];

export function Slide_41_RealtorPain() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="28cqw"
      contentMinWidth={500}
      background={<SlideBg theme="dark" variant="orange-pain" />}
      leftObject={
        <div className="relative h-full w-full overflow-hidden">
          <Image src="/handouts/niches/pain_realtor.png" alt="Уставший риелтор за ноутом — рутина объявлений" fill className="object-cover object-center" sizes="35vw" priority />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 50%, rgba(10,11,15,0.55) 80%, #0A0B0F)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,11,15,0.5), transparent 30%)" }} />
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center gap-3 mb-3"
      >
        <NicheTag label="РИЕЛТОР" tone="orange" />
        <span className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold" style={{ color: "#FC5C02" }}>// БОЛЬ</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.02em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 2.9cqw, 44px)" }}
      >
        РИЕЛТОР СПИСЫВАЕТ <span style={{ color: "#FC5C02" }}>30 ЧАСОВ В МЕСЯЦ</span> НА ОБЪЯВЛЕНИЯ
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="text-white/65 text-sm md:text-base leading-snug max-w-xl mb-5"
      >
        Каждая квартира — 40 минут писанины. Каждая площадка хочет своего тона.
      </motion.div>

      {/* 4 площадки — каждая свой тон */}
      <div className="flex flex-col gap-2 max-w-xl mb-5">
        {PLATFORMS.map((p, i) => (
          <motion.div
            key={p.n}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
            className="flex items-center gap-2.5"
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.c, boxShadow: `0 0 8px ${p.c}` }} />
            <span className="text-white font-semibold text-sm w-[92px] shrink-0">{p.n}</span>
            <span className="text-white/50 text-xs md:text-sm leading-tight">{p.t}</span>
          </motion.div>
        ))}
      </div>

      {/* Уравнение-счётчик */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.1 }}
        className="inline-flex items-baseline gap-2.5 rounded-xl px-4 py-3 mb-4"
        style={{ background: "rgba(252,92,2,0.1)", border: "1px solid rgba(252,92,2,0.35)" }}
      >
        <span className="font-mono text-sm text-white/70">40 мин × 30 квартир =</span>
        <span className="font-bold leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(28px,3cqw,44px)", color: "#FC5C02", textShadow: "0 0 30px rgba(252,92,2,0.4)" }}>30 ЧАСОВ</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="text-white/45 text-xs md:text-sm leading-snug max-w-xl"
      >
        Агентство с 10 риелторами → <span className="text-white/80 font-semibold">300+ часов в месяц</span> утекает в текст. Кто копипастит на все площадки — проигрывает агентствам с грамотными.
      </motion.div>
    </SlideLayout>
  );
}
