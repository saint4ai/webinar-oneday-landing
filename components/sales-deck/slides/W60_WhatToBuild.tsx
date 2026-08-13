"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";

/**
 * W60 · «ЧТО ЗАКРОЕТСЯ АГЕНТОМ» — dark.
 *
 * Заменяет Slide_19_WhatToBuild, где был каталог «сайты, лендинги, портфолио,
 * магазины, приложения» — звучало как список услуг веб-студии.
 *
 * Новый смысл (Александр): вайбкодинг — инструмент. Показываем не «что вы будете
 * разрабатывать», а лестницу: от закрытия своей рутины до продукта, который
 * можно продавать. Человек сам находит на ней своё место.
 */

const LEVELS = [
  {
    n: "01",
    t: "Ваша рутина",
    d: "Отчёты, сверки, КП, договоры, разбор выгрузок. То, что вы делаете руками каждую неделю.",
    tag: "первый вечер",
  },
  {
    n: "02",
    t: "Инструмент под себя",
    d: "Считалка, трекер, таблица с логикой, дашборд с вашими цифрами. Ровно под ваш процесс, а не универсальный.",
    tag: "выходные",
  },
  {
    n: "03",
    t: "Витрина для клиентов",
    d: "Сайт, каталог, страница услуги. Не потому что вы веб-студия, а потому что вам нужна своя и сейчас.",
    tag: "пара дней",
  },
  {
    n: "04",
    t: "Продукт, который продаёте",
    d: "Сервис с пользователями, входом и базой. Тот уровень, где решение начинает приносить деньги.",
    tag: "месяц",
  },
];

export function W60_WhatToBuild() {
  return (
    <SlideLayout
      speakerSide="right"
      contentClassName="!justify-start !py-0"
      background={
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(730px 520px at 76% 6%, rgba(182,255,0,0.12), transparent 66%), radial-gradient(520px 430px at 5% 90%, rgba(252,92,2,0.07), transparent 70%)",
          }}
        />
      }
    >
      <div
        className="flex flex-col h-full w-full"
        style={{ paddingTop: "clamp(30px,5cqh,68px)", paddingBottom: "clamp(22px,3.2cqh,44px)" }}
      >
        <div className="shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold mb-3"
            style={{ color: "#7E7E7E" }}
          >
            <span style={{ color: "#B6FF00", fontWeight: 700 }}>// </span>ГДЕ ЭТО ПРИМЕНЯЮТ
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
            ОТ СВОЕЙ ЗАДАЧИ — <span style={{ color: "#B6FF00" }}>ДО СВОЕГО ПРОДУКТА</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className="mt-3.5 leading-snug max-w-4xl"
            style={{ color: "rgba(255,255,255,0.68)", fontSize: "clamp(14px,1.3cqw,23px)" }}
          >
            Начинать с четвёртого уровня не нужно. Большинство остаётся на первом и уже
            выигрывает часы каждую неделю. Дальше идут те, кому захотелось.
          </motion.p>
        </div>

        <div className="flex-1 min-h-0 mt-4">
          <div className="w-full h-full flex flex-col gap-2.5 justify-center">
            {LEVELS.map((c, i) => (
              <motion.div
                key={c.n}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.55 + i * 0.13, ease: [0.25, 1, 0.5, 1] }}
                className="grid items-center rounded-xl px-5 py-3.5"
                style={{
                  gridTemplateColumns: "auto minmax(0,0.75fr) minmax(0,1.35fr) auto",
                  gap: "16px",
                  background: i === 0 ? "rgba(182,255,0,0.06)" : "rgba(255,255,255,0.035)",
                  border:
                    i === 0
                      ? "1px solid rgba(182,255,0,0.28)"
                      : "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <span
                  className="font-mono shrink-0"
                  style={{ color: "#B6FF00", fontSize: "clamp(12px,1.05cqw,18px)" }}
                >
                  {c.n}
                </span>
                <span
                  className="font-semibold text-white leading-snug"
                  style={{ fontSize: "clamp(14px,1.35cqw,24px)" }}
                >
                  {c.t}
                </span>
                <span
                  className="leading-snug"
                  style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(13px,1.15cqw,21px)" }}
                >
                  {c.d}
                </span>
                <span
                  className="font-mono shrink-0 text-right"
                  style={{ color: "#6E6E6E", fontSize: "clamp(11px,0.95cqw,16px)" }}
                >
                  {c.tag}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 1.15, ease: [0.25, 1, 0.5, 1] }}
          className="shrink-0 rounded-2xl px-6 py-4 mt-3"
          style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.3)" }}
        >
          <div
            className="font-semibold leading-tight text-white"
            style={{ fontSize: "clamp(15px,1.48cqw,26px)" }}
          >
            Так это обычно и происходит: вы делаете инструмент под себя, он начинает
            работать — и выясняется, что{" "}
            <span style={{ color: "#B6FF00" }}>такая же задача есть ещё у сотни человек</span>.
            Продукт для себя становится продуктом на продажу.
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
