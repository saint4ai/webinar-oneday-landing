"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";

/**
 * W60 · МИНУСЫ И ЧТО ИХ ЗАКРЫВАЕТ — два слайда, dark.
 *
 * Заменяют Slide_21_Downsides и Slide_21b_DownsidesFix, которые пугали кодом
 * («ошибку в коде не решить через нейросеть», «кнопки лагают»).
 *
 * Смысл (Александр, дословно): минус не в том, что надо знать код. Минус в том,
 * что человек не понимает, КАК агент работает, КАКИЕ навыки в него заложить и
 * КАК описать процесс своей работы. Отсюда: он вайбкодит, делает себе
 * AI-агента — а тот работает не так, как ему нужно.
 *
 * Подача: схематично, по этапам, каждая причина привязана к конкретной боли.
 */

const CAUSES = [
  {
    n: "01",
    cause: "Не понимаете, как он работает",
    then: "Просите у него то, чего он не умеет, и не просите того, что он сделал бы за минуту. Половина возможностей проходит мимо вас.",
  },
  {
    n: "02",
    cause: "Не знаете, какие навыки в него заложить",
    then: "Агент остаётся универсальным болтуном. Он не знает вашу нишу, ваш прайс, ваш тон — и выдаёт усреднённое, к вашей работе не подходящее.",
  },
  {
    n: "03",
    cause: "Не умеете описать свой процесс",
    then: "Вы говорите «сделай нормально» — он додумывает за вас. И делает не так, как работаете вы, а как принято у кого-то другого.",
  },
];

const RESULT = [
  "Агент делает не то, вы правите по кругу",
  "Сервис получается кривой и тормозит",
  "Токены горят, подписка кончается к середине месяца",
  "Вы зацикливаетесь и не понимаете, где ошибка",
];

export function W60_Downsides() {
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
              "radial-gradient(720px 520px at 76% 6%, rgba(252,92,2,0.11), transparent 66%), radial-gradient(520px 430px at 5% 90%, rgba(182,255,0,0.06), transparent 70%)",
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
            <span style={{ color: "#FC5C02", fontWeight: 700 }}>// </span>ЧЕСТНО О МИНУСАХ
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
            А ЕСТЬ <span style={{ color: "#FC5C02" }}>МИНУСЫ?</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className="mt-3.5 leading-snug max-w-4xl"
            style={{ color: "rgba(255,255,255,0.75)", fontSize: "clamp(14px,1.32cqw,24px)" }}
          >
            Говорить с агентом легко — обычными словами, как с человеком. Код пишет он, не
            вы. Минус в другом:{" "}
            <span style={{ color: "#FC5C02", fontWeight: 600 }}>
              агент работает ровно настолько хорошо, насколько хорошо вы объяснили ему свою
              работу
            </span>
            . И вот где это ломается:
          </motion.p>
        </div>

        {/* три причины — схема по этапам */}
        <div className="flex-1 min-h-0 mt-4">
          <div className="w-full h-full flex flex-col gap-2.5 justify-center">
            {CAUSES.map((c, i) => (
              <motion.div
                key={c.n}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.55 + i * 0.14, ease: [0.25, 1, 0.5, 1] }}
                className="grid items-start rounded-xl px-5 py-3.5"
                style={{
                  gridTemplateColumns: "auto minmax(0,0.85fr) 22px minmax(0,1.15fr)",
                  gap: "14px",
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                <span
                  className="font-mono shrink-0"
                  style={{ color: "#FC5C02", fontSize: "clamp(12px,1.05cqw,18px)", paddingTop: "0.15em" }}
                >
                  {c.n}
                </span>
                <span
                  className="font-semibold text-white leading-snug"
                  style={{ fontSize: "clamp(14px,1.3cqw,23px)" }}
                >
                  {c.cause}
                </span>
                <span
                  aria-hidden
                  className="font-mono text-center"
                  style={{ color: "#FC5C02", fontSize: "clamp(13px,1.05cqw,19px)", paddingTop: "0.1em" }}
                >
                  &rarr;
                </span>
                <span
                  className="leading-snug"
                  style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(13px,1.18cqw,21px)" }}
                >
                  {c.then}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* к чему это приводит */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 1.05, ease: [0.25, 1, 0.5, 1] }}
          className="shrink-0 rounded-2xl px-5 py-4 mt-3"
          style={{ background: "rgba(252,92,2,0.08)", border: "1px solid rgba(252,92,2,0.3)" }}
        >
          <div
            className="font-mono uppercase tracking-[0.14em] mb-2.5"
            style={{ color: "#FC5C02", fontSize: "clamp(9.5px,0.82cqw,12px)" }}
          >
            И вы получаете
          </div>
          <div
            className="grid gap-x-6 gap-y-1.5"
            style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}
          >
            {RESULT.map((t) => (
              <div key={t} className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className="shrink-0 mt-[0.6em]"
                  style={{ width: 12, height: 2, background: "#FC5C02" }}
                />
                <span
                  className="leading-snug text-white"
                  style={{ fontSize: "clamp(13px,1.15cqw,21px)" }}
                >
                  {t}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

/* ——— Что закрывает минус: те же три причины, но снятые ——— */
const FIX = [
  {
    n: "01",
    t: "Карта возможностей агента",
    d: "Что он делает отлично, что посредственно, а что не делает вообще. Вы перестаёте просить невозможное и начинаете отдавать ему то, что он закрывает за минуту.",
  },
  {
    n: "02",
    t: "Навыки под вашу нишу",
    d: "Ваш опыт, прайс, тон и правила закладываются в агента один раз. Дальше он работает как ваш сотрудник, а не как поисковик.",
  },
  {
    n: "03",
    t: "Описанный процесс работы",
    d: "Ваш способ делать дело, разложенный по шагам, чтобы агенту нечего было додумывать. Метод «Конституция проекта» — про это.",
  },
];

export function W60_DownsidesFix() {
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
              "radial-gradient(740px 530px at 74% 6%, rgba(182,255,0,0.13), transparent 66%), radial-gradient(520px 430px at 5% 90%, rgba(252,92,2,0.07), transparent 70%)",
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
            <span style={{ color: "#B6FF00", fontWeight: 700 }}>// </span>ЧТО ЭТО ЗАКРЫВАЕТ
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
            transition={{ duration: 0.75, delay: 0.12, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase leading-[1.02] tracking-[-0.02em] text-white"
            style={{
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(25px, 3.05cqw, 52px)",
            }}
          >
            ТРИ ПРИЧИНЫ — <span style={{ color: "#B6FF00" }}>ТРИ РЕШЕНИЯ</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className="mt-3.5 leading-snug max-w-4xl"
            style={{ color: "rgba(255,255,255,0.68)", fontSize: "clamp(14px,1.3cqw,23px)" }}
          >
            Это не годы обучения и не курс информатики. Это три вещи, которые собираются
            один раз и дальше работают на вас в каждом проекте.
          </motion.p>
        </div>

        <div className="flex-1 min-h-0 mt-4">
          <div className="w-full h-full flex flex-col gap-2.5 justify-center">
            {FIX.map((c, i) => (
              <motion.div
                key={c.n}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.55 + i * 0.14, ease: [0.25, 1, 0.5, 1] }}
                className="grid items-start rounded-xl px-5 py-4"
                style={{
                  gridTemplateColumns: "auto minmax(0,0.8fr) minmax(0,1.2fr)",
                  gap: "16px",
                  background: "rgba(182,255,0,0.06)",
                  border: "1px solid rgba(182,255,0,0.26)",
                }}
              >
                <span
                  className="font-mono shrink-0"
                  style={{ color: "#B6FF00", fontSize: "clamp(12px,1.05cqw,18px)", paddingTop: "0.15em" }}
                >
                  {c.n}
                </span>
                <span
                  className="font-semibold text-white leading-snug"
                  style={{ fontSize: "clamp(14px,1.32cqw,24px)" }}
                >
                  {c.t}
                </span>
                <span
                  className="leading-snug"
                  style={{ color: "rgba(255,255,255,0.62)", fontSize: "clamp(13px,1.15cqw,21px)" }}
                >
                  {c.d}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 1.1, ease: [0.25, 1, 0.5, 1] }}
          className="shrink-0 rounded-2xl px-6 py-4 mt-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <div
            className="font-semibold leading-tight text-white"
            style={{ fontSize: "clamp(15px,1.5cqw,26px)" }}
          >
            Я собирал эту базу два года и на своих ошибках.
            <br />
            Вы можете взять её готовой{" "}
            <span style={{ color: "#B6FF00" }}>и не жечь на этом месяцы</span>.
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
