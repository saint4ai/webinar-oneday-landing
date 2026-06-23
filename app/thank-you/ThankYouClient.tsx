"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { OnAILogo } from "@/components/ui/onai-logo";
import { MetaPixelBase } from "@/components/meta-pixel-base";
import { WhatsAppCommunityCTA } from "./WhatsAppCommunityCTA";

/**
 * Thank You — мост в закрытое WhatsApp-СООБЩЕСТВО воркшопа.
 *
 * Флоу: форма → /api/lead → /thank-you → этот экран: «ты записан» + надёжная
 * кнопка-диплинк «Вступить в сообщество» (Android intent:// / iOS-нудж «открой
 * в Safari» / копирование) + через 2.5с авто-редирект в сообщество.
 *
 * Ссылка сообщества приходит пропом (server component читает рантайм-файл,
 * управляемый Telegram-ботом — может меняться без пересборки).
 *
 * На загрузке (НЕ ломать): Я.Метрика цель lead_workshop + Meta Pixel base.
 * Pixel 'Lead' шлётся на сабмите формы + серверный дубль через CAPI — здесь НЕ дублируем.
 */

const YM_ID = 109147153;
const GOAL_LEAD = "lead_workshop";
const REDIRECT_DELAY_MS = 2500;

// Yandex Metrika type (window.ym)
declare global {
  interface Window {
    ym?: (id: number, action: string, target?: string) => void;
  }
}

export default function ThankYouClient({
  communityHref,
}: {
  communityHref: string;
}) {
  const reduced = useReducedMotion();

  useEffect(() => {
    // Конверсия: дошёл до Thank You = lead подтверждён.
    if (typeof window !== "undefined" && typeof window.ym === "function") {
      window.ym(YM_ID, "reachGoal", GOAL_LEAD);
    }
    // Авто-редирект в сообщество. В обычном браузере (Safari/Chrome) откроет
    // WhatsApp / страницу инвайта; во встроенном браузере Instagram авто-редирект
    // ненадёжен — там сработает кнопка-диплинк ниже (Android intent / iOS-нудж).
    const t = setTimeout(() => {
      window.location.href = communityHref;
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(t);
  }, [communityHref]);

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
          className="w-full max-w-[640px] text-center relative"
        >
          {/* Check icon */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 }}
            className="inline-flex w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#cdeb52]/15 border-2 border-[#cdeb52]/50 items-center justify-center mb-4 sm:mb-5"
            style={{ boxShadow: "0 10px 40px -8px rgba(205, 235, 82, 0.45)" }}
          >
            <Check size={24} strokeWidth={3} className="text-[#cdeb52] sm:hidden" />
            <Check
              size={28}
              strokeWidth={3}
              className="text-[#cdeb52] hidden sm:block"
            />
          </motion.div>

          {/* H1 */}
          <h1
            className="uppercase text-white mb-3 sm:mb-4"
            style={{
              fontFamily:
                "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(24px, 4.6vw, 48px)",
              lineHeight: 1.25,
              letterSpacing: "-0.015em",
            }}
          >
            Готово!
            <br />
            Ты записан
          </h1>

          {/* Subtitle */}
          <p className="text-white/70 text-[14px] sm:text-[16px] leading-relaxed max-w-[520px] mx-auto mb-3">
            Последний шаг — вступи в закрытое{" "}
            <span className="text-white font-bold">WhatsApp-сообщество</span>.
            Там ссылка на живой эфир воркшопа, бонусы и напоминание за час до старта.
          </p>

          {/* Важное предупреждение */}
          <p className="text-[13px] sm:text-[14px] leading-relaxed max-w-[520px] mx-auto mb-6 sm:mb-7 text-[#fc5c02] font-semibold">
            Без входа в сообщество ты не получишь ссылку на эфир. Жми кнопку ниже.
          </p>

          {/* MEGA-CTA — надёжный диплинк в сообщество (Android intent / iOS-нудж / копия) */}
          <WhatsAppCommunityCTA href={communityHref} />

          {/* Спиннер «переводим» (авто-редирект подстрахует тех, у кого браузер обычный) */}
          <div className="flex items-center justify-center gap-2.5 mt-6">
            {!reduced && (
              <motion.span
                className="w-4 h-4 rounded-full border-2 border-[#cdeb52]/30 border-t-[#cdeb52]"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                aria-hidden
              />
            )}
            <span className="font-mono text-[11px] sm:text-[12px] uppercase tracking-[0.16em] text-white/55">
              Открываем сообщество…
            </span>
          </div>

          {/* Microcopy */}
          <p className="mt-4 text-white/40 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.14em]">
            не открылось? нажми кнопку выше
          </p>
        </motion.div>
      </section>

      {/* Compact footer */}
      <footer className="relative z-10 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-3 sm:py-4 text-white/25 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-center shrink-0">
        onAI.academy · 2026
      </footer>
    </main>
  );
}
