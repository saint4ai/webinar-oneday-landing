"use client";
import React from "react";
import Image from "next/image";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Highlighted } from "@/components/ui/highlighted";
import { GlowingCard } from "@/components/ui/glowing-card";

/**
 * Флагманский кейс — onAI.academy.
 * Платформа обучения собрана за 3 месяца на $800, без команды.
 * Сейчас 250+ активных учеников.
 */

export const CaseOnAIAcademy = () => {
  return (
    <section
      id="case-academy"
      className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-8"
    >
      <ContainerScroll
        titleComponent={
          <div className="px-4">
            <div className="mb-4">
              <span className="mono-label">
                флагман — платформа обучения
              </span>
            </div>

            <h2
              className="uppercase mx-auto"
              style={{
                fontFamily:
                  "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
                fontWeight: 800,
                fontSize: "clamp(24px, 3.6vw, 56px)",
                lineHeight: 1.4,
                letterSpacing: "-0.01em",
                color: "#fff",
              }}
            >
              Моя собственная платформа{" "}
              <Highlighted delay={0.5} duration={0.7}>
                обучения на ИИ
              </Highlighted>
            </h2>

            <p
              className="mt-5 max-w-2xl mx-auto text-white/70 text-[14px] sm:text-[16px] leading-relaxed"
              style={{ letterSpacing: "-0.01em" }}
            >
              Надоело переплачивать GetCourse и собирать AI-функции
              сторонними сервисами. Сел и за{" "}
              <span className="text-white font-bold">3 месяца</span>
              {" "}собрал свою платформу — с AI-наставником, аналитикой
              прогресса и персональными программами под каждого ученика.
              Один. Без команды разработчиков.
            </p>

            {/* Метрики */}
            <div className="grid grid-cols-1 sm:grid-cols-3 max-w-3xl mx-auto mt-8 gap-4 sm:gap-5">
              <Metric
                value="3 месяца"
                label="от идеи до запуска"
                hint="Собрал один, без команды разработчиков"
              />
              <Metric
                value="$800"
                label="все затраты"
                hint="Подписки Cursor, Claude, Supabase, хостинг"
              />
              <Metric
                value="250+"
                label="учеников учатся прямо сейчас"
                hint="Всего через школу прошло 900+ человек"
              />
            </div>
          </div>
        }
      >
        <div className="relative w-full h-full overflow-hidden rounded-xl md:rounded-2xl bg-black">
          <Image
            src="/case-onai-platform.avif"
            alt="onAI.academy — платформа обучения на базе AI"
            width={1400}
            height={840}
            // object-contain — вся картинка целиком влезает в mockup-планшет
            // (раньше object-cover обрезала края на узких экранах)
            className="mx-auto h-full w-full object-contain"
            style={{ filter: "brightness(0.94) saturate(0.88)" }}
            draggable={false}
          />
          {/* scan-line + dot-grid overlay — opacity 20% (раньше было ярко) */}
          <div className="scan-overlay" aria-hidden style={{ opacity: 0.2 }} />
          <div className="scan-grid" aria-hidden style={{ opacity: 0.2 }} />
        </div>
      </ContainerScroll>

      {/* Фичи — простой параграф под мокапом */}
      <p
        data-testid="case-features-text"
        className="max-w-3xl mx-auto text-center text-white/65 text-[14px] sm:text-[16px] leading-relaxed mt-2 sm:mt-4 pb-12 sm:pb-20 px-4 sm:px-0"
      >
        Под капотом — <span className="text-white font-bold">AI-наставник 24/7</span>,
        который отвечает каждому ученику лично, <span className="text-white font-bold">аналитика прогресса</span>,
        которая видит где буксует раньше его самого, и <span className="text-white font-bold">персональный учебный путь</span>{" "}
        под уровень и цели каждого. Один продукт — у каждого свой курс.
      </p>
    </section>
  );
};

const Metric = ({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) => (
  <GlowingCard intensity="subtle" radius="16px">
    <div className="flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl bg-[#0a0a0c] h-full">
      <div
        className="hl-lime uppercase whitespace-nowrap"
        style={{
          fontFamily:
            "var(--font-benzin), var(--font-space-grotesk), system-ui, sans-serif",
          fontWeight: 800,
          fontSize: "clamp(20px, 2vw, 30px)",
          lineHeight: 1,
          letterSpacing: "-0.005em",
        }}
      >
        {value}
      </div>
      <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.16em] text-white/55 mt-2.5">
        {label}
      </div>
      {hint && (
        <div className="text-[11px] sm:text-[12px] text-white/40 mt-2 leading-relaxed">
          {hint}
        </div>
      )}
    </div>
  </GlowingCard>
);
