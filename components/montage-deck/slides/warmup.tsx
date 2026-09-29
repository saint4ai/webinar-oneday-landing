"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Statement } from "../Statement";
import { T, card } from "../theme";
import { EASE, Em, Note, Stagger, nb, txt } from "../ui";

/**
 * Прогрев перед каждым уроком: 08w — мой путь к монтажу (перед уроком 1), 23w — что вайбкодинг решает у меня
 * в монтаже (перед уроком 2), 41w — что он автоматизирует у меня (перед уроком 3).
 * Факты — из деки и базы onai-workspace (about_me/alexander.md, projects/webinar_oneday/raspakovka_eksperta.md,
 * projects/content_pipeline.md). Чего там нет — в квадратных скобках <Fill>: это дописывает Александр до эфира.
 */

/** Пропуск, который дописывает Александр: пунктирная плашка «[…]». На эфир не выходит, пока не заменён текстом. */
export const Fill = ({ children }: { children: ReactNode }) => (
  <span style={{ display: "inline", color: T.brownLt, background: `${T.gold}1F`, border: `1px dashed ${T.brownLt}`, borderRadius: 8, padding: "0 0.35cqw", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
    [{children}]
  </span>
);

/** Шаг пути: год или этап, что делал. Точка загорается, когда до неё дошла золотая линия. */
type Step = { when: ReactNode; what: ReactNode; text?: ReactNode; now?: boolean };

/** Вертикальный путь: золотая линия бежит сверху вниз, этапы загораются по очереди, последний — золотой. */
function Path({ steps, t0 = 0.35, dt = 0.22 }: { steps: Step[]; t0?: number; dt?: number }) {
  return (
    <div className="relative" style={{ maxWidth: "46cqw", paddingLeft: "2.6cqw" }}>
      <div className="absolute" style={{ left: "0.75cqw", top: "0.9cqw", bottom: "0.9cqw", width: "0.2cqw", borderRadius: 4, background: `${T.brown}26` }} />
      <motion.div className="absolute" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: t0, duration: dt * (steps.length - 1), ease: "linear" }}
        style={{ left: "0.75cqw", top: "0.9cqw", bottom: "0.9cqw", width: "0.2cqw", borderRadius: 4, background: `linear-gradient(180deg, ${T.gold}, ${T.gold2})`, transformOrigin: "top" }} />
      <div className="grid gap-[0.9cqw]">
        {steps.map((s, i) => (
          <div key={i} className="relative">
            <motion.span className="absolute" initial={{ scale: 0.5, backgroundColor: T.card }} animate={{ scale: [0.5, 1.3, 1], backgroundColor: T.gold }}
              transition={{ delay: t0 + i * dt, duration: 0.4, ease: EASE }}
              style={{ left: "-2.35cqw", top: "0.35cqw", width: "1.2cqw", height: "1.2cqw", borderRadius: 99, border: `1.5px solid ${T.gold2}`, boxShadow: s.now ? `0 0 0 0.45cqw ${T.gold}40` : "none" }} />
            <motion.div initial={{ opacity: 0, x: "-1cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ delay: t0 + i * dt, duration: 0.4, ease: EASE }}>
              <div style={{ ...txt, fontSize: "0.8cqw", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: s.now ? T.brown : T.accent }}>{s.when}</div>
              <div style={{ ...txt, fontWeight: 700, fontSize: "1.2cqw", marginTop: "0.15cqw", color: s.now ? T.brown : T.ink }}>{s.what}</div>
              {s.text && <div style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.muted, marginTop: "0.15cqw" }}>{s.text}</div>}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Задача → как решает агент → результат. Результат — крупно коричневым или пропуск в скобках. */
type Task = { title: ReactNode; how: ReactNode; result: ReactNode };

function Tasks({ items }: { items: Task[] }) {
  return (
    <div className="grid grid-cols-2 gap-[0.9cqw]" style={{ maxWidth: "54cqw" }}>
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
const Power = ({ i, children }: { i: number; children: ReactNode }) => (
  <Stagger i={i} style={{ marginTop: "1.2cqw", maxWidth: "54cqw", borderRadius: 18, padding: "0.9cqw 1.3cqw", border: `1.5px solid ${T.gold2}`, background: `${T.gold}1F`, ...txt, fontWeight: 700, fontSize: "1.05cqw" }}>
    {children}
  </Stagger>
);

/** 08w · Прогрев перед уроком 1: как я пришёл к монтажу. Путь сверху вниз, последний шаг — сегодня. */
export function M_MyPath() {
  return (
    <Statement kicker="Мой путь" title={<>Как я пришёл <Em>к монтажу</Em></>} size="3cqw">
      <Path steps={[
        { when: "Начинал", what: "Таргетолог", text: "Запускал рекламу клиентам" },
        { when: "3 года", what: "No-code: N8N и Make", text: "ИИ-менеджеры для отделов продаж в WhatsApp, Instagram и Telegram" },
        { when: "Вайбкодинг", what: "Свои продукты на Claude", text: "AI-Таргетолог и OmniDash без штатных программистов" },
        { when: "Апрель 2026", what: "Вернулся в Instagram", text: <Fill>почему монтаж стал узким местом: сколько времени и денег уходило</Fill> },
        { when: "Сейчас", what: "Рилсы монтирует ИИ-агент по моему голосу", text: <Fill>когда и как пришла идея отдать монтаж агенту</Fill>, now: true },
      ]} />
      <Note style={{ marginTop: "1.4cqw" }}>Делаю инструменты для себя. Потом оказывается, что они нужны другим</Note>
    </Statement>
  );
}

/** 23w · Прогрев перед уроком 2: что вайбкодинг уже решает у меня в монтаже и насколько мощно. */
export function M_MyMontage() {
  return (
    <Statement kicker="Перед уроком 2 · у меня так" title={<>Что вайбкодинг решает <Em>у меня в монтаже</Em></>} size="2.8cqw">
      <Tasks items={[
        { title: "Монтаж рилсов", how: "Агент собирает графику, субтитры и звук по моему голосу", result: <>15 рилсов · {nb("140 689")} просмотров</> },
        { title: "Правки словами", how: "Пишу, что поменять, агент пересобирает черновик", result: <Fill>сколько минут уходит на правку</Fill> },
        { title: "Реклама товара из фото", how: <Fill>где применяю: свой продукт или клиенты</Fill>, result: <Fill>результат: ролики, заявки, продажи</Fill> },
        { title: "Озвучка копией голоса", how: <Fill>где применяю</Fill>, result: <Fill>результат</Fill> },
      ]} />
      <Power i={4}>Около {nb("50 000 ₸")} в месяц вместо {nb("300 000 ₸")} на монтажёра · <Fill>время на ролик: было → стало</Fill></Power>
    </Statement>
  );
}

/** 41w · Прогрев перед уроком 3: что вайбкодинг автоматизирует у меня и насколько мощно. */
export function M_MyAutomation() {
  return (
    <Statement kicker="Перед уроком 3 · у меня так" title={<>Что вайбкодинг <Em>автоматизирует у меня</Em></>} size="2.8cqw">
      <Tasks items={[
        { title: "ИИ-менеджеры в продажах", how: "3 года собирал их бизнесам в WhatsApp, Instagram и Telegram", result: <Fill>сколько бизнесов, подтвердить цифру</Fill> },
        { title: "Бот по кодовому слову", how: "Выдаёт гайд в директе и передаёт контакт мне", result: <Fill>с какого месяца работает и сколько контактов собрал</Fill> },
        { title: "Контент в Telegram", how: "ИИ переписывает посты под мой голос, я только одобряю", result: "30–50 секунд от поста до черновика" },
        { title: "Свои продукты", how: "AI-Таргетолог и OmniDash на Claude, без штатных программистов", result: <Fill>сроки сборки, подтвердить</Fill> },
      ]} />
      <Power i={4}><Fill>насколько мощно: сколько часов в неделю экономит автоматизация</Fill></Power>
    </Statement>
  );
}

