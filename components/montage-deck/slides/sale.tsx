"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { useCountUp } from "@/components/sales-deck/useCountUp";
import { ExtrudedNumber } from "../fx";
import { MontageBg } from "../MontageBg";
import { Phone } from "../Phone";
import { Statement } from "../Statement";
import { NUM_ACCENT, LT, T, card, goldButton, goldText, pricePlate } from "../theme";
import { Card, DrawLine, EASE, Em, Fill, H, Kicker, Lead, Note, Num, Px, Rise, STEP, Stagger, at, nb, thousands, txt } from "../ui";

/** Чип-условие: золотая рамка на светлом золоте. */
export const GoldChip = ({ children, size = "0.95cqw" }: { children: React.ReactNode; size?: string }) => (
  <span style={{ display: "inline-block", borderRadius: 999, padding: "0.65cqw 1.2cqw", border: `1px solid ${T.gold2}`, background: `${T.gold}24`, ...txt, fontSize: size }}>{children}</span>
);

/** Большое слово в золоте: ХОЧУ, МОНТАЖ. Собирается из разрядки, по золоту один раз проходит блик. */
export const BigWord = ({ word, size = "9cqw" }: { word: string; size?: string }) => {
  const face: React.CSSProperties = { fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: size, lineHeight: 1, whiteSpace: "nowrap" };
  return (
    <motion.div className="relative" initial={{ opacity: 0, scale: 0.85, letterSpacing: "0.2em" }} animate={{ opacity: 1, scale: 1, letterSpacing: "-0.03em" }}
      transition={{ delay: 0.2, duration: 0.7, ease: EASE }} style={{ transformOrigin: "left" }}>
      <style>{`@keyframes bw-shine { from { background-position: 160% 0; } to { background-position: -60% 0; } }`}</style>
      <div style={{ ...face, ...goldText, filter: "drop-shadow(0 1cqw 1.6cqw rgba(201,160,90,.35))" }}>{word}</div>
      <div aria-hidden className="absolute inset-0" style={{
        ...face, color: "transparent", backgroundImage: `linear-gradient(100deg, transparent 38%, ${LT.card}CC 50%, transparent 62%)`,
        backgroundSize: "250% 100%", backgroundRepeat: "no-repeat", WebkitBackgroundClip: "text", backgroundClip: "text", animation: "bw-shine 1.4s ease-out 0.9s both",
      }}>{word}</div>
    </motion.div>
  );
};

/** Цена на тёмной плашке сайта: #2A211C, сумма золотом. */
export const PricePlate = ({ label, value, sub, delay = 0 }: { label: string; value: string; sub?: string; delay?: number }) => (
  <motion.div initial={{ opacity: 0, x: "3cqw", scale: 0.96 }} animate={{ opacity: 1, x: "0cqw", scale: 1 }} transition={{ delay, duration: 0.55, ease: EASE }}
    style={{ ...pricePlate, padding: "1.6cqw 1.8cqw", border: `1.5px solid ${T.gold2}` }}>
    <div style={{ ...txt, fontSize: "0.95cqw", fontWeight: 700, color: T.gold }}>{label}</div>
    <div style={{ marginTop: "0.8cqw" }}><Num size="2.8cqw" color={T.gold}>{value}</Num></div>
    {sub && <div style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.nightMuted, marginTop: "0.8cqw" }}>{sub}</div>}
  </motion.div>
);

/** Сумма, которую перечёркивает линия: зачёркивание прорисовывается в delay. */
export const Struck = ({ children, delay, size = "2.4cqw", color = T.muted }: { children: React.ReactNode; delay: number; size?: string; color?: string }) => (
  <div className="relative inline-block">
    <Num size={size} color={color}>{children}</Num>
    <motion.div className="absolute left-[-3%] right-[-3%] top-1/2" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay, duration: 0.4, ease: EASE }}
      style={{ height: "0.24cqw", marginTop: "-0.12cqw", background: T.brownLt, borderRadius: 4, transformOrigin: "left", rotate: "-4deg" }} />
  </div>
);

/* ─────────────── Переход к продаже ─────────────── */

/**
 * 30 ✦ · Один рилс: 116 тыс. просмотров. Объёмная цифра докручивается, рядом телефон с этим рилсом.
 * Рилс «4 умных коннектора для Claude» (06.09): счётчик профессиональной панели Instagram на 5 октября, как на плитке 10v
 * (Александр 05.10: на слайдах цифры панели; в приложении 118 тыс., по API 117 178). Раньше на телефоне крутился другой рилс,
 * «Четыре подключения» от 25.09 (около 24 тыс.), а число 107 237 (на 26 сентября) по величине принадлежит этому, 06.09 (проверить по источнику).
 */
export function M_Case107() {
  return (
    <Statement kicker="Тот самый 1 из 14" title="Один рилс" size="2.8cqw"
      leftSize="18cqw" left={
        <motion.div initial={{ opacity: 0, y: "3cqw", rotate: -4 }} animate={{ opacity: 1, y: "0cqw", rotate: 0 }} transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.15 }}>
          <Phone video="/montage/reels/hit-connectors.mp4" src="/montage/reels/hit-connectors.jpg" views={nb("118 тыс.")} caption="4 умных коннектора для Claude" width="13.5cqw" showTop={false} />
        </motion.div>
      }>
      <div style={{ marginTop: "-0.6cqw" }}><ExtrudedNumber value={nb("116 тыс.")} label="просмотров · смонтировал агент" size="6.4cqw" accent={NUM_ACCENT} /></div>
      <Stagger i={4} base={0.6}><Lead style={{ marginTop: "2cqw", maxWidth: "34cqw" }}>Я записал видео, агент собрал графику, анимацию, субтитры и звук по моим правкам.</Lead></Stagger>
      <Note>Статистика Instagram на 5 октября 2026</Note>
    </Statement>
  );
}

/** 31 · Хотите так же? ХОЧУ. */
export function M_Want() {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="soft" />} contentMinWidth={0}>
      <Rise><Kicker>Напишите в чат</Kicker></Rise>
      <BigWord word="ХОЧУ" size="10cqw" />
      <Rise delay={0.5}><H size="2.4cqw" style={{ marginTop: "1.6cqw" }}>если хотите монтировать <Em>так же</Em></H></Rise>
    </SlideLayout>
  );
}

/** 32 · Кто выпустит первый ролик на этой неделе. Спокойный, один тезис. */
export function M_WhoFirst() {
  return (
    <Statement obj="lg-s32-hand" kicker="Честно" title={<>Кто выпустит первый ролик <Em>на этой неделе</Em>?</>} size="3cqw"
      lead="Первый ролик на этой неделе отличает тех, у кого получится. Напишите +, если готовы. Дальше покажу обучение, а потом урок 3: как просмотр сам становится заявкой." />
  );
}

/* ─────────────── Окно продаж 1 ─────────────── */

/** 34 · Продаю не курс, а контент-завод: цепочка с золотыми связками, ниже — что остаётся у вас. */
export function M_NotCourse() {
  const stays = ["Агент-монтажёр", "9 стилей", "6 форматов", "Реклама из фото", "Бот по кодовому слову", "ИИ-менеджер"];
  return (
    <Statement obj="lg-s49-factory" kicker="Vibe Production" title={<>Я продаю не курс, а <Em><span style={{ whiteSpace: "nowrap" }}>контент-завод</span></Em></>} size="2.9cqw">
      <div className="flex items-center gap-[0.8cqw]">
        {["Ролик", "Реклама", "Заявка"].map((c, i) => (
          <div key={c} className="flex items-center gap-[0.8cqw]">
            <Stagger i={i * 2} style={{ ...card, borderRadius: 999, padding: "0.8cqw 1.6cqw", fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.15cqw", color: T.ink,
              ...(i === 2 ? { ...goldButton, border: `1px solid ${T.gold2}` } : null) }}>{c}</Stagger>
            {i < 2 && <DrawLine delay={at(i * 2 + 1, 0.4)} />}
          </div>
        ))}
      </div>
      <Stagger i={5}><div style={{ ...txt, color: T.muted, marginTop: "1.8cqw", marginBottom: "0.8cqw" }}>Что остаётся у вас после обучения:</div></Stagger>
      <div className="flex flex-wrap gap-[0.6cqw]" style={{ maxWidth: "50cqw" }}>
        {stays.map((s, i) => (
          <motion.span key={s} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 + i * 0.06, type: "spring", stiffness: 320, damping: 18 }}>
            <GoldChip>{s}</GoldChip>
          </motion.span>
        ))}
      </div>
    </Statement>
  );
}

/** 35–37 · Модуль программы: огромный номер золотом слева, карточка с пятью уроками, результат золотой плашкой внизу. */
export function M_Module({ no, title, lessons, result }: { no: number; title: string; lessons: string[]; result: string }) {
  return (
    <Statement kicker={`Модуль ${no} из 3 · 5 уроков`} title={title} size="3cqw" leftSize="11cqw"
      left={
        <motion.div initial={{ opacity: 0, y: "3cqw", scale: 0.9 }} animate={{ opacity: 1, y: "0cqw", scale: 1 }} transition={{ duration: 0.6, ease: EASE }}
          style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "13cqw", lineHeight: 0.9, letterSpacing: "-.06em", ...goldText, filter: "drop-shadow(0 1cqw 1.4cqw rgba(201,160,90,.3))" }}>
          {no}
        </motion.div>
      }>
      <Stagger i={0} style={{ ...card, borderRadius: 24, padding: "0.6cqw", maxWidth: "44cqw", overflow: "hidden" }}>
        <div className="grid">
          {lessons.map((l, i) => (
            <motion.div key={l} className="flex items-center gap-[1.1cqw]" initial={{ opacity: 0, x: "-1cqw" }} animate={{ opacity: 1, x: "0cqw" }}
              transition={{ delay: 0.4 + i * STEP, duration: 0.35, ease: EASE }}
              style={{ padding: "0.75cqw 1.1cqw", borderBottom: i < lessons.length - 1 ? `1px solid ${T.line}` : "none" }}>
              <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.85cqw", color: T.brownLt, fontVariantNumeric: "tabular-nums", minWidth: "2cqw" }}>{no}.{i + 1}</span>
              <span style={txt}>{l}</span>
            </motion.div>
          ))}
        </div>
        <motion.div className="flex items-center gap-[1cqw]" initial={{ opacity: 0, y: "0.8cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.9, duration: 0.45, ease: EASE }}
          style={{ ...goldButton, borderRadius: 18, padding: "0.9cqw 1.2cqw", marginTop: "0.4cqw" }}>
          <span style={{ ...txt, fontSize: "0.8cqw", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: T.ink, opacity: 0.7 }}>Результат</span>
          <span style={{ ...txt, fontSize: "1.15cqw", fontWeight: 700 }}>{result}</span>
        </motion.div>
      </Stagger>
    </Statement>
  );
}

/** 38 ✦ · Месяц монтажёра против контент-завода: сумма монтажёра перечёркивается и оседает, цена обучения въезжает на тёмной плашке. */
export function M_Anchor() {
  const a = useCountUp(300000, 0.9, 0.35);
  const b = useCountUp(250000, 1, 1.3);
  return (
    <Statement obj="lg-s38-piggy" objSize="7cqw" kicker="Сколько это стоит" title={<>Месяц монтажёра или <Em>свой контент-завод</Em></>} size="2.8cqw">
      <div className="grid items-center gap-[1.2cqw]" style={{ gridTemplateColumns: "1fr 1fr", maxWidth: "52cqw" }}>
        <motion.div initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: [0, 1, 1, 0.62], y: ["1cqw", "0cqw", "0cqw", "1.2cqw"], rotate: [0, 0, 0, -2] }}
          transition={{ delay: 0.3, duration: 1.8, times: [0, 0.2, 0.6, 1], ease: EASE }}
          style={{ ...card, padding: "1.6cqw 1.8cqw" }}>
          <div style={{ ...txt, fontSize: "0.95cqw", fontWeight: 700 }}>Монтажёр</div>
          <div style={{ marginTop: "0.8cqw" }}><Struck delay={1.1} size="2.5cqw" color={T.brown}>{`от ${thousands(a)} ₸`}</Struck></div>
          <div style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.muted, marginTop: "0.8cqw" }}>Каждый месяц. Вакансия на hh.kz, Алматы, 26.09.2026</div>
        </motion.div>
        {/* Полная цена 250 000 ₸; цена участникам эфира 150 000 ₸ — следующим слайдом 39а (Александр, 04.10) */}
        <PricePlate delay={1.2} label="Vibe Production · полная цена" value={`${thousands(b)} ₸`} sub="Оплата один раз. Доступ к урокам 3 месяца, навык и конвейер остаются у вас" />
      </div>
      <Stagger i={6} base={1.6}><Note style={{ marginTop: "1.2cqw", maxWidth: "50cqw" }}>Плюс подписки на сервисы: на старт около $51 в месяц, Claude Max за $200 в месяц — хватает на 150 роликов. Список покажу дальше</Note></Stagger>
    </Statement>
  );
}

const BANKS = [{ name: "Kaspi", logo: "kaspi" }, { name: "Home Credit", logo: "homecredit" }, { name: "Halyk", logo: "halyk" }];

/** 39 ✦ · 150 000 ₸ рассыпается на 24 ячейки по 6 250 ₸, ниже банки рассрочки. */
export function M_Installments() {
  return (
    <Statement obj="lg-s39-calendar" objSize="7cqw" kicker="Рассрочка до 24 месяцев без переплаты" title={<>Или от <Em>{nb("6 250 ₸")}</Em> в месяц</>} size="3cqw"
      lead={<>Меньше {nb("210 ₸")} в день. Платите ровно {nb("150 000 ₸")}, частями.</>}>
      <div className="grid gap-[0.45cqw]" style={{ gridTemplateColumns: "repeat(12, 1fr)", maxWidth: "50cqw" }}>
        {Array.from({ length: 24 }, (_, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: "-1.2cqw", scale: 0.6 }} animate={{ opacity: 1, y: "0cqw", scale: 1 }}
            transition={{ delay: 0.5 + i * 0.04, type: "spring", stiffness: 300, damping: 20 }}
            className="flex items-center justify-center" style={{ height: "3cqw", borderRadius: 10, border: `1px solid ${T.gold2}`, background: `${T.gold}24`,
              fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.72cqw", color: T.brown, fontVariantNumeric: "tabular-nums" }}>
            {nb("6 250")}
          </motion.div>
        ))}
      </div>
      <Rise delay={1.6} className="flex flex-wrap items-center gap-[0.6cqw]" style={{ marginTop: "1.6cqw" }}>
        {BANKS.map((b) => (
          <span key={b.name} className="flex items-center justify-center" style={{ height: "3.2cqw", minWidth: "7.5cqw", padding: "0 1.1cqw", borderRadius: 12, background: LT.paper, border: `1px solid ${T.line}`, boxShadow: T.shadowSm }}>
            <img src={`/payment/banks/${b.logo}.png`} alt={b.name} style={{ maxHeight: "2.1cqw", maxWidth: "6.5cqw", width: "auto" }} />
          </span>
        ))}
        <span style={{ ...txt, fontWeight: 500, fontSize: "0.85cqw", color: T.muted, marginLeft: "0.4cqw", maxWidth: "24cqw" }}>Россия, Узбекистан, Беларусь, Кыргызстан: рассрочку подберёт менеджер</span>
      </Rise>
    </Statement>
  );
}

/** 39а ✦ · Цена для участников эфира: 250 000 ₸ перечёркивается, 150 000 ₸ въезжает на тёмной плашке. Процент скидки не пишем (Александр, 04.10). */
export function M_Discount() {
  const after = useCountUp(150000, 1, 1.3);
  return (
    <Statement kicker="Только для участников эфира" title={<>Ваша цена — <Em>{nb("150 000 ₸")}</Em></>} size="3cqw"
      lead="Вы здесь, вы смотрите практику вживую — для вас цена ниже. Напишите МОНТАЖ в чат, менеджер закрепит её за вами.">
      <div className="flex items-center gap-[1.2cqw]">
        <Stagger i={0}>
          <div style={{ ...txt, fontSize: "0.9cqw", color: T.muted }}>Полная цена</div>
          <div style={{ marginTop: "0.5cqw" }}><Struck delay={0.9} size="2.2cqw">{nb("250 000 ₸")}</Struck></div>
        </Stagger>
        <DrawLine delay={1.05} width="2.4cqw" />
        <motion.div initial={{ opacity: 0, x: "2cqw", scale: 0.96 }} animate={{ opacity: 1, x: "0cqw", scale: 1 }} transition={{ delay: 1.2, duration: 0.5, ease: EASE }}
          style={{ ...pricePlate, padding: "1.1cqw 1.5cqw", border: `1.5px solid ${T.gold2}` }}>
          <div style={{ ...txt, fontSize: "0.9cqw", color: T.gold, fontWeight: 700 }}>Участникам эфира</div>
          <div style={{ marginTop: "0.5cqw" }}><Num size="2.6cqw" color={T.gold}>{`${thousands(after)} ₸`}</Num></div>
        </motion.div>
      </div>
      <Stagger i={6} base={1.2} style={{ marginTop: "1.4cqw" }}>
        <GoldChip>или от {nb("6 250 ₸")} в месяц в рассрочку на 24 месяца</GoldChip>
      </Stagger>
    </Statement>
  );
}

/** 40 · Первым 5 броням 6 месяцев вместо 3: полоса доступа растёт вдвое. */
export function M_SixMonths() {
  const Bar = ({ label, months, gold, i }: { label: string; months: number; gold?: boolean; i: number }) => (
    <div>
      <div className="flex justify-between" style={{ ...txt, fontSize: "0.95cqw" }}><span>{label}</span><span style={{ color: gold ? T.brown : T.muted, fontWeight: 700 }}>{months} месяцев</span></div>
      <div className="grid gap-[0.25cqw]" style={{ marginTop: "0.5cqw", gridTemplateColumns: "repeat(6, 1fr)" }}>
        {Array.from({ length: 6 }, (_, k) => (
          <motion.div key={k} initial={{ opacity: 0, scaleY: 0.3 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ delay: 0.5 + i * 0.4 + k * 0.08, duration: 0.3, ease: EASE }}
            style={{ height: "1.3cqw", borderRadius: 6,
              background: k < months ? (gold ? `linear-gradient(90deg, ${T.gold}, ${T.gold2})` : `${T.muted}73`) : `${T.brown}14` }} />
        ))}
      </div>
    </div>
  );
  return (
    <Statement kicker="Условие эфира" title={<>Первым 5 броням: доступ <Em>6 месяцев</Em> вместо 3</>} size="2.7cqw" lead="5 мест по условиям эфира. Шестой получит стандартные 3 месяца.">
      <Stagger i={0} className="grid gap-[1.1cqw]" style={{ ...card, borderRadius: 22, padding: "1.4cqw 1.6cqw", maxWidth: "40cqw" }}>
        <Bar i={0} label="Стандартный доступ" months={3} />
        <Bar i={1} label="Первые 5 броней" months={6} gold />
      </Stagger>
    </Statement>
  );
}

/** 41 · Как занять место: три шага крупно, связки прорисовываются, в конце — золотая кнопка сайта. */
export function M_HowToBook() {
  const steps = [["Напишите МОНТАЖ в чат", "Прямо сейчас, под эфиром"], ["Менеджер пришлёт ссылку", "На бронь и рассрочку"], [`Бронь ${nb("10 000 ₸")}`, "Действует до 23:59 сегодня"]];
  return (
    <Statement obj="lg-s41-deadline" kicker="Как занять место" title={<>Три шага до <Em>места в потоке</Em></>} size="3cqw">
      <div className="flex items-stretch" style={{ maxWidth: "56cqw" }}>
        {steps.map(([t, d], i) => (
          <div key={t} className="flex items-center" style={{ flex: 1 }}>
            <Stagger i={i * 2} style={{ flex: 1, height: "100%" }}>
              <div style={{ ...card, height: "100%", padding: "1.3cqw 1.4cqw", ...(i === 2 ? { border: `1.5px solid ${T.gold2}` } : null) }}>
                <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "2.6cqw", lineHeight: 1, ...goldText }}>{i + 1}</div>
                <div style={{ ...txt, fontWeight: 700, fontSize: "1.25cqw", lineHeight: 1.25, marginTop: "0.8cqw" }}>{t}</div>
                <div style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.muted, marginTop: "0.4cqw" }}>{d}</div>
              </div>
            </Stagger>
            {i < 2 && <div style={{ padding: "0 0.5cqw" }}><DrawLine delay={at(i * 2 + 1, 0.4)} width="1.6cqw" /></div>}
          </div>
        ))}
      </div>
      <Stagger i={6} style={{ marginTop: "2cqw" }}>
        <motion.div className="inline-flex" animate={{ boxShadow: [`0 0 0 0cqw ${T.gold}66`, `0 0 0 1cqw ${T.gold}00`] }} transition={{ delay: 1.2, duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          style={{ ...goldButton, borderRadius: 999, padding: "1cqw 2cqw", fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.2cqw" }}>МОНТАЖ в чат</motion.div>
      </Stagger>
      <Stagger i={7} base={0.4}><Note style={{ marginTop: "1.4cqw", maxWidth: "52cqw" }}>Бронь {nb("10 000 ₸")} входит в цену обучения. Остаток до <Fill>дата доплаты</Fill>. После эфира писать <Fill>куда</Fill></Note></Stagger>
    </Statement>
  );
}

/* ─────────────── Окно продаж 2 ─────────────── */

/** 52 · Цена бездействия: один тезис, под ним год из 52 недель, недели без роликов гаснут. */
export function M_Inaction() {
  return (
    <Statement kicker="Посчитайте" title={<>Сколько роликов вы <Em>не выпустили</Em> за этот год?</>} size="3.2cqw" lead="Вспомните ответ на опрос в начале. От 0 до 3 роликов в месяц — это до 36 за год. При 30 в месяц было бы 360. И сколько заявок с них не пришло.">
      <div className="grid gap-[0.35cqw]" style={{ gridTemplateColumns: "repeat(13, 1.6cqw)" }}>
        {Array.from({ length: 52 }, (_, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.4, backgroundColor: T.gold }} animate={{ opacity: [0, 1, 1], scale: [0.4, 1, 1], backgroundColor: [T.gold, T.gold, T.card] }}
            transition={{ delay: 0.35 + i * 0.012, duration: 1.4, times: [0, 0.25, 1], ease: EASE }}
            style={{ height: "1.6cqw", borderRadius: 5, border: `1px dashed ${T.brownLt}` }} />
        ))}
      </div>
    </Statement>
  );
}

/** 53 · Всё на одном экране: три модуля, под ними условия золотыми чипами. */
export function M_OneScreen() {
  const mods = [["Модуль 1", "AI-монтаж", "Рилсы без знаний монтажа", "lg-i-clapper"], ["Модуль 2", "AI-креатор", "Реклама товара из фото", "lg-i-box"], ["Модуль 3", "Автоматизация", "Заявки из директа сами", "lg-i-chatkey"]];
  return (
    <Statement kicker="Коротко" title={<>Всё на <Em>одном экране</Em></>} size="3cqw">
      <div className="grid grid-cols-3 gap-[0.9cqw]" style={{ maxWidth: "54cqw" }}>
        {mods.map(([no, t, d, ic], i) => <Stagger key={no} i={i}><Card icon={ic} no={no} title={t} text={d} style={{ height: "100%" }} /></Stagger>)}
      </div>
      <div className="flex flex-wrap gap-[0.6cqw]" style={{ marginTop: "1.4cqw" }}>
        {["1 месяц обучения", "Доступ к урокам 3 месяца", `${nb("150 000 ₸")} вместо ${nb("250 000 ₸")} — участникам эфира`, `или от ${nb("6 250 ₸")} в месяц`, "первым 5 броням — 6 месяцев доступа"].map((c, i) => (
          <Stagger key={c} i={3 + i}><GoldChip>{c}</GoldChip></Stagger>
        ))}
        <Stagger i={8}><GoldChip>Разбор работ в общем чате потока</GoldChip></Stagger>
      </div>
    </Statement>
  );
}

/** 54 · Три сомнения: карточки переворачиваются по очереди. */
export function M_Doubts() {
  const d = [
    ["Я не технарь", "Агент ведёт по шагам и сам ставит всё нужное. Вы пишете словами.", "lg-i-robot"],
    ["Нет времени", "Несколько часов в неделю. Монтаж занимает время агента, не ваше.", "lg-i-hourglass"],
    ["А если не залетит", "Охват не гарантирует никто. Есть данные первых 3 секунд и пробные рилсы.", "lg-i-phonearrow"],
  ];
  return (
    <Statement kicker="Честные ответы" title={<>Три <Em>сомнения</Em></>} size="3.2cqw">
      <div className="grid grid-cols-3 gap-[1cqw]" style={{ maxWidth: "56cqw", perspective: "80cqw" }}>
        {d.map(([q, a, ic], i) => (
          <motion.div key={q} initial={{ opacity: 0, rotateY: -70 }} animate={{ opacity: 1, rotateY: 0 }} transition={{ delay: 0.35 + i * 0.12, duration: 0.6, ease: EASE }} style={{ transformOrigin: "left center" }}>
            <Card icon={ic} no={`Сомнение ${i + 1}`} title={q} text={a} style={{ height: "100%" }} />
          </motion.div>
        ))}
      </div>
    </Statement>
  );
}

/** 55 · Подписки честно: строки по очереди, итог золотом. */
export function M_Subscriptions() {
  const rows = [["Claude Pro", "агент-монтажёр, модули 1 и 3", "$20"], ["Higgsfield", "реклама из фото", "$15"], ["SYNTX", "кадры и движение", "около $10"], ["ElevenLabs", "копия голоса", "$6"]];
  return (
    <Statement kicker="Без сюрпризов" title={<>Что ещё понадобится, <Em>честно</Em></>} size="2.8cqw">
      <Stagger i={0} style={{ ...card, borderRadius: 22, padding: "1.2cqw 1.6cqw", maxWidth: "44cqw" }}>
        {rows.map(([n, d, p], i) => (
          <motion.div key={n} className="flex items-baseline gap-[1cqw]" initial={{ opacity: 0, x: "-1cqw" }} animate={{ opacity: 1, x: "0cqw" }}
            transition={{ delay: 0.4 + i * STEP, duration: 0.35, ease: EASE }} style={{ padding: "0.7cqw 0", borderBottom: `1px solid ${T.line}` }}>
            <span style={{ ...txt, fontWeight: 700, minWidth: "8cqw" }}>{n}</span>
            <span style={{ ...txt, fontWeight: 500, color: T.muted, fontSize: "0.95cqw" }}>{d}</span>
            <span style={{ ...txt, fontWeight: 700, marginLeft: "auto", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{p}</span>
          </motion.div>
        ))}
        <motion.div className="flex items-baseline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.4 }} style={{ paddingTop: "0.9cqw" }}>
          <span style={{ ...txt, fontWeight: 700 }}>На старт</span>
          <span style={{ marginLeft: "auto" }}><Num size="1.8cqw" color={T.brown}>около $51 в месяц</Num></span>
        </motion.div>
      </Stagger>
      <Note>Claude Max за $200 в месяц — хватает на 150 роликов. Цены на 26 сентября 2026</Note>
    </Statement>
  );
}

/** 56 ✦ · Осталось N из 5. Ведущий переключает занятые места клавишами 0–5: занятое место гаснет и оседает. */
export function M_Slots() {
  const [taken, setTaken] = useState(0);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (/^[0-5]$/.test(e.key)) setTaken(Number(e.key)); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const left = 5 - taken;
  return (
    <Statement kicker="Условие эфира" title={<>Доступ 6 месяцев:<br />осталось <motion.span key={left} initial={{ opacity: 0, y: "-0.6cqw" }} animate={{ opacity: 1, y: "0cqw" }}
      style={{ display: "inline-block", color: T.brownLt, fontVariantNumeric: "tabular-nums" }}>{left}</motion.span>{" из 5"}</>} size="3cqw"
      lead="Шестой получит стандартные 3 месяца доступа.">
      <div className="flex gap-[1cqw]">
        {Array.from({ length: 5 }, (_, i) => {
          const isTaken = i < taken;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: isTaken ? 0.5 : 1, y: isTaken ? "0.4cqw" : "0cqw", scale: isTaken ? 0.92 : 1 }}
              transition={{ delay: isTaken ? 0 : at(i, 0.35), duration: 0.45, ease: EASE }}
              className="flex flex-col items-center justify-center" style={{ width: "7.5cqw", height: "9cqw", borderRadius: 20, transition: "background .4s, border-color .4s, box-shadow .4s",
                border: `1.5px ${isTaken ? "dashed" : "solid"} ${isTaken ? T.line : T.gold2}`,
                background: isTaken ? T.paper : T.card, boxShadow: isTaken ? "none" : `0 18px 36px -22px ${T.gold2}` }}>
              <Num size="2.6cqw" color={isTaken ? T.line : T.brown}>{i + 1}</Num>
              <div style={{ ...txt, fontWeight: 700, fontSize: "0.8cqw", marginTop: "0.6cqw", color: isTaken ? T.muted : T.brown }}>{isTaken ? "занято" : "свободно"}</div>
            </motion.div>
          );
        })}
      </div>
    </Statement>
  );
}

/** 57 · Финальный призыв: МОНТАЖ золотом, пульс золотой кнопки, условия чипами. */
export function M_FinalCTA() {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="soft" />} contentMinWidth={0}>
      <Rise><Kicker>Напишите в чат до 23:59</Kicker></Rise>
      <div className="flex items-center gap-[1.6cqw]"><BigWord word="МОНТАЖ" size="8cqw" /><Px name="lg-i-hourglass" size="9cqw" delay={0.7} /></div>
      <div className="flex flex-wrap gap-[0.6cqw]" style={{ marginTop: "2cqw", maxWidth: "52cqw" }}>
        {[`${nb("150 000 ₸")} вместо ${nb("250 000 ₸")}`, `или от ${nb("6 250 ₸")} в месяц`, `бронь ${nb("10 000 ₸")}`].map((c, i) => (
          <Stagger key={c} i={i} base={0.55}>
            <span style={{ display: "inline-block", ...card, borderRadius: 999, padding: "0.8cqw 1.4cqw", ...txt, fontSize: "1.1cqw",
              ...(i === 0 || i === 2 ? { ...goldButton, border: `1px solid ${T.gold2}` } : null) }}>{c}</span>
          </Stagger>
        ))}
      </div>
    </SlideLayout>
  );
}

/** 57g ✦ · Бонус за игру: QR на Token Runner, код из игры снимает ещё 10 000 ₸. */
export function M_GameBonus() {
  return (
    <Statement kicker="Бонус участникам эфира" title={<>Пройди мою игру — ещё <Em><span style={{ whiteSpace: "nowrap" }}>{nb("−10 000 ₸")}</span></Em></>} size="3cqw"
      lead={<>Игра Token Runner в Telegram. Пройди 3 испытания — получишь код: Vibe Production за {nb("140 000 ₸")} вместо {nb("150 000 ₸")}.</>}>
      <Stagger i={0}>
        {/* плита QR остаётся белой: тёмные модули на стекле камера не прочитает */}
        <div style={{ ...card, background: LT.paper, borderRadius: 22, padding: "1cqw", width: "13cqw" }}>
          <img src="/montage/qr-game.svg" alt="QR-код: игра Token Runner в Telegram" style={{ display: "block", width: "100%", height: "auto" }} />
        </div>
        <div style={{ ...txt, fontWeight: 700, fontSize: "1.3cqw", color: T.brown, marginTop: "1cqw", whiteSpace: "nowrap" }}>t.me/tokenrunner_bot</div>
      </Stagger>
    </Statement>
  );
}
