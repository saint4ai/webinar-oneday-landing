"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { LeadFunnel3D, ReelTunnel3D } from "../fx";
import { MontageBg } from "../MontageBg";
import { Statement } from "../Statement";
import { Logo as BrandLogo } from "../Logo";
import { RESULTS, fmtStat } from "../results";
import { T, card, goldButton, nightCard } from "../theme";
import { Card, DrawLine, EASE, Em, H, Lead, MaskIcon, Note, Rise, STEP, Stagger, at, nb, txt } from "../ui";
import { TUNNEL_REELS } from "./M_Cover";

/** 43 · Просмотры есть, заявок нет: путь зрителя, на последнем шаге он уходит из кадра. */
export function M_ViewsNoLeads() {
  const path = ["Посмотрел", "Лайкнул", "Ушёл"];
  return (
    <Statement obj="lg-s43-leaving" kicker="Урок 3 · Проблема" title={<>Просмотры есть. <Em>Заявок нет</Em></>} size="3.2cqw" lead="Человек посмотрел ролик, поставил лайк и ушёл. Здесь теряется больше всего.">
      <div className="flex items-center gap-[0.8cqw]">
        {path.map((p, i) => (
          <div key={p} className="flex items-center gap-[0.8cqw]">
            {i < 2 ? (
              <Stagger i={i * 2} style={{ ...card, borderRadius: 999, padding: "0.8cqw 1.6cqw", ...txt, fontSize: "1.15cqw" }}>{p}</Stagger>
            ) : (
              <motion.div initial={{ opacity: 0, x: "0cqw" }} animate={{ opacity: [0, 1, 1, 0.55], x: ["0cqw", "0cqw", "0cqw", "2.4cqw"] }}
                transition={{ delay: at(4, 0.28), duration: 1.6, times: [0, 0.2, 0.55, 1], ease: EASE }}
                style={{ borderRadius: 999, padding: "0.8cqw 1.6cqw", ...txt, fontSize: "1.15cqw", color: T.muted, border: `1.5px dashed ${T.brownLt}` }}>{p}</motion.div>
            )}
            {i < 2 && <DrawLine delay={at(i * 2 + 1, 0.4)} />}
          </div>
        ))}
      </div>
    </Statement>
  );
}

/** 44 ✦ · Ночной: объёмная воронка просмотры → кодовое слово → диалог с ботом → заявка (цифры из results.ts), справа цепочка комментарий → директ → Telegram. */
export function M_CodeWordFlow() {
  const r = RESULTS;
  const stages = [
    { label: "просмотры", value: fmtStat(r.funnelViews) },
    { label: "кодовое слово", value: fmtStat(r.bot.codeWords) },
    { label: "диалог с ботом", value: fmtStat(r.bot.dialogs) },
    { label: "заявка", value: fmtStat(r.bot.leads) },
  ];
  const nodes = [
    { logo: "instagram", head: "Комментарий", body: "МОНТАЖ" },
    { logo: "instagram", head: "Директ от бота", body: "Держите гайд, ловите ссылку" },
    { logo: "telegram", head: "Вам в Telegram", body: "Новый контакт из рилса" },
  ];
  return (
    <Statement tone="night" kicker="Кодовое слово" title={<>Кодовое слово превращает зрителя <Em night>в контакт</Em></>} size="2.5cqw"
      leftSize="25cqw" leftOverflow="visible" left={<div style={{ width: "25cqw", height: "34cqw" }}><LeadFunnel3D stages={stages} /></div>}>
      <div className="grid gap-[0.6cqw]" style={{ maxWidth: "26cqw" }}>
        {nodes.map((n, i) => (
          <motion.div key={n.head} initial={{ opacity: 0, x: "-1.2cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ delay: 0.5 + i * 0.35, duration: 0.45, ease: EASE }}
            style={{ ...nightCard, borderRadius: 18, padding: "0.8cqw 1.1cqw", ...(i === 2 ? { border: `1.5px solid ${T.gold2}` } : null) }}>
            <div className="flex items-center gap-[0.5cqw]"><MaskIcon name={n.logo} color={T.gold} size="1.1cqw" /><span style={{ ...txt, fontSize: "0.8cqw", color: T.nightMuted }}>{n.head}</span></div>
            <div style={{ ...txt, fontWeight: 700, marginTop: "0.35cqw", fontSize: i === 0 ? "1.3cqw" : "1cqw", fontFamily: i === 0 ? "var(--font-unbounded)" : undefined, color: i === 0 ? T.gold : T.nightText }}>{n.body}</div>
          </motion.div>
        ))}
      </div>
      <Stagger i={6} base={1.2} style={{ marginTop: "1.2cqw", maxWidth: "27cqw" }}>
        <div style={{ ...txt, fontSize: "1.05cqw", color: T.nightText }}>Рилс про агента: <span style={{ color: T.gold, fontWeight: 700 }}>68 комментариев</span> с кодовым словом на {nb("1 773")} просмотра</div>
      </Stagger>
      <Note color={T.nightMuted} style={{ marginTop: "0.8cqw" }}>Статистика Instagram, сентябрь 2026</Note>
    </Statement>
  );
}

/** Точки «печатает…» в пузыре собеседника. */
const Typing = () => (
  <div className="flex gap-[0.25cqw]" style={{ padding: "0.55cqw 0.8cqw" }}>
    {[0, 1, 2].map((k) => (
      <motion.span key={k} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: k * 0.15 }}
        style={{ width: "0.4cqw", height: "0.4cqw", borderRadius: 99, background: T.muted }} />
    ))}
  </div>
);

/** Директ в телефоне: сообщения появляются по одному, перед ответом бота — «печатает…». */
function DirectPhone({ msgs, step = 0.7 }: { msgs: { me?: boolean; t: string }[]; step?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const ids = msgs.map((_, i) => setTimeout(() => setN(i + 1), 350 + i * step * 1000));
    return () => ids.forEach(clearTimeout);
  }, [msgs, step]);
  const typing = n < msgs.length && n > 0 && !msgs[n].me;
  return (
    <div style={{ width: "17cqw", aspectRatio: "9/17", background: T.night, borderRadius: "2.4cqw", padding: "0.52cqw", boxShadow: `0 0 0 1px ${T.nightLine} inset, ${T.shadow}` }}>
      <div className="flex h-full w-full flex-col overflow-hidden" style={{ borderRadius: "1.98cqw", background: T.paper }}>
        <div className="flex items-center gap-[0.5cqw]" style={{ padding: "1.4cqw 1cqw 0.7cqw", borderBottom: `1px solid ${T.line}` }}>
          <span className="flex items-center justify-center" style={{ width: "1.8cqw", height: "1.8cqw", borderRadius: 99, background: `linear-gradient(180deg, ${T.gold}, ${T.gold2})` }}>
            <MaskIcon name="instagram" color={T.ink} size="1cqw" />
          </span>
          <div>
            <div style={{ ...txt, fontWeight: 700, fontSize: "0.8cqw" }}>saint4ai</div>
            <div style={{ ...txt, fontWeight: 500, fontSize: "0.62cqw", color: T.muted }}>{typing ? "печатает…" : "Директ"}</div>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-[0.45cqw]" style={{ padding: "0.8cqw" }}>
          <AnimatePresence initial={false}>
            {msgs.slice(0, n).map((m, i) => (
              <motion.div key={i} layout initial={{ opacity: 0, y: "0.8cqw", scale: 0.92 }} animate={{ opacity: 1, y: "0cqw", scale: 1 }} transition={{ duration: 0.3, ease: EASE }}
                style={{ alignSelf: m.me ? "flex-end" : "flex-start", maxWidth: "86%", padding: "0.55cqw 0.8cqw", ...txt, fontWeight: 500, fontSize: "0.78cqw", lineHeight: 1.35,
                  borderRadius: m.me ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.me ? T.ink : T.card, color: m.me ? T.nightText : T.ink,
                  ...(m.me ? { fontFamily: "var(--font-unbounded)", fontWeight: 700 } : null) }}>{m.t}</motion.div>
            ))}
            {typing && <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ alignSelf: "flex-start", borderRadius: "14px 14px 14px 4px", background: T.card }}><Typing /></motion.div>}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const BOT_MSGS = [
  { me: true, t: "МОНТАЖ" },
  { t: "Держите гайд: как делать вирусный рилс. Внутри правило первых 3 секунд" },
  { t: "Хотите, подскажу, с какого ролика начать под вашу нишу?" },
];

/** 45 ✦ · Бот выдаёт материал по кодовому слову: переписка в телефоне, сообщения по одному. */
export function M_BotGuide() {
  return (
    <Statement kicker="Урок 3.2" title={<>Бот выдаёт материал <Em>по кодовому слову</Em></>} size="2.8cqw" lead="Как SendPulse, только своё: тексты, материалы и логика ваши."
      leftSize="19cqw" left={
        <motion.div initial={{ opacity: 0, y: "3cqw", rotate: -3 }} animate={{ opacity: 1, y: "0cqw", rotate: 0 }} transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.1 }}>
          <DirectPhone msgs={BOT_MSGS} />
        </motion.div>
      }>
      <div className="flex flex-wrap gap-[0.6cqw]">
        {["Свои тексты", "Свои материалы", "Своя логика"].map((c, i) => (
          <Stagger key={c} i={i + 1}><span style={{ ...card, display: "inline-block", borderRadius: 999, padding: "0.65cqw 1.2cqw", ...txt, fontWeight: 700, fontSize: "0.95cqw" }}>{c}</span></Stagger>
        ))}
      </div>
    </Statement>
  );
}

/** 46 · ИИ-менеджер отвечает, ИИ-РОП проверяет: две карточки, между ними золотая связка. */
export function M_AIManager() {
  return (
    <Statement kicker="Урок 3.2 и 3.3" title={<>ИИ-менеджер отвечает. <Em>ИИ-РОП</Em> проверяет переписки</>} size="2.6cqw" lead="Заявки не теряются ночью и в выходные.">
      <div className="flex items-stretch" style={{ maxWidth: "52cqw" }}>
        <Stagger i={0} style={{ flex: 1 }}><Card icon="lg-i-botchat" no="ИИ-менеджер" title="Отвечает в WhatsApp и Instagram" text="Уточняет задачу клиента и ведёт его к заявке" style={{ height: "100%" }} /></Stagger>
        <div className="flex items-center" style={{ padding: "0 0.6cqw" }}><DrawLine delay={0.55} width="2cqw" /></div>
        <Stagger i={2} style={{ flex: 1 }}><Card icon="lg-i-magnifier" no="ИИ-РОП" title="Читает переписки" text="Оценивает работу с клиентом и подсказывает следующий шаг" accent style={{ height: "100%" }} /></Stagger>
      </div>
    </Statement>
  );
}

/** 47 ✦ · Отчёт в Telegram: уведомление падает сверху, строки отчёта проявляются по одной. */
export function M_TelegramReport() {
  const rows = [["Новые заявки", "12"], ["Готовы купить", "3"], ["Ждут звонка", "2"]];
  return (
    <Statement kicker="Урок 3.3" title={<>Отчёт по заявкам приходит <Em>в Telegram</Em></>} size="2.8cqw" lead="Кто написал, кто готов купить, кому звонить. Без захода в CRM.">
      <motion.div initial={{ opacity: 0, y: "-3cqw", scale: 0.96 }} animate={{ opacity: 1, y: "0cqw", scale: 1 }} transition={{ delay: 0.35, type: "spring", stiffness: 160, damping: 18 }}
        style={{ ...card, borderRadius: 22, padding: "1.2cqw 1.4cqw", maxWidth: "30cqw" }}>
        <div className="flex items-center gap-[0.5cqw]" style={{ marginBottom: "0.8cqw" }}>
          <MaskIcon name="telegram" color={T.brownLt} size="1.4cqw" /><span style={{ ...txt, fontWeight: 700 }}>Отчёт за день</span>
          <span style={{ ...txt, fontSize: "0.75cqw", color: T.muted, marginLeft: "auto" }}>пример</span>
        </div>
        {rows.map(([k, v], i) => (
          <motion.div key={k} className="flex justify-between" initial={{ opacity: 0, x: "-0.8cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ delay: 0.75 + i * 0.18, duration: 0.35, ease: EASE }}
            style={{ padding: "0.5cqw 0", borderTop: `1px solid ${T.line}`, ...txt }}>
            <span>{k}</span><span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: i === 1 ? T.brown : T.ink }}>{v}</span>
          </motion.div>
        ))}
      </motion.div>
    </Statement>
  );
}

/** 48 ✦ · Тот же агент собирает не только ролики: картинка слева, три карточки влетают по очереди. */
export function M_Builds() {
  const b = [["Презентация и КП", "lg-i-cards"], ["Сайт", "lg-i-laptopfilm"], ["Приложение", "lg-i-phones"]];
  return (
    <Statement kicker="Урок 3.1 и 3.4 · из вайбкодинга" title={<>Тот же агент собирает <Em>не только ролики</Em></>} size="2.7cqw" lead="Пишете словами, что нужно. Агент собирает."
      leftSize="22cqw" left={
        <motion.img src="/montage/obj/s48-builders.webp" alt="Человечки собирают приложение, сайт и презентацию" initial={{ opacity: 0, y: "2.4cqw", scale: 0.95 }} animate={{ opacity: 1, y: "0cqw", scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE }} style={{ width: "22cqw", height: "auto", filter: "drop-shadow(0 26px 36px rgba(42,33,28,.2))" }} />
      }>
      <div className="grid grid-cols-3 gap-[0.8cqw]" style={{ maxWidth: "34cqw" }}>
        {b.map(([t, ic], i) => (
          <motion.div key={t} initial={{ opacity: 0, y: "2cqw", rotate: -4 }} animate={{ opacity: 1, y: "0cqw", rotate: 0 }} transition={{ delay: 0.5 + i * 0.12, type: "spring", stiffness: 170, damping: 15 }}>
            <Card icon={ic} title={t} accent={i === 2} style={{ height: "100%" }} />
          </motion.div>
        ))}
      </div>
    </Statement>
  );
}

/** 49 ✦ · Контент-завод целиком: шесть узлов, золотая линия соединяет их слева направо, узел загорается, когда линия дошла. */
export function M_FactoryChain() {
  const chain = ["Рилс", "Кодовое слово", "Бот выдаёт гайд", "ИИ-менеджер", "Заявка в CRM", "Отчёт в Telegram"];
  const T0 = 0.4, DT = 0.28;
  const Node = ({ c, i }: { c: string; i: number }) => (
    <motion.div initial={{ opacity: 0.35, scale: 0.94, borderColor: T.line }} animate={{ opacity: 1, scale: 1, borderColor: i === 0 || i === 5 ? T.gold2 : T.line }}
      transition={{ delay: T0 + i * DT, duration: 0.35, ease: EASE }}
      style={{ ...card, borderRadius: 16, padding: "0.8cqw 1cqw", flex: 1, ...txt, borderWidth: 1.5, borderStyle: "solid", ...(i === 5 ? { ...goldButton } : null) }}>
      <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.8cqw", color: i === 5 ? T.ink : T.brownLt, marginRight: "0.6cqw" }}>{i + 1}</span>{c}
    </motion.div>
  );
  const row = (from: number) => (
    <div className="flex items-center">
      {chain.slice(from, from + 3).map((c, k) => (
        <div key={c} className="flex items-center" style={{ flex: 1 }}>
          <Node c={c} i={from + k} />
          {k < 2 && <div style={{ padding: "0 0.4cqw" }}><DrawLine delay={T0 + (from + k) * DT} dur={DT} width="1.6cqw" /></div>}
        </div>
      ))}
    </div>
  );
  return (
    <Statement kicker="Урок 3.5" title={<>Контент-завод <Em>целиком</Em></>} size="3.2cqw" lead="Все три модуля в одной цепочке: ролик приводит человека, система доводит его до заявки.">
      <div className="grid gap-[0.4cqw]" style={{ maxWidth: "54cqw" }}>
        {row(0)}
        {/* Переход на вторую строку: линия спускается от третьего узла */}
        <div className="flex justify-end" style={{ paddingRight: "8cqw", height: "1.2cqw" }}>
          <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: T0 + 2 * DT, duration: DT, ease: EASE }}
            style={{ width: "0.18cqw", height: "100%", borderRadius: 4, background: `linear-gradient(180deg, ${T.gold}, ${T.gold2})`, transformOrigin: "top" }} />
        </div>
        {row(3)}
      </div>
    </Statement>
  );
}

/** 50 · Схема на 30 роликов в месяц: календарь загорается по дням. */
export function M_Plan30() {
  const rules = ["Каждый день 1 ролик", "Сначала пробным, на неподписчиков", "Через 72 часа: сильный показываем подписчикам", "Залетевший перезаливаем пробным ещё раз"];
  return (
    <Statement obj="lg-s50-plan" kicker="Обещал в начале" title={<>Схема: <Em>30 роликов</Em> в месяц</>} size="3cqw">
      <div className="flex items-start gap-[2cqw]">
        <div className="grid gap-[0.3cqw]" style={{ gridTemplateColumns: "repeat(6, 2.2cqw)" }}>
          {Array.from({ length: 30 }, (_, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: i === 17 ? [0.5, 1.2, 1] : 1 }} transition={{ delay: 0.3 + i * 0.03, duration: i === 17 ? 0.5 : 0.25 }}
              className="flex items-center justify-center" style={{ height: "2.2cqw", borderRadius: 8, fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.7cqw",
                background: i === 17 ? `linear-gradient(180deg, ${T.gold}, ${T.gold2})` : `${T.accent}1F`, color: i === 17 ? T.ink : T.muted }}>{i + 1}</motion.div>
          ))}
        </div>
        <div className="grid gap-[0.5cqw]" style={{ maxWidth: "26cqw" }}>
          {rules.map((r, i) => (
            <Stagger key={r} i={i + 2} className="flex gap-[0.7cqw]" style={{ ...txt }}>
              <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.85cqw", color: T.brownLt, paddingTop: "0.15cqw" }}>{i + 1}</span>{r}
            </Stagger>
          ))}
        </div>
      </div>
      <Note>Полный контент-план на месяц в гайдах, которые выдам в конце</Note>
    </Statement>
  );
}

/** 59 ✦ · Спасибо. Ночной, фоном тоннель рилсов, как на обложке. Без контактов. */
export function M_Thanks() {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="night"><ReelTunnel3D reels={TUNNEL_REELS} /></MontageBg>}>
      <div style={{ maxWidth: "31cqw" }}>
        <Rise><BrandLogo night height="1.8cqw" style={{ marginBottom: "3cqw" }} /></Rise>
        <Rise delay={STEP}><H size="4.2cqw" color={T.nightText} style={{ lineHeight: 1.05 }}>Спасибо,<br /><Em night><span style={{ whiteSpace: "nowrap" }}>что пришли</span></Em></H></Rise>
        <Rise delay={STEP * 2}><Lead color={T.nightMuted} style={{ marginTop: "1.6cqw", fontSize: "1.5cqw" }}>Увидимся в следующих эфирах.</Lead></Rise>
      </div>
    </SlideLayout>
  );
}
