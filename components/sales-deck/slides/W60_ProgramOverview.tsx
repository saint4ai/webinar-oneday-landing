"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";

/**
 * W60 · ОБЗОР ПРОГРАММЫ — cream.
 *
 * Заменяет Slide_113_ProgramOverview, который описывал старую программу
 * (10 модулей, 54 урока, «Армия агентов», «Деньги на счёт») и противоречил
 * блоку модулей, идущему следом.
 *
 * Актуально: 7 модулей · 27 уроков · 9 ч 04 мин.
 */
const INK = "#2A2520";

const MODULES = [
  ["1", "Запуск двигателя", "5 уроков"],
  ["2", "Язык агента", "5 уроков"],
  ["3", "Резервная копия с GitHub", "3 урока"],
  ["4", "Конституция проекта", "2 урока"],
  ["5", "Прокачка агента", "5 уроков"],
  ["6", "База данных продукта", "2 урока"],
  ["+", "Бонусный: эра агентов", "5 уроков"],
];

export function W60_ProgramOverview() {
  return (
    <SlideLayout
      speakerSide="right"
      contentClassName="!justify-start !py-0"
      style={{ background: "var(--brand-cream)" }}
      background={
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
              background: "radial-gradient(circle, rgba(182,255,0,0.19), transparent 68%)",
              filter: "blur(16px)",
            }}
          />
          <div className="cream-grain" />
        </>
      }
    >
      <div
        className="flex flex-col h-full w-full"
        style={{ paddingTop: "clamp(34px,5.5cqh,76px)", paddingBottom: "clamp(24px,3.6cqh,48px)" }}
      >
        <div className="shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold mb-3"
            style={{ color: "#9A8A6E" }}
          >
            <span style={{ color: "#FC5C02", fontWeight: 700 }}>// </span>ПРОГРАММА
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.14, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase leading-[1.02] tracking-[-0.02em]"
            style={{
              color: INK,
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(28px, 3.4cqw, 56px)",
            }}
          >
            ЧТО ВНУТРИ <span style={{ color: "#FC5C02" }}>ПРОГРАММЫ</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono"
            style={{ color: "#8B7B5E", fontSize: "clamp(13px,1.15cqw,20px)" }}
          >
            <span>7 модулей</span>
            <span>27 уроков</span>
            <span>9 часов практики</span>
            <span>в своём темпе</span>
          </motion.div>
        </div>

        <div className="flex-1 min-h-0 mt-5">
          <div className="w-full h-full grid gap-2 content-center">
            {MODULES.map(([n, name, lessons], i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.55 + i * 0.09, ease: [0.25, 1, 0.5, 1] }}
                className="flex items-center gap-4 rounded-xl px-5 py-3"
                style={{ background: "#FBF6EC", border: "1px solid #E7DCC8" }}
              >
                <span
                  className="font-mono shrink-0 text-center"
                  style={{
                    color: n === "+" ? "#FC5C02" : "#9A8A6E",
                    fontSize: "clamp(14px,1.25cqw,22px)",
                    width: "1.4em",
                  }}
                >
                  {n}
                </span>
                <span
                  className="font-semibold flex-1 min-w-0"
                  style={{ color: INK, fontSize: "clamp(15px,1.45cqw,26px)" }}
                >
                  {name}
                </span>
                <span
                  className="font-mono shrink-0"
                  style={{ color: "#9A8A6E", fontSize: "clamp(12px,1.05cqw,18px)" }}
                >
                  {lessons}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}

/* ——— Возражение «а если не получится» без сквозной нумерации ——— */
export function W60_ObjWontWork() {
  return (
    <SlideLayout
      speakerSide="right"
      background={
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(720px 520px at 74% 8%, rgba(182,255,0,0.11), transparent 66%), radial-gradient(520px 430px at 6% 90%, rgba(252,92,2,0.07), transparent 70%)",
          }}
        />
      }
    >
      <div className="flex flex-col justify-center h-full w-full">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold mb-3"
          style={{ color: "#7E7E7E" }}
        >
          <span style={{ color: "#B6FF00", fontWeight: 700 }}>// </span>ВОЗРАЖЕНИЕ
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
          transition={{ duration: 0.75, delay: 0.12, ease: [0.25, 1, 0.5, 1] }}
          className="font-bold uppercase leading-[1.02] tracking-[-0.02em] text-white"
          style={{
            fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(28px, 3.5cqw, 58px)",
          }}
        >
          «А ЕСЛИ У МЕНЯ НЕ <span style={{ color: "#B6FF00" }}>ПОЛУЧИТСЯ</span>?»
        </motion.h1>

        <div className="mt-8 grid gap-4" style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
          {[
            {
              t: "Вы не остаётесь одни",
              d: "Закрытая Telegram-группа по вайбкодингу — обратную связь даю лично я.",
            },
            {
              t: "Учитесь на чужих вопросах",
              d: "Рядом те, кто собирает то же самое. Часть ошибок вы обойдёте, не наступив на них.",
            },
          ].map((c, i) => (
            <motion.div
              key={c.t}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + i * 0.18, ease: [0.25, 1, 0.5, 1] }}
              className="rounded-2xl px-6 py-6"
              style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <div
                className="font-semibold text-white leading-tight"
                style={{ fontSize: "clamp(17px,1.65cqw,29px)" }}
              >
                {c.t}
              </div>
              <div
                className="mt-2.5 leading-snug"
                style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(14px,1.2cqw,21px)" }}
              >
                {c.d}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.95, ease: [0.25, 1, 0.5, 1] }}
          className="mt-7 rounded-2xl px-6 py-5"
          style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.3)" }}
        >
          <div
            className="font-semibold leading-tight text-white"
            style={{ fontSize: "clamp(17px,1.65cqw,29px)" }}
          >
            Уроки короткие, по 15–20 минут. Застряли на одном — приносите его в группу, а
            не бросаете весь курс.
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
