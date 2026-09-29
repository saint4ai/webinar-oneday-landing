"use client";

/**
 * Шаблоны слайдов деки в бренде сайтов onai.academy — для следующих эфиров и дек.
 * Каждый шаблон — готовый слайд 1920×1080 с зоной камеры (правые 40% пустые), ритмом въезда и своим «вау».
 * Витрина с пустыми [полями]: /montage/templates. Каталог и что куда подставлять — docs/deck-v2/ШАБЛОНЫ.md.
 *
 * Уже параметрические слайды деки тоже шаблоны, их берём как есть:
 * M_Chapter (глава), M_Poll (опрос), M_Module (модуль программы), M_Guides (гайды веером), Statement (тезис).
 */
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { useCountUp } from "@/components/sales-deck/useCountUp";
import { ExtrudedNumber, ReelTunnel3D } from "./fx";
import { Logo } from "./Logo";
import { MontageBg } from "./MontageBg";
import { Statement } from "./Statement";
import { T, card, goldButton, goldText } from "./theme";
import { Card, Chip, DrawLine, EASE, H, Kicker, Lead, Note, Rise, STEP, Stagger, at, thousands, txt } from "./ui";
import { TUNNEL_REELS } from "./slides/M_Cover";
import { BigWord, GoldChip, PricePlate, Struck } from "./slides/sale";
import { Path, Power, Tasks, type Step, type Task } from "./slides/warmup";

export { M_Chapter as TplChapter } from "./slides/M_Chapter";
export { M_Poll as TplPoll, M_Guides as TplGuides } from "./slides/start";
export { M_Module as TplModule } from "./slides/sale";
export { Fill } from "./slides/warmup";

type Base = { kicker?: ReactNode; title: ReactNode; lead?: ReactNode; obj?: string };

/** Обложка, ночная: тоннель рилсов фоном, слева логотип, заголовок, подводка, чипы (один чип можно золотым). */
export function TplCover({ kicker, title, lead, chips = [], goldChip }: Base & { chips?: string[]; goldChip?: number }) {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="night"><ReelTunnel3D reels={TUNNEL_REELS} /></MontageBg>}>
      <div style={{ maxWidth: "31cqw" }}>
        <Rise><Logo night height="1.8cqw" style={{ marginBottom: "3cqw" }} /></Rise>
        {kicker && <Rise delay={STEP}><Kicker color={T.gold}>{kicker}</Kicker></Rise>}
        <Rise delay={STEP * 2}><H size="4.4cqw" color={T.nightText} style={{ lineHeight: 1.04 }}>{title}</H></Rise>
        {lead && <Rise delay={STEP * 3}><Lead color={T.nightMuted} style={{ marginTop: "1.8cqw", fontSize: "1.35cqw" }}>{lead}</Lead></Rise>}
        {chips.length > 0 && (
          <Rise delay={STEP * 4} className="flex flex-wrap gap-[0.6cqw]" style={{ marginTop: "2.4cqw" }}>
            {chips.map((c, i) => <Chip key={c} night={i !== goldChip} gold={i === goldChip}>{c}</Chip>)}
          </Rise>
        )}
      </div>
    </SlideLayout>
  );
}

/** Тезис: один крупный тезис со словом-акцентом (<Em>), подводка, под ним — что угодно. Светлый или ночной. */
export function TplThesis({ kicker, title, lead, obj, children, night }: Base & { children?: ReactNode; night?: boolean }) {
  return <Statement tone={night ? "night" : "paper"} obj={obj} kicker={kicker} title={title} lead={lead} size="3.3cqw">{children}</Statement>;
}

/** Карточки в ряд (2–4): номер, заголовок, текст, лего-значок; одна может быть с золотой рамкой. */
export function TplCards({ kicker, title, lead, obj, cards, accent }: Base & { cards: { no?: string; title: ReactNode; text?: ReactNode; icon?: string }[]; accent?: number }) {
  return (
    <Statement obj={obj} kicker={kicker} title={title} lead={lead} size="3cqw">
      <div className="grid gap-[1cqw]" style={{ gridTemplateColumns: `repeat(${cards.length}, 1fr)`, maxWidth: "56cqw" }}>
        {cards.map((c, i) => <Stagger key={i} i={i}><Card {...c} accent={i === accent} style={{ height: "100%" }} /></Stagger>)}
      </div>
    </Statement>
  );
}

/** Цепочка: шаги-карточки, связки прорисовываются золотом слева направо, последний шаг — золотой. */
export function TplChain({ kicker, title, lead, obj, steps }: Base & { steps: { title: ReactNode; text?: ReactNode }[] }) {
  return (
    <Statement obj={obj} kicker={kicker} title={title} lead={lead} size="3.2cqw">
      <div className="flex items-center gap-[0.8cqw]">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-[0.8cqw]">
            <Stagger i={i * 2}><Card no={`0${i + 1}`} title={s.title} text={s.text} accent={i === steps.length - 1} style={{ minWidth: "12cqw" }} /></Stagger>
            {i < steps.length - 1 && <DrawLine delay={at(i * 2 + 1, 0.4)} width="2.4cqw" />}
          </div>
        ))}
      </div>
    </Statement>
  );
}

/** Путь (прогрев «как я пришёл»): линия сверху вниз, этапы загораются по очереди, последний — «сейчас». */
export function TplPath({ kicker, title, steps, note }: Base & { steps: Step[]; note?: ReactNode }) {
  return (
    <Statement kicker={kicker} title={title} size="3cqw">
      <Path steps={steps} />
      {note && <Note style={{ marginTop: "1.4cqw" }}>{note}</Note>}
    </Statement>
  );
}

/** Задачи (прогрев «что это решает у меня»): 4 карточки задача → как → результат, внизу строка «насколько мощно». */
export function TplTasks({ kicker, title, tasks, power }: Base & { tasks: Task[]; power?: ReactNode }) {
  return (
    <Statement kicker={kicker} title={title} size="2.8cqw">
      <Tasks items={tasks} />
      {power && <Power i={tasks.length}>{power}</Power>}
    </Statement>
  );
}

/** Большая цифра ✦: объёмная ExtrudedNumber докручивается, подпись, подводка и источник. */
export function TplBigNumber({ kicker, title, lead, value, label, note, left }: Base & { value: string; label?: string; note?: ReactNode; left?: ReactNode }) {
  return (
    <Statement kicker={kicker} title={title} size="2.8cqw" leftSize={left ? "18cqw" : undefined} left={left}>
      <ExtrudedNumber value={value} label={label} size="6.4cqw" />
      {lead && <Stagger i={4} base={0.6}><Lead style={{ marginTop: "2cqw", maxWidth: "34cqw" }}>{lead}</Lead></Stagger>}
      {note && <Note>{note}</Note>}
    </Statement>
  );
}

/** Якорь цены ✦: старая сумма докручивается, перечёркивается и оседает; новая въезжает на тёмной плашке золотом. */
export function TplPrice({ kicker, title, obj, from, to }: Base & { from: { label: string; value: number; prefix?: string; text?: string }; to: { label: string; value: number; text?: string } }) {
  const a = useCountUp(from.value, 0.9, 0.35);
  const b = useCountUp(to.value, 1, 1.3);
  return (
    <Statement obj={obj} objSize="7cqw" kicker={kicker} title={title} size="2.8cqw">
      <div className="grid items-center gap-[1.2cqw]" style={{ gridTemplateColumns: "1fr 1fr", maxWidth: "52cqw" }}>
        <motion.div initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: [0, 1, 1, 0.62], y: ["1cqw", "0cqw", "0cqw", "1.2cqw"], rotate: [0, 0, 0, -2] }}
          transition={{ delay: 0.3, duration: 1.8, times: [0, 0.2, 0.6, 1], ease: EASE }} style={{ ...card, padding: "1.6cqw 1.8cqw" }}>
          <div style={{ ...txt, fontSize: "0.95cqw", fontWeight: 700 }}>{from.label}</div>
          <div style={{ marginTop: "0.8cqw" }}><Struck delay={1.1} size="2.5cqw" color={T.brown}>{`${from.prefix ?? ""}${thousands(a)} ₸`}</Struck></div>
          {from.text && <div style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.muted, marginTop: "0.8cqw" }}>{from.text}</div>}
        </motion.div>
        <PricePlate delay={1.2} label={to.label} value={`${thousands(b)} ₸`} sub={to.text} />
      </div>
    </Statement>
  );
}

/** Рассрочка ✦: сумма рассыпается на ячейки платежей, ниже — золотые чипы условий. */
export function TplInstallments({ kicker, title, lead, obj, months, payment, chips = [] }: Base & { months: number; payment: string; chips?: string[] }) {
  return (
    <Statement obj={obj} objSize="7cqw" kicker={kicker} title={title} lead={lead} size="3cqw">
      <div className="grid gap-[0.45cqw]" style={{ gridTemplateColumns: "repeat(12, 1fr)", maxWidth: "50cqw" }}>
        {Array.from({ length: months }, (_, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: "-1.2cqw", scale: 0.6 }} animate={{ opacity: 1, y: "0cqw", scale: 1 }} transition={{ delay: 0.5 + i * 0.04, type: "spring", stiffness: 300, damping: 20 }}
            className="flex items-center justify-center" style={{ height: "3cqw", borderRadius: 10, border: `1px solid ${T.gold2}`, background: `${T.gold}24`, ...txt, fontWeight: 700, fontSize: "0.72cqw", color: T.brown }}>
            {payment}
          </motion.div>
        ))}
      </div>
      {chips.length > 0 && <Rise delay={1.4} className="flex flex-wrap gap-[0.6cqw]" style={{ marginTop: "1.6cqw" }}>{chips.map((c) => <GoldChip key={c}>{c}</GoldChip>)}</Rise>}
    </Statement>
  );
}

/** Шаги к покупке: три крупные карточки с золотыми номерами, связки, внизу пульсирует золотая кнопка. */
export function TplSteps({ kicker, title, obj, steps, button }: Base & { steps: [ReactNode, ReactNode][]; button?: string }) {
  return (
    <Statement obj={obj} kicker={kicker} title={title} size="3cqw">
      <div className="flex items-stretch" style={{ maxWidth: "56cqw" }}>
        {steps.map(([t, d], i) => (
          <div key={i} className="flex items-center" style={{ flex: 1 }}>
            <Stagger i={i * 2} style={{ flex: 1, height: "100%" }}>
              <div style={{ ...card, height: "100%", padding: "1.3cqw 1.4cqw", ...(i === steps.length - 1 ? { border: `1.5px solid ${T.gold2}` } : null) }}>
                <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "2.6cqw", lineHeight: 1, ...goldText }}>{i + 1}</div>
                <div style={{ ...txt, fontWeight: 700, fontSize: "1.25cqw", lineHeight: 1.25, marginTop: "0.8cqw" }}>{t}</div>
                <div style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.muted, marginTop: "0.4cqw" }}>{d}</div>
              </div>
            </Stagger>
            {i < steps.length - 1 && <div style={{ padding: "0 0.5cqw" }}><DrawLine delay={at(i * 2 + 1, 0.4)} width="1.6cqw" /></div>}
          </div>
        ))}
      </div>
      {button && (
        <Stagger i={6} style={{ marginTop: "2cqw" }}>
          <motion.div className="inline-flex" animate={{ boxShadow: [`0 0 0 0cqw ${T.gold}66`, `0 0 0 1cqw ${T.gold}00`] }} transition={{ delay: 1.2, duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            style={{ ...goldButton, borderRadius: 999, padding: "1cqw 2cqw", fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.2cqw" }}>{button}</motion.div>
        </Stagger>
      )}
    </Statement>
  );
}

/** Большое слово ✦ (призыв в чат): слово золотом собирается из разрядки, по нему проходит блик; под ним строка или чипы. */
export function TplBigWord({ kicker, word, line, chips = [] }: { kicker?: ReactNode; word: string; line?: ReactNode; chips?: string[] }) {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="soft" />}>
      {kicker && <Rise><Kicker>{kicker}</Kicker></Rise>}
      <BigWord word={word} size="9cqw" />
      {line && <Rise delay={0.5}><H size="2.4cqw" style={{ marginTop: "1.6cqw" }}>{line}</H></Rise>}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-[0.6cqw]" style={{ marginTop: "2cqw", maxWidth: "52cqw" }}>
          {chips.map((c, i) => <Stagger key={c} i={i} base={0.55}><GoldChip size="1.1cqw">{c}</GoldChip></Stagger>)}
        </div>
      )}
    </SlideLayout>
  );
}

/** Финал, ночной: тоннель рилсов фоном, логотип, спасибо, одна строка. */
export function TplThanks({ title, lead }: { title: ReactNode; lead?: ReactNode }) {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="night"><ReelTunnel3D reels={TUNNEL_REELS} /></MontageBg>}>
      <div style={{ maxWidth: "31cqw" }}>
        <Rise><Logo night height="1.8cqw" style={{ marginBottom: "3cqw" }} /></Rise>
        <Rise delay={STEP}><H size="4.2cqw" color={T.nightText} style={{ lineHeight: 1.05 }}>{title}</H></Rise>
        {lead && <Rise delay={STEP * 2}><Lead color={T.nightMuted} style={{ marginTop: "1.6cqw", fontSize: "1.5cqw" }}>{lead}</Lead></Rise>}
      </div>
    </SlideLayout>
  );
}
