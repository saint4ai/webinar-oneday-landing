"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";

/**
 * W60 · «КТО ТАКОЙ ВАЙБКОДЕР» — cream.
 *
 * Заменяет Slide_24_WhoIsVibecoder, где вайбкодер описывался как «человек,
 * который собирает сервисы» — звучало как новая айти-профессия.
 *
 * Новый смысл (Александр): вайбкодинг — это инструмент, а не профессия.
 * Вайбкодер — не разработчик платформ, а человек любой профессии, который
 * взял агента в руки и делает свою работу быстрее.
 */
const INK = "#2A2520";

const WHO = [
  { who: "Бухгалтер", what: "закрывает сверку за 15 минут" },
  { who: "Юрист", what: "вычитывает договоры пачками" },
  { who: "Маркетолог", what: "собрал себе дашборд за вечер" },
  { who: "Владелец бизнеса", what: "сделал сервис под свой процесс" },
];

export function W60_WhoIsVibecoder() {
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
              right: "10%",
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
            <span style={{ color: "#FC5C02", fontWeight: 700 }}>// </span>КТО ТАКОЙ ВАЙБКОДЕР
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.14, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase leading-[1.02] tracking-[-0.02em]"
            style={{
              color: INK,
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(27px, 3.3cqw, 56px)",
            }}
          >
            ЭТО НЕ ДОЛЖНОСТЬ.
            <br />
            ЭТО <span style={{ color: "#FC5C02" }}>ИНСТРУМЕНТ В РУКАХ</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-4 leading-snug max-w-3xl"
            style={{ color: INK, fontSize: "clamp(15px,1.35cqw,23px)" }}
          >
            Вайбкодер не бросает своё дело и не идёт в айти. Он остаётся собой — и делает
            свою работу быстрее, чем раньше.
          </motion.p>
        </div>

        <div className="flex-1 min-h-0 mt-5">
          <div className="w-full h-full grid gap-2.5 content-center">
            {WHO.map((r, i) => (
              <motion.div
                key={r.who}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.12, ease: [0.25, 1, 0.5, 1] }}
                className="flex items-center gap-4 rounded-xl px-5 py-4"
                style={{ background: "#FBF6EC", border: "1px solid #E7DCC8" }}
              >
                <span
                  className="font-semibold shrink-0"
                  style={{ color: INK, fontSize: "clamp(15px,1.45cqw,26px)", minWidth: "9em" }}
                >
                  {r.who}
                </span>
                <span
                  aria-hidden
                  className="shrink-0"
                  style={{ width: 18, height: 2, background: "#FC5C02" }}
                />
                <span
                  className="leading-snug"
                  style={{ color: "rgba(42,37,32,0.72)", fontSize: "clamp(14px,1.32cqw,24px)" }}
                >
                  {r.what}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="shrink-0 font-semibold leading-snug"
          style={{ color: INK, fontSize: "clamp(15px,1.4cqw,25px)" }}
        >
          Никто из них не программист. Все они пользуются инструментом.
        </motion.div>
      </div>
    </SlideLayout>
  );
}
