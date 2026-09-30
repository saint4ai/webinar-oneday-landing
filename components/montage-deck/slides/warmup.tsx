"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Statement } from "../Statement";
import { T, card } from "../theme";
import { Arrow, EASE, Em, Fill, Note, Stagger, txt } from "../ui";

/**
 * Прогрев перед каждым уроком: 08w — как я пришёл к ИИ-монтажу (перед уроком 1), 23w — реклама товара у меня
 * (перед уроком 2), 41w — заявки из директа у меня (перед уроком 3). Каждый заканчивается мостом к уроку.
 * Факты — из деки и базы onai-workspace (about_me/alexander.md, projects/webinar_oneday/raspakovka_eksperta.md,
 * прошлый однодневник references/webinars_reference/01_odnodnevnik__SLIDE_BY_SLIDE.md). Чего там нет или что ждёт
 * подтверждения — в квадратных скобках <Fill>: это дописывает Александр до эфира.
 */

export { Fill };

/** Шаг пути: год или этап, что делал. Точка загорается, когда до неё дошла золотая линия. */
export type Step = { when: ReactNode; what: ReactNode; text?: ReactNode; now?: boolean };

/** Вертикальный путь: золотая линия бежит сверху вниз, этапы загораются по очереди, последний — золотой. */
export function Path({ steps, t0 = 0.35, dt = 0.22 }: { steps: Step[]; t0?: number; dt?: number }) {
  return (
    <div className="relative" style={{ maxWidth: "46cqw", paddingLeft: "2.6cqw" }}>
      <div className="absolute" style={{ left: "0.75cqw", top: "0.9cqw", bottom: "0.9cqw", width: "0.2cqw", borderRadius: 4, background: `${T.brown}26` }} />
      <motion.div className="absolute" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: t0, duration: dt * (steps.length - 1), ease: "linear" }}
        style={{ left: "0.75cqw", top: "0.9cqw", bottom: "0.9cqw", width: "0.2cqw", borderRadius: 4, background: `linear-gradient(180deg, ${T.gold}, ${T.gold2})`, transformOrigin: "top" }} />
      <div className="grid gap-[1.1cqw]">
        {steps.map((s, i) => (
          <div key={i} className="relative">
            <motion.span className="absolute" initial={{ scale: 0.5, backgroundColor: T.card }} animate={{ scale: [0.5, 1.3, 1], backgroundColor: T.gold }}
              transition={{ delay: t0 + i * dt, duration: 0.4, ease: EASE }}
              style={{ left: "-2.35cqw", top: "0.35cqw", width: "1.2cqw", height: "1.2cqw", borderRadius: 99, border: `1.5px solid ${T.gold2}`, boxShadow: s.now ? `0 0 0 0.45cqw ${T.gold}40` : "none" }} />
            <motion.div initial={{ opacity: 0, x: "-1cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ delay: t0 + i * dt, duration: 0.4, ease: EASE }}>
              <div style={{ ...txt, fontSize: "0.8cqw", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: s.now ? T.brown : T.accent }}>{s.when}</div>
              <div style={{ ...txt, fontWeight: 700, fontSize: "1.35cqw", marginTop: "0.15cqw", color: s.now ? T.brown : T.ink }}>{s.what}</div>
              {s.text && <div style={{ ...txt, fontWeight: 500, fontSize: "1.05cqw", color: T.muted, marginTop: "0.15cqw" }}>{s.text}</div>}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Задача → как решает агент → результат. Результат — крупно коричневым или пропуск в скобках. */
export type Task = { title: ReactNode; how: ReactNode; result: ReactNode };

export function Tasks({ items, cols = 2 }: { items: Task[]; cols?: 2 | 3 }) {
  return (
    <div className="grid gap-[0.9cqw]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: "54cqw" }}>
      {items.map((t, i) => (
        <Stagger key={i} i={i} style={{ ...card, padding: "1.2cqw 1.4cqw", display: "flex", flexDirection: "column" }}>
          <div style={{ ...txt, fontWeight: 700, fontSize: "1.15cqw" }}>{t.title}</div>
          <div style={{ ...txt, fontWeight: 500, fontSize: "0.92cqw", color: T.muted, marginTop: "0.3cqw" }}>{t.how}</div>
          <div style={{ marginTop: "auto", paddingTop: "0.8cqw", fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.05cqw", lineHeight: 1.3, color: T.brown }}>{t.result}</div>
        </Stagger>
      ))}
    </div>
  );
}

/** Строка «насколько мощно»: золотая рамка, въезжает последней. */
export const Power = ({ i, children }: { i: number; children: ReactNode }) => (
  <Stagger i={i} style={{ marginTop: "1.2cqw", maxWidth: "54cqw", borderRadius: 18, padding: "0.9cqw 1.3cqw", border: `1.5px solid ${T.gold2}`, background: `${T.gold}1F`, ...txt, fontWeight: 700, fontSize: "1.05cqw" }}>
    {children}
  </Stagger>
);

/** Мост к уроку: стрелка и фраза «сейчас покажу…», въезжает последней. */
export const Bridge = ({ i, children }: { i: number; children: ReactNode }) => (
  <Stagger i={i} className="flex items-center gap-[0.6cqw]" style={{ marginTop: "1.1cqw", ...txt, fontWeight: 700, fontSize: "1.15cqw", color: T.brown }}>
    <Arrow color={T.brown} size="1.5cqw" />{children}
  </Stagger>
);

/** 08w · Прогрев перед уроком 1: как я пришёл к ИИ-монтажу. Путь без денег (деньги — на 09), последний шаг — сегодня, в конце мост к уроку. */
export function M_MyPath() {
  return (
    <Statement kicker="Перед уроком 1 · мой путь" title={<>Как я пришёл <Em>к ИИ-монтажу</Em></>} size="3cqw">
      <Path steps={[
        { when: "Начинал", what: "Таргетолог", text: "Запускал рекламу клиентам" },
        { when: "3 года", what: "No-code и вайбкодинг", text: "ИИ-менеджеры для бизнеса, потом свои продукты на Claude без штатных программистов" },
        { when: "Апрель 2026", what: "Вернулся в Instagram", text: <Fill>сколько часов уходило на монтаж одного ролика до агента</Fill> },
        { when: "Сейчас", what: "Рилсы монтирует ИИ-агент по моему голосу", text: <Fill>момент, когда решил отдать монтаж агенту</Fill>, now: true },
      ]} />
      <Note style={{ marginTop: "1.2cqw" }}>Делаю инструменты для себя. Потом оказывается, что они нужны другим</Note>
      <Bridge i={6}>Сейчас покажу, как агент монтирует по голосу</Bridge>
    </Statement>
  );
}

/** 23w · Прогрев перед уроком 2: реклама товара у меня. Все цифры — пропуски: их нет ни в деке, ни в базе. В конце мост к уроку. */
export function M_MyMontage() {
  return (
    <Statement kicker="Перед уроком 2 · у меня так" title={<>Реклама товара <Em>без съёмки</Em></>} size="2.9cqw">
      <Tasks items={[
        { title: "Где применяю", how: "Ролики из фото товара, без оператора и студии", result: <Fill>свой продукт или клиенты, какие товары</Fill> },
        { title: "Сколько роликов сделал", how: "Фото → ролик 9:16 с озвучкой", result: <Fill>сколько роликов и какой результат</Fill> },
        { title: "Съёмка у продакшна", how: "Оператор, студия, монтаж", result: <Fill>цена в ₸ и источник</Fill> },
        { title: "Моё время на ролик", how: "От фото до готового ролика", result: <Fill>было → стало</Fill> },
      ]} />
      <Power i={4}>Насколько мощно: <Fill>сколько денег и дней экономит ролик из фото вместо съёмки</Fill></Power>
      <Bridge i={5}>Сейчас покажу, как собрать такой ролик из фото</Bridge>
    </Statement>
  );
}

/** 41w · Прогрев перед уроком 3: заявки из директа у меня. Цифры из базы, которые ждут подтверждения, — в скобках. В конце мост к уроку. */
export function M_MyAutomation() {
  return (
    <Statement kicker="Перед уроком 3 · у меня так" title={<>Заявки из директа <Em>у меня</Em></>} size="2.9cqw">
      <Tasks cols={3} items={[
        { title: "ИИ-менеджеры бизнесам", how: "3 года собирал их в WhatsApp, Instagram и Telegram", result: <Fill>около 30 бизнесов, подтвердить</Fill> },
        { title: "GPT-бот в директе", how: "Отвечает на сообщения и собирает заявки", result: <Fill>3 500 заявок с начала 2024, актуально?</Fill> },
        { title: "Бот по кодовому слову", how: "Выдаёт гайд в директе и передаёт контакт мне", result: <Fill>с какого месяца работает и сколько контактов</Fill> },
      ]} />
      <Power i={3}>Насколько мощно: <Fill>сколько часов в неделю экономит автоматизация</Fill></Power>
      <Bridge i={4}>Урок 3: как собрать это у себя</Bridge>
    </Statement>
  );
}
