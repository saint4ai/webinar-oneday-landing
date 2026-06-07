"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ArrowRight, MessageCircle, Gift } from "lucide-react";
import { OnAILogo } from "@/components/ui/onai-logo";
import { Highlighted } from "@/components/ui/highlighted";
import { FlyingGifts } from "@/components/ui/flying-gifts";
import { MetaPixelBase } from "@/components/meta-pixel-base";

/**
 * Thank You page — one-screen sales-driven CTA.
 * Цель: захватить юзера в WhatsApp-сообщество, где будет вся информация
 * и ссылка на живой эфир воркшопа.
 *
 * Композиция:
 *  - 3D floating emoji-подарки (параллакс, slow Y oscillation, GPU-accel)
 *  - One-shot wow-explosion на load (gifts + sparkles + confetti)
 *  - Sales-driven bonus mini-cards с Hormozi-промизами
 *  - MEGA pulsing CTA → WhatsApp-сообщество
 */

// Прямая ссылка на закрытое WhatsApp-сообщество воркшопа.
// Туда участники получают live-ссылку, материалы и общаются перед/во время эфира.
const WHATSAPP_COMMUNITY =
  "https://chat.whatsapp.com/HQXPFOfkqjRHgC07X8RTY4";

type BonusData = {
  number: string;
  image: string;
  title: string;
  promise: string; // Hormozi sales description
};

const BONUSES: BonusData[] = [
  {
    number: "01",
    image: "/bonuses/bonus-1-v4.avif",
    title: "Автопилот рекламы",
    promise:
      "Запусти рекламу в Facebook без таргетолога — Claude сам соберёт креативы и кампании.",
  },
  {
    number: "02",
    image: "/bonuses/bonus-2.avif",
    title: "33 промта по маркетингу",
    promise:
      "Готовая библиотека промтов — продвигай себя и свои продукты без копирайтера.",
  },
  {
    number: "03",
    image: "/bonuses/bonus-3-v4.avif",
    title: "Гайд по старту в вайбкодинге",
    promise:
      "От идеи до собственной полноценной платформы — пошагово, без программирования и команды.",
  },
];

// Yandex Metrika type (window.ym)
declare global {
  interface Window {
    ym?: (id: number, action: string, target?: string) => void;
  }
}

const YM_ID = 109147153;
const GOAL_LEAD = "lead_workshop";

export default function ThankYouPage() {
  const reduced = useReducedMotion();

  // Конверсия: пользователь дошёл до Thank You = lead подтверждён
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.ym === "function") {
      window.ym(YM_ID, "reachGoal", GOAL_LEAD);
    }
    // Facebook Pixel 'Lead' шлётся на сабмит формы (register-modal / final-cta)
    // с общим event_id + серверный дубль через Conversions API в /api/lead.
    // Здесь НЕ дублируем, чтобы не плодить событие на refresh / прямой заход.
  }, []);

  return (
    <main className="relative od-root overflow-hidden min-h-[100dvh] flex flex-col">
      {/* Meta Pixel — ТОЛЬКО на лендинге и thank-you (не в layout) */}
      <MetaPixelBase />

      {/* Brand bg */}
      <div className="od-blob-orange" />
      <div className="od-blob-lime" />
      <div className="od-grid" />
      <div className="od-noise" />
      <div className="od-vignette" />

      {/* 2 floating 3D emoji подарка (параллакс, медленные) */}
      {!reduced && <FloatingGiftEmojis />}

      {/* One-shot wow-взрыв на load */}
      {!reduced && <FlyingGifts />}

      {/* Compact header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-50 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-3 sm:py-4 flex items-center justify-between gap-3 shrink-0"
      >
        <Link href="/" aria-label="На главную">
          <OnAILogo className="h-5 sm:h-6" />
        </Link>
        <Link
          href="/"
          className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-white/45 hover:text-white transition-colors"
        >
          ← на главную
        </Link>
      </motion.header>

      {/* HERO */}
      <section className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-4 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-[900px] text-center relative"
        >
          {/* Check icon */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.55,
              ease: [0.34, 1.56, 0.64, 1],
              delay: 0.15,
            }}
            className="inline-flex w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#cdeb52]/15 border-2 border-[#cdeb52]/50 items-center justify-center mb-4 sm:mb-5"
            style={{
              boxShadow: "0 10px 40px -8px rgba(205, 235, 82, 0.45)",
            }}
          >
            <Check
              size={24}
              strokeWidth={3}
              className="text-[#cdeb52] sm:hidden"
            />
            <Check
              size={28}
              strokeWidth={3}
              className="text-[#cdeb52] hidden sm:block"
            />
          </motion.div>

          {/* MAIN H1 — Highlighted с wrap=true позволяет плашке
              «WhatsApp-сообщество» переноситься на узком mobile (344px шире 320px). */}
          <h1
            className="uppercase text-white mb-3 sm:mb-4"
            style={{
              fontFamily:
                "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(22px, 4.4vw, 50px)",
              lineHeight: 1.3,
              letterSpacing: "-0.015em",
            }}
          >
            Ты записан.
            <br />
            Вступай в{" "}
            <Highlighted delay={0.3} duration={0.7} wrap>
              WhatsApp-сообщество
            </Highlighted>
            <br />
            <span className="text-white/55">забери</span>{" "}
            <span className="text-[#fc5c02]">3 бонуса</span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/65 text-[13px] sm:text-[15px] lg:text-[16px] leading-relaxed max-w-[620px] mx-auto mb-5 sm:mb-7">
            В сообществе будет{" "}
            <span className="text-white font-bold">ссылка на живой эфир</span>,
            3 бонуса, детали воркшопа и общение с участниками.
          </p>

          {/* 3 bonus cards с Hormozi-описаниями */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-5 sm:mb-7 max-w-[820px] mx-auto">
            {BONUSES.map((b, idx) => (
              <BonusCard key={b.number} bonus={b} index={idx} reduced={!!reduced} />
            ))}
          </div>

          {/* MEGA CTA */}
          <motion.a
            href={WHATSAPP_COMMUNITY}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ y: 0, scale: 0.99 }}
            animate={
              reduced
                ? {}
                : {
                    boxShadow: [
                      "0 20px 50px -10px rgba(205, 235, 82, 0.55), 0 0 0 0 rgba(205, 235, 82, 0.4)",
                      "0 25px 60px -10px rgba(205, 235, 82, 0.75), 0 0 0 16px rgba(205, 235, 82, 0)",
                      "0 20px 50px -10px rgba(205, 235, 82, 0.55), 0 0 0 0 rgba(205, 235, 82, 0.4)",
                    ],
                  }
            }
            transition={{
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            className="group relative inline-flex items-center justify-center gap-3 bg-[#cdeb52] text-black py-4 px-7 sm:py-5 sm:px-12 rounded-2xl text-[15px] sm:text-[18px] lg:text-[19px] font-bold uppercase tracking-wide w-full sm:w-auto max-w-[620px]"
            style={{
              fontFamily:
                "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 800,
            }}
          >
            <MessageCircle
              size={22}
              strokeWidth={2.5}
              className="shrink-0"
            />
            <span className="text-center">Вступить в сообщество</span>
            <ArrowRight
              size={22}
              strokeWidth={2.5}
              className="shrink-0 group-hover:translate-x-1 transition-transform"
            />
          </motion.a>

          {/* Bouncing arrow на mobile */}
          {!reduced && (
            <motion.div
              animate={{ y: [0, 4, 0] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="mt-3 text-[#cdeb52]/60 text-[18px] sm:hidden"
              aria-hidden
            >
              ↑
            </motion.div>
          )}

          {/* Microcopy */}
          <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5 text-[11px] sm:text-[12px] font-mono uppercase tracking-[0.14em]">
            <span className="text-white/45 inline-flex items-center gap-1.5">
              <Gift size={12} strokeWidth={2.5} className="text-[#fc5c02]" />
              3 бонуса · бесплатно
            </span>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-white/20" />
            <span className="text-white/45">живой эфир · записи не будет</span>
          </div>
        </motion.div>
      </section>

      {/* Compact footer */}
      <footer className="relative z-10 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-3 sm:py-4 text-white/25 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-center shrink-0">
        onAI.academy · 2026
      </footer>
    </main>
  );
}

/* ═══ COMPONENTS ═══ */

/**
 * Sales-driven bonus card с описанием Hormozi-стиля.
 * Conic-gradient glow border (orange→lime, вращается).
 */
const BonusCard = ({
  bonus,
  index,
  reduced,
}: {
  bonus: BonusData;
  index: number;
  reduced: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 14, scale: 0.92 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1],
      delay: 0.5 + index * 0.1,
    }}
    whileHover={{ y: -3, transition: { duration: 0.2 } }}
    className="bc-shell"
  >
    {/* MOBILE: компактный horizontal pill (без promise) */}
    <div className="bc-inner rounded-2xl p-2.5 sm:p-4 flex sm:flex-col items-center sm:text-center gap-2.5 sm:gap-2 h-full text-left">
      <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-black/40 ring-1 ring-white/15 shrink-0">
        <Image
          src={bonus.image}
          alt={bonus.title}
          fill
          sizes="(max-width: 640px) 40px, 56px"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col sm:items-center gap-0.5 sm:gap-2 min-w-0 flex-1">
        <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.16em] text-[#fc5c02]">
          БОНУС {bonus.number}
        </span>
        <h3
          className="text-white text-[11px] sm:text-[13px] font-bold uppercase tracking-wide leading-tight"
          style={{
            fontFamily:
              "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 700,
          }}
        >
          {bonus.title}
        </h3>
        {/* Promise виден только на sm+ — экономия места на mobile */}
        <p className="hidden sm:block text-white/55 text-[12px] leading-snug">
          {bonus.promise}
        </p>
      </div>
    </div>

    <style jsx>{`
      @property --bc-rotate {
        syntax: "<angle>";
        inherits: true;
        initial-value: ${index * 90}deg;
      }
      .bc-shell {
        position: relative;
        border-radius: 18px;
        padding: 1.5px;
        background: conic-gradient(
          from var(--bc-rotate),
          #fc5c02 0deg,
          #ff7424 60deg,
          #cdeb52 180deg,
          #ff7424 300deg,
          #fc5c02 360deg
        );
        ${reduced ? "" : "animation: bc-spin 10s linear infinite;"}
        box-shadow: 0 12px 32px -10px rgba(252, 92, 2, 0.35),
          0 0 18px -4px rgba(205, 235, 82, 0.2);
      }
      .bc-inner {
        background: #0a0a0c;
      }
      @keyframes bc-spin {
        from {
          --bc-rotate: 0deg;
        }
        to {
          --bc-rotate: 360deg;
        }
      }
    `}</style>
  </motion.div>
);

/**
 * 2 floating 3D emoji-подарка с параллакс-эффектом.
 * GPU-accelerated (only transform), lightweight на всех viewport.
 * Mobile: 50px, Tablet: 80px, Desktop: 110-130px.
 * pointer-events:none — не блокируют клики на CTA.
 */
const FloatingGiftEmojis = () => (
  <>
    {/* Левый верхний — gift */}
    <motion.div
      className="absolute z-[2] pointer-events-none"
      style={{
        top: "10%",
        left: "4%",
        width: "clamp(48px, 8vw, 110px)",
        height: "clamp(48px, 8vw, 110px)",
        filter: "drop-shadow(0 12px 28px rgba(252,92,2,0.4))",
        willChange: "transform",
      }}
      initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -10, 0, -6, 0],
        rotate: [-8, 2, -8, 4, -8],
      }}
      transition={{
        opacity: { duration: 0.8, delay: 0.6 },
        scale: { duration: 0.8, delay: 0.6, ease: [0.34, 1.56, 0.64, 1] },
        y: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.4 },
        rotate: {
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.4,
        },
      }}
      aria-hidden
    >
      <Image
        src="/emoji/gift-1.png"
        alt=""
        width={110}
        height={110}
        className="w-full h-full"
        priority
      />
    </motion.div>

    {/* Правый нижний — party popper */}
    <motion.div
      className="absolute z-[2] pointer-events-none"
      style={{
        bottom: "14%",
        right: "4%",
        width: "clamp(54px, 9vw, 130px)",
        height: "clamp(54px, 9vw, 130px)",
        filter: "drop-shadow(0 12px 28px rgba(205,235,82,0.4))",
        willChange: "transform",
      }}
      initial={{ opacity: 0, scale: 0.6, rotate: 20 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -8, 0, -12, 0],
        rotate: [6, -4, 6, -2, 6],
      }}
      transition={{
        opacity: { duration: 0.8, delay: 0.9 },
        scale: { duration: 0.8, delay: 0.9, ease: [0.34, 1.56, 0.64, 1] },
        y: { duration: 8.5, repeat: Infinity, ease: "easeInOut", delay: 1.6 },
        rotate: {
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.6,
        },
      }}
      aria-hidden
    >
      <Image
        src="/emoji/party-popper.png"
        alt=""
        width={130}
        height={130}
        className="w-full h-full"
        priority
      />
    </motion.div>
  </>
);

