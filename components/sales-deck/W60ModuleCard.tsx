"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "./SlideLayout";

/**
 * W60ModuleCard — единый шаблон слайда модуля программы.
 *
 * Слайд продаёт модуль по схеме: обещание → что внутри → результат на руках → врезка.
 * Тексты взяты из onai-modules-selling-copy.md (собран из транскриптов уроков).
 * Тёмная и кремовая темы чередуются по порядку модулей.
 */
const INK = "#2A2520";

export interface W60ModuleProps {
  /** «Модуль 1» / «Бонусный модуль» */
  badge: string;
  /** Продающий заголовок-обещание, не название модуля */
  promise: string;
  /** Название модуля мелким шрифтом под обещанием */
  title: string;
  /** Что внутри: [жирное начало, пояснение] */
  does: [string, string][];
  /** Что на руках после модуля */
  result: string;
  /** Врезка: снятие возражения или честная оговорка */
  note: string;
  lessons: string;
  duration: string;
  theme?: "dark" | "cream";
}

export function W60ModuleCard({
  badge,
  promise,
  title,
  does,
  result,
  note,
  lessons,
  duration,
  theme = "dark",
}: W60ModuleProps) {
  const dark = theme === "dark";
  const fg = dark ? "#FFFFFF" : INK;
  const muted = dark ? "rgba(255,255,255,0.55)" : "rgba(42,37,32,0.6)";
  const kicker = dark ? "#7E7E7E" : "#9A8A6E";
  const accent = dark ? "#B6FF00" : "#FC5C02";
  const cardBg = dark ? "rgba(255,255,255,0.035)" : "#FBF6EC";
  const cardEdge = dark ? "rgba(255,255,255,0.10)" : "#E7DCC8";

  return (
    <SlideLayout
      speakerSide="right"
      contentClassName="!justify-start !py-0"
      style={dark ? undefined : { background: "var(--brand-cream)" }}
      background={
        dark ? (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(720px 520px at 76% 6%, rgba(182,255,0,0.11), transparent 66%), radial-gradient(520px 430px at 5% 90%, rgba(252,92,2,0.07), transparent 70%)",
            }}
          />
        ) : (
          <>
            <div className="cream-grid" />
            <div
              aria-hidden
              className="absolute pointer-events-none"
              style={{
                top: "-11rem",
                right: "9%",
                width: 600,
                height: 600,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(252,92,2,0.13), transparent 68%)",
                filter: "blur(16px)",
              }}
            />
            <div className="cream-grain" />
          </>
        )
      }
    >
      <div
        className="flex flex-col h-full w-full"
        style={{ paddingTop: "clamp(26px,4.2cqh,56px)", paddingBottom: "clamp(18px,2.6cqh,34px)" }}
      >
        {/* шапка: модуль + хронометраж */}
        <div className="shrink-0 flex items-start justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold"
            style={{ color: kicker }}
          >
            <span style={{ color: accent, fontWeight: 700 }}>// </span>
            {badge}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="font-mono shrink-0"
            style={{ color: kicker, fontSize: "clamp(11px,0.95cqw,15px)" }}
          >
            {lessons} · {duration}
          </motion.div>
        </div>

        {/* название модуля — заголовок */}
        <motion.h1
          initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.25, 1, 0.5, 1] }}
          className="shrink-0 font-bold uppercase leading-[1.03] tracking-[-0.02em] mt-2"
          style={{
            color: fg,
            fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(26px, 3.1cqw, 52px)",
          }}
        >
          {title}
        </motion.h1>

        {/* описание модуля — подзаголовок */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.38 }}
          className="shrink-0 mt-2 leading-snug"
          style={{
            color: accent,
            fontSize: "clamp(14px,1.42cqw,25px)",
            fontWeight: 600,
          }}
        >
          {promise}
        </motion.div>

        {/* что внутри */}
        <div className="flex-1 min-h-0 mt-3.5 mb-2.5">
          <div
            className="w-full h-full grid gap-2.5 content-center"
            style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}
          >
            {does.map(([head, tail], i) => (
              <motion.div
                key={head}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.5 + i * 0.1, ease: [0.25, 1, 0.5, 1] }}
                className="rounded-xl px-4 py-3"
                style={{ background: cardBg, border: `1px solid ${cardEdge}` }}
              >
                <span
                  className="font-semibold leading-snug"
                  style={{ color: fg, fontSize: "clamp(13px,1.18cqw,21px)" }}
                >
                  {head}
                </span>{" "}
                <span
                  className="leading-snug"
                  style={{ color: muted, fontSize: "clamp(12.5px,1.12cqw,20px)" }}
                >
                  {tail}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* результат */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1, ease: [0.25, 1, 0.5, 1] }}
          className="shrink-0 rounded-2xl px-5 py-4"
          style={
            dark
              ? { background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.3)" }
              : { background: INK, border: `1px solid ${INK}` }
          }
        >
          <div
            className="font-mono uppercase tracking-[0.14em] mb-1.5"
            style={{ color: "#B6FF00", fontSize: "clamp(9.5px,0.8cqw,12px)" }}
          >
            На руках после модуля
          </div>
          <div
            className="font-semibold leading-tight"
            style={{
              color: dark ? "#FFFFFF" : "#F2EBDD",
              fontSize: "clamp(14px,1.4cqw,25px)",
            }}
          >
            {result}
          </div>
        </motion.div>

        {/* врезка — честная оговорка или снятие возражения */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.25 }}
          className="shrink-0 mt-2.5 leading-snug"
          style={{
            color: muted,
            fontSize: "clamp(12px,1.05cqw,19px)",
            borderLeft: `2px solid ${accent}`,
            paddingLeft: 12,
          }}
        >
          {note}
        </motion.div>
      </div>
    </SlideLayout>
  );
}
