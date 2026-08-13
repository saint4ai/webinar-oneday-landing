"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";

/**
 * W60 · ДВА ТАРИФА — dark.
 *
 * 120 000 ₸ — самостоятельно, без обратной связи.
 * 150 000 ₸ — с сопровождением: закрытая Telegram-группа, обратную связь даёт лично Александр.
 *
 * Обучение 1,5 месяца. Zoom-созвонов в этом формате нет — вся обратная связь в Telegram.
 * Рассрочка: 120 000 → 10 000 ₸/мес на 12; 150 000 → 12 500 ₸/мес на 12.
 */

const BASE = [
  "7 модулей, 27 уроков, 9 часов практики",
  "Доступ к платформе onAI Academy",
  "Шаблоны, команды, метод «Конституция проекта»",
  "Доступ остаётся у вас",
];

const PLUS = [
  "Закрытая Telegram-группа по вайбкодингу",
  "Обратную связь даю лично я",
  "Разбор вашего проекта, а не общей теории",
];

export function W60_Tariffs() {
  return (
    <SlideLayout
      speakerSide="right"
      background={
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(760px 540px at 74% 6%, rgba(182,255,0,0.13), transparent 66%), radial-gradient(540px 440px at 6% 92%, rgba(252,92,2,0.08), transparent 70%)",
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
          <span style={{ color: "#B6FF00", fontWeight: 700 }}>// </span>ДВА ФОРМАТА УЧАСТИЯ
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
          transition={{ duration: 0.75, delay: 0.12, ease: [0.25, 1, 0.5, 1] }}
          className="font-bold uppercase leading-[1.02] tracking-[-0.02em] text-white"
          style={{
            fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(26px, 3.2cqw, 54px)",
          }}
        >
          ВЫБЕРИТЕ, КАК <span style={{ color: "#B6FF00" }}>УЧИТЬСЯ</span>
        </motion.h1>

        <div className="mt-7 grid gap-4" style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
          {/* Самостоятельно */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.25, 1, 0.5, 1] }}
            className="rounded-2xl px-6 py-6 flex flex-col"
            style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.11)" }}
          >
            <div
              className="font-mono uppercase tracking-[0.14em]"
              style={{ color: "#7E7E7E", fontSize: "clamp(10px,0.85cqw,13px)" }}
            >
              Самостоятельно
            </div>
            <div
              className="font-bold leading-none mt-2 whitespace-nowrap"
              style={{
                color: "#FFFFFF",
                fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
                fontSize: "clamp(26px,2.9cqw,48px)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              120 000 ₸
            </div>
            <div
              className="mt-1.5 font-mono"
              style={{ color: "#6E6E6E", fontSize: "clamp(11px,1cqw,17px)" }}
            >
              или 10 000 ₸ в месяц · 12 месяцев
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {BASE.map((t) => (
                <div key={t} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="shrink-0 mt-[0.6em]"
                    style={{ width: 13, height: 2, background: "rgba(255,255,255,0.3)" }}
                  />
                  <span
                    className="leading-snug"
                    style={{ color: "rgba(255,255,255,0.72)", fontSize: "clamp(13px,1.15cqw,20px)" }}
                  >
                    {t}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="mt-auto pt-5 leading-snug"
              style={{ color: "rgba(255,255,255,0.4)", fontSize: "clamp(12.5px,1.08cqw,19px)" }}
            >
              Проходите в своём темпе. Вопросы разбираете сами.
            </div>
          </motion.div>

          {/* С сопровождением */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65, ease: [0.25, 1, 0.5, 1] }}
            className="relative rounded-2xl px-6 py-6 flex flex-col"
            style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.34)" }}
          >
            <div
              className="font-mono uppercase tracking-[0.14em]"
              style={{ color: "#B6FF00", fontSize: "clamp(10px,0.85cqw,13px)" }}
            >
              С сопровождением
            </div>
            <div
              className="font-bold leading-none mt-2 whitespace-nowrap"
              style={{
                color: "#B6FF00",
                fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
                fontSize: "clamp(26px,2.9cqw,48px)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              150 000 ₸
            </div>
            <div
              className="mt-1.5 font-mono"
              style={{ color: "rgba(182,255,0,0.65)", fontSize: "clamp(11px,1cqw,17px)" }}
            >
              или 12 500 ₸ в месяц · 12 месяцев
            </div>

            <div
              className="mt-5 font-semibold text-white"
              style={{ fontSize: "clamp(13px,1.15cqw,20px)" }}
            >
              Всё из первого тарифа, плюс:
            </div>

            <div className="mt-2.5 flex flex-col gap-2">
              {PLUS.map((t) => (
                <div key={t} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="shrink-0 mt-[0.6em]"
                    style={{ width: 13, height: 2, background: "#B6FF00" }}
                  />
                  <span
                    className="leading-snug text-white font-medium"
                    style={{ fontSize: "clamp(13px,1.18cqw,21px)" }}
                  >
                    {t}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="mt-auto pt-5 leading-snug font-semibold"
              style={{ color: "#B6FF00", fontSize: "clamp(12.5px,1.12cqw,20px)" }}
            >
              Застряли — пишете в группу и выходите с решением.
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.05 }}
          className="mt-5 leading-snug"
          style={{ color: "rgba(255,255,255,0.55)", fontSize: "clamp(13px,1.2cqw,21px)" }}
        >
          Обучение идёт полтора месяца. Забронировать место — предоплата 10 000 ₸.
        </motion.div>
      </div>
    </SlideLayout>
  );
}

/* ——— Что даёт сопровождение: раскрываем ценность 150 000 ——— */
export function W60_Mentoring() {
  return (
    <SlideLayout
      speakerSide="right"
      background={
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(720px 520px at 76% 8%, rgba(182,255,0,0.12), transparent 66%), radial-gradient(520px 430px at 5% 90%, rgba(252,92,2,0.07), transparent 70%)",
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
          <span style={{ color: "#B6FF00", fontWeight: 700 }}>// </span>ЧТО ДАЁТ СОПРОВОЖДЕНИЕ
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
          transition={{ duration: 0.75, delay: 0.12, ease: [0.25, 1, 0.5, 1] }}
          className="font-bold uppercase leading-[1.02] tracking-[-0.02em] text-white"
          style={{
            fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(28px, 3.4cqw, 56px)",
          }}
        >
          ЗАСТРЯЛИ — <span style={{ color: "#B6FF00" }}>ПИШЕТЕ МНЕ</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-4 leading-snug max-w-3xl"
          style={{ color: "rgba(255,255,255,0.62)", fontSize: "clamp(15px,1.35cqw,23px)" }}
        >
          Закрытая Telegram-группа по вайбкодингу. Скидываете вопрос, код или скриншот — отвечаю лично.
        </motion.p>

        <div className="mt-7 grid gap-3" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          {[
            { n: "01", t: "Приносите свой проект", d: "Разбираем вашу задачу, а не абстрактный пример из урока." },
            { n: "02", t: "Не копите вопрос", d: "Упёрлись вечером — пишете вечером. Не ищете ответ неделю в интернете." },
            { n: "03", t: "Отвечаю я", d: "Не куратор по методичке. Тот же человек, который собрал эти продукты." },
          ].map((c, i) => (
            <motion.div
              key={c.n}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.6 + i * 0.14, ease: [0.25, 1, 0.5, 1] }}
              className="rounded-2xl px-5 py-5"
              style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <div
                className="font-mono"
                style={{ color: "#B6FF00", fontSize: "clamp(12px,1.05cqw,18px)" }}
              >
                {c.n}
              </div>
              <div
                className="font-semibold text-white leading-tight mt-2"
                style={{ fontSize: "clamp(15px,1.4cqw,25px)" }}
              >
                {c.t}
              </div>
              <div
                className="mt-2 leading-snug"
                style={{ color: "rgba(255,255,255,0.58)", fontSize: "clamp(13px,1.1cqw,19px)" }}
              >
                {c.d}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1, ease: [0.25, 1, 0.5, 1] }}
          className="mt-7 rounded-2xl px-6 py-5"
          style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.3)" }}
        >
          <div
            className="font-semibold leading-tight text-white"
            style={{ fontSize: "clamp(16px,1.6cqw,28px)" }}
          >
            Разница между «посмотрел курс» и «собрал продукт» — обычно один вопрос,
            на который некому ответить.
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
