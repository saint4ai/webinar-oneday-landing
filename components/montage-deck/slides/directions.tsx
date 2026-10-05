"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Statement } from "../Statement";
import { T, card, goldText } from "../theme";
import { Arrow, EASE, Em, Note, Px, STEP, Stagger, nb, txt } from "../ui";
import { GoldChip } from "./sale";
import { Power } from "./warmup";

/**
 * Волна 3 (05.10): продающие слайды обучения вместо списков уроков. Тексты дословно из docs/tasks/deck_wave3.md,
 * факты — сайт onai.academy (блок Vibe Production, 03.10), лендинг эфира, база ИИ-ассистента, цифры слайдов 10 и 10i.
 * Всё в левых 60% кадра: правые 40% — камера Александра.
 */

const tag: React.CSSProperties = { ...txt, fontSize: "0.8cqw", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" };

/** 35–37 · Направление: слева огромный номер, справа было → стало, что заберёте, доказательство и состав уроков сноской. */
export function M_Direction({ no, kicker, title, was, now, take, proof, inside }: {
  no: number; kicker: string; title: ReactNode; was: string; now: string; take: string[]; proof?: string; inside: string;
}) {
  return (
    <Statement kicker={kicker} title={title} size="2.6cqw" leftSize="11cqw"
      left={
        <motion.div initial={{ opacity: 0, y: "3cqw", scale: 0.9 }} animate={{ opacity: 1, y: "0cqw", scale: 1 }} transition={{ duration: 0.6, ease: EASE }}
          style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "13cqw", lineHeight: 0.9, letterSpacing: "-.06em", ...goldText, filter: "drop-shadow(0 1cqw 1.4cqw rgba(201,160,90,.3))" }}>
          {no}
        </motion.div>
      }>
      <div className="grid items-stretch gap-[0.8cqw]" style={{ gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)", maxWidth: "43cqw" }}>
        <Stagger i={0} style={{ ...card, borderRadius: 20, padding: "1.1cqw 1.3cqw" }}>
          <div style={{ ...tag, color: T.muted }}>Было</div>
          <div style={{ ...txt, fontSize: "1.1cqw", color: T.muted, marginTop: "0.4cqw" }}>{was}</div>
        </Stagger>
        <Stagger i={1} className="flex items-center"><Arrow size="1.8cqw" /></Stagger>
        <Stagger i={2} style={{ ...card, borderRadius: 20, padding: "1.1cqw 1.3cqw", border: `1.5px solid ${T.gold2}` }}>
          <div style={{ ...tag, color: T.gold2 }}>Стало</div>
          <div style={{ ...txt, fontSize: "1.1cqw", fontWeight: 700, marginTop: "0.4cqw" }}>{now}</div>
        </Stagger>
      </div>
      <Stagger i={3}><div style={{ ...txt, fontSize: "0.95cqw", color: T.muted, marginTop: "1.3cqw", marginBottom: "0.6cqw" }}>Что заберёте</div></Stagger>
      <div className="flex flex-wrap gap-[0.5cqw]" style={{ maxWidth: "43cqw" }}>
        {take.map((t, i) => (
          <motion.span key={t} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 + i * 0.07, type: "spring", stiffness: 320, damping: 20 }}>
            <GoldChip size="1.05cqw">{t}</GoldChip>
          </motion.span>
        ))}
      </div>
      {proof && <Power i={6}>{proof}</Power>}
      <Note style={{ marginTop: "0.9cqw", maxWidth: "43cqw" }}>{inside}</Note>
    </Statement>
  );
}

/** 37w · Что даст обучение именно вам: те же четыре ответа, что в опросе на слайде 03, у каждого — свой результат. */
export function M_ForYou() {
  const items: [string, string, string][] = [
    ["Эксперт, у меня свой продукт", "Ролики и реклама своего продукта каждый день, без команды", "lg-i-stall"],
    ["Не хочу сниматься сам", "Форматы без лица и копия голоса: ролики без камеры", "lg-i-camera"],
    ["SMM, делаю рилсы для клиентов", "Монтаж для клиентов собирает агент, вы проверяете кадры", "lg-i-phones"],
    ["Хочу брать заказы на монтаж", `Монтаж и реклама на заказ. Рынок платит монтажёру ${nb("10 000 ₸")} за ролик`, "lg-i-laptopcoins"],
  ];
  return (
    <Statement kicker="Вспомните ответ в начале" title={<>Что даст обучение <Em>именно вам</Em></>} size="2.7cqw">
      <div className="grid grid-cols-2 gap-[1cqw]" style={{ maxWidth: "54cqw" }}>
        {items.map(([q, a, ic], i) => (
          <Stagger key={q} i={i} className="flex items-center gap-[1cqw]" style={{ ...card, minHeight: "8.6cqw", padding: "1.2cqw 1.4cqw" }}>
            <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "3.6cqw", lineHeight: 1, color: T.brown, fontVariantNumeric: "tabular-nums", minWidth: "2.6cqw" }}>{i + 1}</span>
            <Px name={ic} size="3.8cqw" bob={false} delay={0.3 + i * STEP} />
            <div className="min-w-0">
              <div style={{ ...txt, fontSize: "0.9cqw", color: T.muted }}>{q}</div>
              <div style={{ ...txt, fontSize: "1.15cqw", fontWeight: 700, lineHeight: 1.3, marginTop: "0.3cqw" }}>{a}</div>
            </div>
          </Stagger>
        ))}
      </div>
      <Note style={{ marginTop: "1.2cqw", fontSize: "0.95cqw" }}>Доход не обещаю: обучение даёт навык, результат зависит от практики.</Note>
    </Statement>
  );
}
