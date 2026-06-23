"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 46 · Решение — Отдел продаж (CallVision).
 * Layout «текст сверху, дашборд снизу» (под широкий landscape-скрин):
 *  — верх: H1 (2 смысловые строки) + flow + чек-лист + цена горизонтально
 *  — низ: широкий CallVision-дашборд в браузер-рамке — АВТО-КАРУСЕЛЬ 5 экранов
 *    каждые 3 сек (overview → карточка звонка → ошибки → аналитика → динамика).
 * Текст 1-в-1 из STRUCTURE. Скрины: public/handouts/callvision/cv-01..05.png
 */
const FLOW = ["AmoCRM / Bitrix", "голосовой ввод", "Claude", "дашборд"];
const CHECKLIST = ["поздоровался", "выявил потребность", "отработал «дорого»", "закрыл на след. шаг"];

/** Экраны CallVision для карусели (порядок = история продукта). */
const SCREENS = [
  { src: "/handouts/callvision/cv-01.png", url: "callvision.ai / дашборд" },
  { src: "/handouts/callvision/cv-05.png", url: "callvision.ai / звонок #cv-001" },
  { src: "/handouts/callvision/cv-04.png", url: "callvision.ai / анализ ошибок" },
  { src: "/handouts/callvision/cv-03.png", url: "callvision.ai / аналитика" },
  { src: "/handouts/callvision/cv-02.png", url: "callvision.ai / динамика продаж" },
];

export function Slide_46_SalesSolution() {
  const reduce = useReducedMotion();
  const [screen, setScreen] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setScreen((s) => (s + 1) % SCREENS.length), 3000);
    return () => clearInterval(t);
  }, [reduce]);

  return (
    <SlideLayout
      speakerSide="right"
      contentClassName="!justify-start !py-0"
      background={<SlideBg theme="dark" variant="aura-tr" />}
    >
      <div
        className="flex flex-col h-full w-full"
        style={{ paddingTop: "clamp(36px,6cqh,72px)", paddingBottom: "clamp(28px,4cqh,52px)" }}
      >
        {/* ===== ВЕРХ: текст + блоки горизонтально ===== */}
        <div className="shrink-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
          >
            // РЕШЕНИЕ · ОТДЕЛ ПРОДАЖ
          </motion.div>

          {/* H1 — 2 смысловые строки, без переносов по слогам */}
          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase leading-[1.04] tracking-[-0.02em]"
            style={{
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(22px, 2.5cqw, 40px)",
              wordBreak: "keep-all",
              overflowWrap: "normal",
              hyphens: "none",
            }}
          >
            <span className="text-white">AI слушает каждый звонок</span>{" "}
            <span style={{ color: "#B6FF00" }}>и ставит оценку по твоему чек-листу</span>
          </motion.h1>

          {/* Ряд блоков: flow + чек-лист + цена */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center gap-x-7 gap-y-3 mt-6"
          >
            {/* flow */}
            <div className="flex items-center gap-2 font-mono text-[12px] text-white/70 flex-wrap">
              {FLOW.map((step, i) => (
                <span key={step} className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-1 rounded-md"
                    style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.3)", color: "#B6FF00" }}
                  >
                    {step}
                  </span>
                  {i < FLOW.length - 1 && <span className="text-white/30">→</span>}
                </span>
              ))}
            </div>

            {/* цена */}
            <div className="flex items-baseline gap-2.5">
              <span className="font-bold" style={{ fontFamily: "var(--font-benzin)", fontSize: "clamp(18px,1.7cqw,26px)", color: "#B6FF00" }}>
                от 700 000 ₸
              </span>
              <span className="text-white/50 text-[12px]">конверсия +10-20% за месяц</span>
            </div>
          </motion.div>

          {/* чек-лист в одну строку */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4"
          >
            {CHECKLIST.map((c) => (
              <span key={c} className="flex items-center gap-1.5 text-white/75 text-[13px]">
                <span style={{ color: "#B6FF00" }}>✓</span>
                {c}
              </span>
            ))}
            <span className="text-white/45 text-[13px] italic">
              → фидбэк в Telegram: «пропустил возражение по цене на 7:42»
            </span>
          </motion.div>
        </div>

        {/* ===== НИЗ: широкий дашборд ===== */}
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="flex-1 min-h-0 flex flex-col justify-end mt-6"
        >
          <div
            className="relative w-full rounded-xl overflow-hidden border border-white/15"
            style={{
              maxHeight: "100%",
              aspectRatio: "16 / 9",
              boxShadow: "0 30px 80px -24px rgba(0,0,0,0.85), 0 0 70px -14px rgba(182,255,0,0.22)",
            }}
          >
            {/* browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border-b border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-3 font-mono text-[11px] text-white/45">🔒 {SCREENS[screen].url}</span>
              <span
                className="ml-auto flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-[0.12em]"
                style={{ background: "rgba(252,92,2,0.14)", border: "1px solid rgba(252,92,2,0.35)", color: "#FC5C02" }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#FC5C02" }} />
                в разработке · моё решение
              </span>
            </div>
            {/* dashboard carousel — авто-смена каждые 3 сек */}
            <div className="relative w-full bg-black" style={{ height: "calc(100% - 33px)" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={screen}
                  initial={reduce ? false : { opacity: 0, scale: 1.01 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={SCREENS[screen].src}
                    alt="CallVision — мой дашборд оценки звонков для руководителей отдела продаж"
                    fill
                    className="object-cover object-top"
                    sizes="75vw"
                    priority={screen === 0}
                  />
                </motion.div>
              </AnimatePresence>

              {/* точки прогресса */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {SCREENS.map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: i === screen ? 20 : 6,
                      background: i === screen ? "#B6FF00" : "rgba(255,255,255,0.4)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
