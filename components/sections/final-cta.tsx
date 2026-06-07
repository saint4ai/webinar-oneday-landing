"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check, Gift, Loader2, Lock } from "lucide-react";
import { Highlighted } from "@/components/ui/highlighted";
import { BrandPhoneInput } from "@/components/ui/phone-input";
import { apiUrl, withBase } from "@/lib/api-url";
import { newEventId, collectMetaClientData, trackLead } from "@/lib/meta-pixel";
import { ymGoal } from "@/lib/analytics/ym";

/**
 * ЭКРАН 4 · Финальный CTA + Форма (по плану Александра).
 * Структура:
 *  - H1: "Регистрируйся — места ограничены"
 *  - "Что заберёшь:" — 3 буллета
 *  - Inline-форма (имя + WhatsApp + button) прямо в блоке
 *  - Footer-нота: "Эфир один. Запись не отправляем — только пришедшим"
 *
 * Никакого countdown / 900+ / 250 — это уже выше в hero/about.
 * Subtle brand-gradient overlays + grain для отличия от других блоков.
 */

const TAKEAWAYS = [
  "Формулу, по которой собирают приложения",
  "Список 6 продуктов с реальными ценами рынка",
  "Понимание, с какой задачи начать",
];

type BonusCard = {
  number: string;
  image: string;
  title: string;
  hook: string; // selling subtitle (Mono) — конкретное обещание/цифра
  textColor: "dark" | "light";
};

const BONUSES: BonusCard[] = [
  {
    number: "01",
    image: "/bonuses/bonus-1-v4.avif",
    title: "Автопилот\nрекламы Meta",
    hook: "// −150К ₸/мес на таргетологе",
    textColor: "light",
  },
  {
    number: "02",
    image: "/bonuses/bonus-2.avif",
    title: "33 промта\nпо маркетингу",
    hook: "// копируй · вставляй · запускай",
    textColor: "dark",
  },
  {
    number: "03",
    image: "/bonuses/bonus-3-v4.avif",
    title: "Гайд по старту\nв вайбкодинге",
    hook: "// от идеи до своей платформы",
    textColor: "light",
  },
];

// TODO: настроить реальный endpoint для приёма формы.
// edbot.me URL — это REDIRECT в WhatsApp (не webhook), используется только
// на /thank-you как target кнопки «Перейти в WhatsApp-бот».
// Lead создаётся в amoCRM на стороне edbot-бота когда юзер напишет в WhatsApp.

export const FinalCTA = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(true); // pre-checked
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Минимум 8 цифр в номере (включая код страны)
  const phoneDigits = phone.replace(/\D/g, "").length;
  const phoneValid = phoneDigits >= 8;
  const formValid = name.trim().length >= 2 && phoneValid && agree;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid || submitting) return;
    setSubmitting(true);
    setError(null);
    const eventId = newEventId();
    const meta = collectMetaClientData();
    ymGoal("lead_submit"); // Я.Метрика: сабмит формы (момент клика, до ответа API)
    try {
      const res = await fetch(apiUrl("/api/lead"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          source: "landing-final-cta",
          consent: agree,
          eventId,
          fbp: meta.fbp,
          fbc: meta.fbc,
          eventSourceUrl: meta.eventSourceUrl,
          utm: meta.utm,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Браузерный Lead с тем же event_id (дедуп с серверным CAPI в /api/lead)
      trackLead(eventId);
      setSuccess(true);
      setTimeout(() => router.push("/thank-you"), 400);
    } catch (err) {
      console.error("Lead submit failed:", err);
      setError("Что-то пошло не так. Попробуй ещё раз.");
      setSubmitting(false);
    }
  };

  return (
    <section
      id="final-cta"
      className="relative z-10 overflow-hidden"
    >
      {/* Brand gradient overlays — fade in сверху чтобы не было резкого стыка
       *  с предыдущей секцией (Testimonials). К bottom — полная яркость.
       */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          maskImage:
            "linear-gradient(180deg, transparent 0%, black 18%, black 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, black 18%, black 100%)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(252,92,2,0.18)] via-transparent to-transparent opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-bl from-[rgba(205,235,82,0.10)] via-transparent to-transparent opacity-60" />
      </div>

      {/* Grain texture для глубины */}
      <div aria-hidden className="od-noise" />

      <motion.div
        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative z-[2] max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-20"
      >
        {/* ═══ БОНУСЫ ДЛЯ УЧАСТНИКОВ ВОРКШОПА (выше H1) ═══ */}
        <div className="mb-12 sm:mb-16">
          <div className="mono-label !text-[#fc5c02] mb-4 flex items-center gap-2">
            <Gift size={13} strokeWidth={2.5} />
            обещанные бонусы
          </div>
          <h3
            className="uppercase text-white max-w-3xl"
            style={{
              fontFamily:
                "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(22px, 3vw, 38px)",
              lineHeight: 1.4,
              letterSpacing: "-0.01em",
            }}
          >
            Бонусы для{" "}
            <Highlighted delay={0.5} duration={0.7}>
              участников воркшопа
            </Highlighted>
          </h3>
          <p className="mt-4 text-white/65 text-[14px] sm:text-[16px] leading-relaxed max-w-2xl">
            Готовые материалы — в нашем закрытом WhatsApp-сообществе. Туда же
            придёт ссылка на живой эфир и напоминание за час до старта.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10">
            {BONUSES.map((b, idx) => (
              <BonusItem key={b.number} bonus={b} index={idx} />
            ))}
          </div>

          <p className="mt-6 text-center text-white/45 font-mono text-[11px] sm:text-[12px] uppercase tracking-[0.16em] flex items-center justify-center gap-2">
            <Lock size={12} strokeWidth={2} className="text-[#cdeb52]" />
            доступ после регистрации
          </p>
        </div>

        <div className="section-divider">регистрация · 10 июня</div>

        {/* H1 — на mobile: «Регистрируйся —» / [плашка «места ограничены»]
            на 2 строки, чтобы плашка целиком влезла на 320px viewport. */}
        <h2
          className="uppercase text-white mt-6 sm:mt-8 max-w-3xl"
          style={{
            fontFamily:
              "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(18px, 5vw, 64px)",
            lineHeight: 1.2,
            letterSpacing: "-0.015em",
          }}
        >
          Регистрируйся —{" "}
          <br className="sm:hidden" />
          <Highlighted delay={0.5} duration={0.7} color="#fc5c02" glowRgb="252, 92, 2">
            места ограничены
          </Highlighted>
        </h2>

        {/* 2-column: что заберёшь + форма */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-10 lg:gap-16 mt-8 sm:mt-12 items-start">
          {/* LEFT — Что заберёшь */}
          <div>
            <div className="mono-label !text-white/55 mb-5">что заберёшь</div>
            <ul className="flex flex-col gap-4">
              {TAKEAWAYS.map((item, idx) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                    delay: 0.2 + idx * 0.1,
                  }}
                  className="flex items-start gap-3 text-white/85 text-[15px] sm:text-[17px] leading-relaxed"
                >
                  <span className="mt-1 inline-flex w-6 h-6 shrink-0 rounded-full bg-[#cdeb52]/15 items-center justify-center border border-[#cdeb52]/30">
                    <Check size={14} strokeWidth={2.5} className="text-[#cdeb52]" />
                  </span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>

            <p className="mt-10 text-white/40 text-[13px] sm:text-[14px] font-mono uppercase tracking-[0.14em]">
              живой эфир, записи не будет.
            </p>
          </div>

          {/* RIGHT — Inline-форма + бонусы под ней */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 sm:p-8 backdrop-blur-sm">
            {success ? (
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-14 h-14 rounded-full bg-[#cdeb52]/15 border border-[#cdeb52]/40 flex items-center justify-center mb-5">
                  <Check size={28} strokeWidth={2.5} className="text-[#cdeb52]" />
                </div>
                <div
                  className="uppercase text-white text-[18px] sm:text-[22px] mb-2"
                  style={{
                    fontFamily:
                      "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
                    fontWeight: 800,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Готово
                </div>
                <p className="text-white/65 text-[14px] leading-relaxed max-w-xs">
                  Ссылку на эфир пришлю в WhatsApp за час до старта.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="fcta-name"
                    className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45 block mb-1.5"
                  >
                    имя
                  </label>
                  <input
                    id="fcta-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Александр"
                    autoComplete="given-name"
                    className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-4 py-3 text-[15px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#fc5c02]/50 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="fcta-phone"
                    className="flex items-center justify-between mb-1.5"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">
                      whatsapp
                    </span>
                    <span className="font-mono text-[10px] text-[#fc5c02]/80 normal-case tracking-normal">
                      → доступ в сообщество
                    </span>
                  </label>
                  <BrandPhoneInput
                    id="fcta-phone"
                    value={phone}
                    onChange={setPhone}
                  />
                </div>

                <label className="mt-1 flex items-start gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-[3px] w-4 h-4 rounded border-white/20 bg-black/40 accent-[#fc5c02] cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] sm:text-[12px] text-white/55 group-hover:text-white/75 leading-snug transition-colors">
                    Согласен с{" "}
                    <a
                      href={withBase("/privacy")}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="underline underline-offset-2 decoration-white/30 hover:decoration-[#fc5c02]"
                    >
                      политикой конфиденциальности
                    </a>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!formValid || submitting}
                  className="mt-2 inline-flex items-center justify-center gap-2 bg-[#fc5c02] text-white py-3.5 px-7 rounded-lg text-[15px] font-bold uppercase tracking-wide hover:bg-[#ff7424] hover:translate-y-[-1px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200"
                  style={{
                    boxShadow: formValid
                      ? "0 12px 32px -8px rgba(252, 92, 2, 0.55)"
                      : "none",
                  }}
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Зарегистрироваться
                      <ArrowRight size={18} strokeWidth={2.5} />
                    </>
                  )}
                </button>

                {error && (
                  <p className="text-[12px] text-red-400 text-center mt-1">
                    {error}
                  </p>
                )}

                <p className="text-white/35 text-[11px] sm:text-[12px] text-center mt-1">
                  Бесплатно · онлайн · 1 день
                </p>
              </form>
            )}
          </div>
        </div>

      </motion.div>
    </section>
  );
};

const BonusItem = ({ bonus, index }: { bonus: BonusCard; index: number }) => {
  const { number, image, title, hook, textColor } = bonus;
  const isDark = textColor === "dark";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative rounded-[20px] overflow-hidden aspect-square shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]"
    >
      <Image
        src={image}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Gradient overlay внизу для гарантированной читаемости текста */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[55%] pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.85) 100%)"
            : "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between pointer-events-none">
        <span
          className={`self-start inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md backdrop-blur-md font-mono text-[10px] uppercase tracking-[0.18em] border ${
            isDark
              ? "bg-black/30 text-white border-white/15"
              : "bg-white/10 text-white border-white/20"
          }`}
        >
          <Gift size={11} strokeWidth={2.5} />
          БОНУС {number}
        </span>

        <div className="flex flex-col gap-1.5 relative z-10">
          <h4
            className={`uppercase whitespace-pre-line ${isDark ? "text-black" : "text-white"}`}
            style={{
              fontFamily:
                "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(16px, 2vw, 22px)",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              textShadow: !isDark ? "0 2px 12px rgba(0,0,0,0.7)" : "none",
            }}
          >
            {title}
          </h4>
          <div
            className={`font-mono text-[10px] sm:text-[11px] tracking-[0.04em] ${
              isDark ? "text-black/70" : "text-[#cdeb52]"
            }`}
          >
            {hook}
          </div>
        </div>
      </div>
    </motion.article>
  );
};
