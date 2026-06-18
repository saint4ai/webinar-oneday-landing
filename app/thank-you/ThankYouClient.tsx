"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { OnAILogo } from "@/components/ui/onai-logo";
import { MetaPixelBase } from "@/components/meta-pixel-base";
import { collectMetaClientData } from "@/lib/meta-pixel";

/**
 * Thank You page — мост в WhatsApp-бот воронки (EasyBot).
 *
 * Флоу: форма → /api/lead → router.push('/thank-you') → этот экран показывает
 * «переводим в бот» и через 2 сек авто-редиректит в WhatsApp-бота EasyBot,
 * который выдаёт ссылку на эфир + бонусы и дальше работает как рассыльщик.
 *
 * На загрузке (НЕ ломать): Я.Метрика цель lead_workshop + Meta Pixel base.
 * Pixel 'Lead' шлётся на сабмите формы (register-modal/final-cta) + серверный
 * дубль через CAPI в /api/lead — здесь НЕ дублируем.
 *
 * UTM пробрасываем в ссылку EasyBot, чтобы он атрибутировал бот-юзера к
 * креативу (метки берутся из sticky-localStorage, см. lib/meta-pixel.ts).
 */

// Прямая ссылка воронки EasyBot → редиректит в WhatsApp-бота (+77002190603)
// с предзаполненным кодом регистрации. Хэш в скобках (%3C..%3E) — НЕ убирать.
const EASYBOT_DIRECT = "https://my.easybot.kz/api/?hash=%3C5kKKpd0H%3E";
const REDIRECT_DELAY_MS = 2000;

// Yandex Metrika type (window.ym)
declare global {
  interface Window {
    ym?: (id: number, action: string, target?: string) => void;
  }
}

const YM_ID = 109147153;
const GOAL_LEAD = "lead_workshop";

// Фолбэк: статичная прямая ссылка EasyBot (общий код) + UTM.
function buildStaticEasybotUrl(): string {
  try {
    const { utm } = collectMetaClientData();
    const params = new URLSearchParams();
    for (const k of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ]) {
      const v = utm?.[k];
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `${EASYBOT_DIRECT}&${qs}` : EASYBOT_DIRECT;
  } catch {
    return EASYBOT_DIRECT;
  }
}

// Предпочитаем персональную ссылку EasyBot (уникальный код из /api/lead → форма
// положила в sessionStorage). Её нет (прямой заход / register не ответил) — статичная.
function resolveBotUrl(): string {
  try {
    const stored = sessionStorage.getItem("onai_easybot_url");
    if (stored && /^https?:\/\//i.test(stored)) {
      sessionStorage.removeItem("onai_easybot_url"); // одноразовая
      return stored;
    }
  } catch {
    /* приватный режим — на фолбэк */
  }
  return buildStaticEasybotUrl();
}

export default function ThankYouClient() {
  const reduced = useReducedMotion();
  const [botUrl, setBotUrl] = useState(EASYBOT_DIRECT);

  useEffect(() => {
    // Конверсия: дошёл до Thank You = lead подтверждён.
    if (typeof window !== "undefined" && typeof window.ym === "function") {
      window.ym(YM_ID, "reachGoal", GOAL_LEAD);
    }
    // Персональная ссылка EasyBot из sessionStorage (или статичный фолбэк).
    const url = resolveBotUrl();
    setBotUrl(url);
    const t = setTimeout(() => {
      window.location.href = url;
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(t);
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
            Сейчас переведём тебя в{" "}
            <span className="text-white font-bold">WhatsApp-бот</span> — там
            ссылка на живой эфир воркшопа и бонусы.
          </p>

          {/* Важное предупреждение про сообщение боту */}
          <p className="text-[13px] sm:text-[14px] leading-relaxed max-w-[520px] mx-auto mb-6 sm:mb-7 text-[#fc5c02] font-semibold">
            Обязательно напиши боту — отправь сообщение с кодом, не меняя его.
            Без этого не получишь ссылку на эфир.
          </p>

          {/* Спиннер «переводим» */}
          <div className="flex items-center justify-center gap-2.5 mb-6">
            {!reduced && (
              <motion.span
                className="w-4 h-4 rounded-full border-2 border-[#cdeb52]/30 border-t-[#cdeb52]"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                aria-hidden
              />
            )}
            <span className="font-mono text-[11px] sm:text-[12px] uppercase tracking-[0.16em] text-white/55">
              Переводим в WhatsApp-бот…
            </span>
          </div>

          {/* Кнопка-фолбэк (если авто-редирект заблокирован браузером) */}
          <a
            href={botUrl}
            className="group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#cdeb52] text-black font-bold uppercase tracking-wide px-7 py-4 text-[14px] sm:text-[15px] transition-transform hover:scale-[1.03] active:scale-[0.98]"
            style={{
              fontFamily:
                "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
              boxShadow: "0 14px 40px -10px rgba(205, 235, 82, 0.5)",
            }}
          >
            Перейти в WhatsApp-бот
            <ArrowRight
              size={18}
              strokeWidth={2.5}
              className="transition-transform group-hover:translate-x-1"
            />
          </a>

          {/* Microcopy */}
          <p className="mt-4 text-white/40 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.14em]">
            не переводит? нажми кнопку выше
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
