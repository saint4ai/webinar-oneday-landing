"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SaasProjectCard } from "../SaasProjectCard";
import { SlideLayout } from "../SlideLayout";

/** Лёгкий счётчик вверх (mount-triggered). Без шейдеров — для компактного чипа. */
function CountUp({ value, duration = 1.4, delay = 0 }: { value: number; duration?: number; delay?: number }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) return;
    const start = performance.now() + delay * 1000;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, now - start) / 1000 / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, delay, reduce]);
  return <>{n.toLocaleString("ru-RU")}</>;
}

const STATS = [
  { value: 3, suffix: "", label: "года в AI-разработке", accent: "lime" as const },
  { value: 900, suffix: "+", label: "выпускников курсов", accent: "orange" as const },
  { value: 7, suffix: "+", label: "запущенных AI-сервисов", accent: "lime" as const },
  { value: 500, suffix: "+", label: "клиентов автоматизировал", accent: "orange" as const },
];

const PROJECTS = [
  {
    name: "AI-Таргетолог",
    url: "app.aoneagency.kz",
    tagline: "ИИ-таргетолог рекламы",
    description:
      "AI следит за рекламой 24/7 — находит слабые связки и подсказывает, что улучшить, чтобы не сливать бюджет.",
    accent: "lime" as const,
    images: [
      "/handouts/projects/ai-targetolog/01-home.png",
      "/handouts/projects/ai-targetolog/02-analytics.png",
      "/handouts/projects/ai-targetolog/03-campaigns.png",
      "/handouts/projects/ai-targetolog/03b-overview.png",
    ],
  },
  {
    name: "OmniDash",
    url: "omnidash.kz",
    tagline: "Дашборд сквозной аналитики рекламы",
    description:
      "Сводит рекламу, продажи и звонки в один экран. Видно реальный ROI по каждому каналу и менеджеру.",
    accent: "orange" as const,
    images: [
      "/handouts/projects/omnidash/01-marketing-roi.png",
      "/handouts/projects/omnidash/02-marketing-utm.png",
      "/handouts/projects/omnidash/03-marketing-creatives.png",
      "/handouts/projects/omnidash/01-sales-managers.png",
    ],
  },
];

export function Slide_14_AuthorityStats() {
  return (
    <SlideLayout
      speakerSide="right"
      background={
        <>
          {/* Сетчатый фон с радиальной маской */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
              backgroundSize: "52px 52px",
              maskImage: "radial-gradient(ellipse 75% 80% at 28% 42%, #000 18%, transparent 78%)",
              WebkitMaskImage: "radial-gradient(ellipse 75% 80% at 28% 42%, #000 18%, transparent 78%)",
            }}
          />
          {/* Лайм-блоб снизу-слева */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              bottom: "-16rem",
              left: "-6rem",
              width: 680,
              height: 680,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(182,255,0,0.10), transparent 68%)",
              filter: "blur(40px)",
            }}
          />
          {/* Оранж-блоб сверху-справа */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: "-14rem",
              right: "10%",
              width: 620,
              height: 620,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(252,92,2,0.12), transparent 70%)",
              filter: "blur(36px)",
            }}
          />
        </>
      }
    >
      <div
        className="flex flex-col h-full w-full"
        style={{
          paddingLeft: "clamp(40px, 5vw, 90px)",
          paddingRight: "2.5vw",
          paddingTop: "clamp(36px, 5.5vh, 64px)",
          paddingBottom: "clamp(28px, 4.5vh, 52px)",
        }}
      >
        {/* H1 — в одну строку */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-bold uppercase shrink-0"
          style={{
            fontFamily: "var(--font-benzin)",
            fontSize: "clamp(24px, 2.9vw, 44px)",
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
          }}
        >
          НЕМНОГО ЦИФР <span style={{ color: "#B6FF00" }}>ОБО МНЕ</span>
        </motion.h2>

        {/* Строка из 4 цифр — раскатываются слева направо (задержка ~1 сек) */}
        <div className="grid grid-cols-4 gap-3.5 mt-5 shrink-0">
          {STATS.map((s, i) => {
            const color = s.accent === "lime" ? "#B6FF00" : "#FC5C02";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -28 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.8, ease: [0.25, 1, 0.5, 1] }}
                className="relative rounded-xl px-4 py-3.5 overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderLeft: `2px solid ${color}`,
                }}
              >
                <div
                  className="font-bold leading-none mb-1.5"
                  style={{ fontFamily: "var(--font-benzin)", fontSize: "clamp(28px, 3.2vw, 48px)", color }}
                >
                  <CountUp value={s.value} delay={i * 0.8} />
                  {s.suffix}
                </div>
                <div className="text-white/55 text-[12px] md:text-[13px] leading-tight">{s.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Секция: 2 SaaS-проекта для клиентов */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center gap-3 mt-7 mb-3.5 shrink-0"
        >
          <span
            className="font-mono uppercase font-semibold tracking-[0.18em]"
            style={{ color: "#B6FF00", fontSize: "clamp(11px, 1vw, 14px)" }}
          >
            2 моих SaaS-проекта для клиентов
          </span>
          <span className="h-px flex-1" style={{ background: "linear-gradient(90deg, rgba(182,255,0,0.4), transparent)" }} />
        </motion.div>

        {/* 2 карточки проектов — авто-галерея каждые 3 сек */}
        <div className="grid grid-cols-2 gap-5 flex-1 min-h-0">
          {PROJECTS.map((p, i) => (
            <SaasProjectCard
              key={p.url}
              name={p.name}
              url={p.url}
              tagline={p.tagline}
              description={p.description}
              images={p.images}
              accent={p.accent}
              interval={5000}
              delay={0.3 + i * 0.2}
            />
          ))}
        </div>
      </div>
    </SlideLayout>
  );
}
