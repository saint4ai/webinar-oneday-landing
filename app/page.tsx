"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { LiquidButton } from "@/components/ui/liquid-button";
import { CountdownTimer } from "@/components/ui/countdown";
import { OnAILogo } from "@/components/ui/onai-logo";
import { PortraitFrame } from "@/components/ui/portrait-frame";
import { AnimatedGroup, transitionVariants } from "@/components/ui/animated-group";
import { TextEffect } from "@/components/ui/text-effect";
import { Highlighted } from "@/components/ui/highlighted";
import { RegisterModal } from "@/components/ui/register-modal";
import { AboutMe } from "@/components/sections/about-me";
import { CaseOnAIAcademy } from "@/components/sections/case-onai-academy";
import { MyOtherProducts } from "@/components/sections/my-other-products";
import { Testimonials } from "@/components/sections/testimonials";
import { FinalCTA } from "@/components/sections/final-cta";
import { MetaPixelBase } from "@/components/meta-pixel-base";
import { ymGoal } from "@/lib/analytics/ym";
import { useScrollGoals } from "@/lib/analytics/useScrollGoals";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  useScrollGoals();

  return (
    <main className="relative flex-1 od-root overflow-hidden min-h-[100dvh] pb-24 md:pb-0">
      {/* Meta Pixel — ТОЛЬКО на лендинге и thank-you (не в layout) */}
      <MetaPixelBase />

      {/* ════ ФОН А-ЛЯ ONAI/OPEN-DAY ════ */}
      <div className="od-blob-orange" />
      <div className="od-blob-lime" />
      <div className="od-grid" />
      <div className="od-noise" />
      <div className="od-vignette" />

      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -10, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-50 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-6 flex items-center justify-between gap-3"
      >
        <OnAILogo className="h-6 sm:h-7" />
        <nav className="flex items-center gap-3 sm:gap-5 lg:gap-7 flex-shrink-0">
          <span className="hidden lg:inline mono-label !text-[#cdeb52]/80">
            сайт собран на вайбкоде
          </span>
        </nav>
      </motion.header>

      {/* HERO */}
      <section className="relative z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-4 sm:pt-6 lg:pt-10 pb-16 sm:pb-20">
          {/* GRID: mobile = одна колонка (текст → фото), desktop = 2 колонки */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_460px] gap-8 lg:gap-14 items-center">
            {/* LEFT — текст (на мобиле сверху) */}
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
                  },
                },
                ...transitionVariants,
              }}
              className="flex flex-col gap-5 sm:gap-7 order-1"
            >
              {/* 1. Mono-метка */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="mono-label">однодневный воркшоп</span>
              </div>

              {/* 2. H1 + Sub — с зелёным highlight на «AI-разработчиком» */}
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                  className="display-hero-1 text-white"
                >
                  Стань{" "}
                  <Highlighted delay={1.4} duration={0.7}>
                    AI-разработчиком
                  </Highlighted>{" "}
                  приложений
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                  className="display-hero-2 text-white mt-2"
                >
                  без навыков программирования
                </motion.p>
              </div>

              {/* 3. H2 */}
              <div
                className="max-w-xl text-[14px] sm:text-[16px] lg:text-[17px] text-white/70 leading-relaxed"
                style={{ letterSpacing: "-0.01em" }}
              >
                <p>
                  Собирай{" "}
                  <span className="text-white font-bold">
                    сайты, приложения и AI-агентов
                  </span>{" "}
                  для бизнеса через диалог с ИИ простым языком. За один день
                  узнаешь, как делать IT-решения с чеком{" "}
                  <span className="od-gradient-text font-bold whitespace-nowrap">
                    500К – 10М&nbsp;₸
                  </span>{" "}
                  — без программирования и команды.
                </p>
              </div>

              {/* 4. CTA + цена-якорь + таймер */}
              <div className="flex flex-col items-start gap-3 mt-2 w-full">
                <LiquidButton onClick={() => { ymGoal("cta_click"); setModalOpen(true); }} variant="primary">
                  Зарегистрироваться на воркшоп
                </LiquidButton>
                {/* Цена-якорь: зачёркнутая → бесплатно */}
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="line-through text-white/40 font-mono text-[13px] sm:text-[14px]">
                    25 000 ₸
                  </span>
                  <span
                    className="uppercase text-[#cdeb52]"
                    style={{
                      fontFamily:
                        "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
                      fontWeight: 800,
                      fontSize: "clamp(15px, 1.4vw, 18px)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    бесплатно
                  </span>
                </div>
                {/* Таймер до старта */}
                <div className="mt-2">
                  <CountdownTimer />
                </div>
                {/* Подарок: 3 бонуса для участников */}
                <a
                  href="#final-cta"
                  className="mt-3 inline-flex items-center gap-2 font-mono text-[11px] sm:text-[12px] uppercase tracking-[0.14em] text-[#fc5c02] hover:text-[#ff7424] transition-colors"
                >
                  <span className="text-[#cdeb52]">+</span>
                  3 бонуса участникам в подарок
                  <span aria-hidden>↓</span>
                </a>
              </div>
            </AnimatedGroup>

            {/* RIGHT — портрет: на мобиле снизу (компактнее) */}
            <div className="order-2 lg:order-2 w-full max-w-[420px] mx-auto lg:max-w-none">
              <PortraitFrame />
            </div>
          </div>

          {/* Section divider + proof — 3 пункта (без Almaty Hub) */}
          <motion.div
            initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 1.5, duration: 1.2, ease: "easeOut" }}
            className="mt-12 lg:mt-16"
          >
            <div className="section-divider">proof — что уже сделано</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 mt-2">
              <ProofItem num="6" label="IT-решений в продакшене" />
              <ProofItem
                num="600К–10,5М ₸"
                label="чек проектов для бизнеса"
              />
              <ProofItem num="900+" label="выпускников онлайн-школы" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════ КТО Я ════ */}
      <AboutMe />

      <div className="od-section-fade relative z-10" aria-hidden />

      {/* ════ ФЛАГМАН — onAI.academy ════ */}
      <CaseOnAIAcademy />

      <div className="od-section-fade relative z-10" aria-hidden />

      {/* ════ МОИ ДРУГИЕ SaaS — OmniDash + AI-Таргетолог ════ */}
      <MyOtherProducts />

      <div className="od-section-fade relative z-10" aria-hidden />

      {/* ════ КЕЙСЫ УЧЕНИКОВ ════ */}
      <Testimonials />

      <div className="od-section-fade relative z-10" aria-hidden />

      {/* ════ ФИНАЛЬНЫЙ CTA — регистрация + бонусы участникам внутри ════ */}
      <FinalCTA />

      {/* Footer */}
      <footer className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-6 text-white/25 font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-center">
        onAI.academy · 2026
      </footer>

      {/* Мобильная фикс-кнопка регистрации — только на телефонах (md:hidden), липнет к низу экрана, открывает ту же модалку */}
      <div
        className="md:hidden fixed inset-x-0 bottom-0 z-40 px-4 pt-7"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
          background: "linear-gradient(to top, rgba(8,8,8,0.97) 55%, rgba(8,8,8,0))",
        }}
      >
        <button
          onClick={() => { ymGoal("cta_click"); setModalOpen(true); }}
          aria-label="Зарегистрироваться на воркшоп"
          className="w-full rounded-full py-4 uppercase text-black active:scale-[0.98] transition-transform"
          style={{
            fontFamily: "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
            fontWeight: 800,
            fontSize: "16px",
            letterSpacing: "0.02em",
            background: "#cdeb52",
            boxShadow: "0 -2px 30px -4px rgba(205,235,82,0.45)",
          }}
        >
          Зарегистрироваться
        </button>
      </div>

      {/* Регистрация — модалка */}
      <RegisterModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </main>
  );
}

const ProofItem = ({ num, label }: { num: string; label: string }) => (
  <div>
    <div
      className="hl-orange whitespace-nowrap uppercase"
      style={{
        fontFamily: "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
        fontSize: "clamp(18px, 1.8vw, 26px)",
        letterSpacing: "-0.005em",
        fontWeight: 800,
        lineHeight: 1,
      }}
    >
      {num}
    </div>
    <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.18em] text-white/50 mt-2 leading-relaxed">
      {label}
    </div>
  </div>
);
