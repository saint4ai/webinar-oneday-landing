"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { useCountUp } from "@/components/sales-deck/useCountUp";
import { ExtrudedNumber } from "../fx";
import { MontageBg } from "../MontageBg";
import { Phone } from "../Phone";
import { Statement } from "../Statement";
import { BOOKING_PRICE, BUNDLE_PRICE, PRO_SOLO_PRICE, money, moneyBoth, moneyUsd } from "../prices";
import { GLASS, NUM_ACCENT, LT, T, card, goldButton, goldText, pricePlate } from "../theme";
import { Card, DrawLine, EASE, Em, H, Kicker, Lead, Note, Num, Px, Rise, STEP, Stagger, UsdTag, at, glue, glueNode, nb, thousands, txt } from "../ui";
import { CommentFieldIcon, Gold, PrepayPlate, RED } from "./pay";

/** Чип-условие: золотая рамка на светлом золоте. */
export const GoldChip = ({ children, size = "0.95cqw" }: { children: React.ReactNode; size?: string }) => (
  <span style={{ display: "inline-block", maxWidth: "100%", borderRadius: 999, padding: "0.65cqw 1.2cqw", border: `1px solid ${T.gold2}`, background: `${T.gold}24`, ...txt, fontSize: size }}>{children}</span>
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
export const PricePlate = ({ label, value, usd, sub, delay = 0 }: { label: string; value: string; usd?: string; sub?: string; delay?: number }) => (
  <motion.div initial={{ opacity: 0, x: "3cqw", scale: 0.96 }} animate={{ opacity: 1, x: "0cqw", scale: 1 }} transition={{ delay, duration: 0.55, ease: EASE }}
    style={{ ...pricePlate, padding: "1.6cqw 1.8cqw", border: `1.5px solid ${T.gold2}`, minWidth: "min-content" }}>
    <div style={{ ...txt, fontSize: "0.95cqw", fontWeight: 700, color: T.gold }}>{label}</div>
    <div style={{ marginTop: "0.8cqw" }}><Num size="2.8cqw" color={T.gold}>{value}</Num></div>
    {usd && <div style={{ ...txt, fontWeight: 700, fontSize: "1.25cqw", color: T.nightMuted, marginTop: "0.45cqw", whiteSpace: "nowrap" }}>{usd}</div>}
    {sub && <div style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.nightMuted, marginTop: "0.8cqw" }}>{sub}</div>}
  </motion.div>
);

/** Сумма, которую перечёркивает линия: зачёркивание прорисовывается в delay. usd — доллары мелко под суммой, тоже зачёркнуты. */
export const Struck = ({ children, delay, size = "2.4cqw", color = T.muted, usd }: { children: React.ReactNode; delay: number; size?: string; color?: string; usd?: string }) => (
  <div className="inline-block" style={{ whiteSpace: "nowrap" }}>
    <div className="relative inline-block">
      <Num size={size} color={color}>{children}</Num>
      <motion.div className="absolute left-[-3%] right-[-3%] top-1/2" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay, duration: 0.4, ease: EASE }}
        style={{ height: "0.24cqw", marginTop: "-0.12cqw", background: T.brownLt, borderRadius: 4, transformOrigin: "left", rotate: "-4deg" }} />
    </div>
    {usd && <div style={{ ...txt, fontWeight: 700, fontSize: `calc(${size} * 0.5)`, marginTop: "0.3cqw", color: T.muted, textDecoration: "line-through", textDecorationColor: T.brownLt }}>{usd}</div>}
  </div>
);

/* ─────────────── Переход к продаже ─────────────── */

/**
 * 30 ✦ · Один рилс: 118 тыс. просмотров. Объёмная цифра докручивается, рядом телефон с этим рилсом.
 * Рилс «4 умных коннектора для Claude» (06.09): счётчик приложения Instagram на 5 октября, как на телефоне рядом (ревью 07.10, Б1:
 * на слайде одна цифра, раньше было 116 тыс. из панели при 118 тыс. на телефоне). На плитке 10v у этого рилса 116 тыс. из панели
 * статистики, там это подписано; по API 117 178. Раньше на телефоне крутился другой рилс, «Четыре подключения» от 25.09 (около 24 тыс.),
 * а число 107 237 (на 26 сентября) по величине принадлежит этому, 06.09 (проверить по источнику).
 */
export function M_Case107() {
  return (
    <Statement kicker="Тот самый 1 из 14" title="Один рилс" size="2.8cqw"
      leftSize="18cqw" left={
        <motion.div initial={{ opacity: 0, y: "3cqw", rotate: -4 }} animate={{ opacity: 1, y: "0cqw", rotate: 0 }} transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.15 }}>
          <Phone video="/montage/reels/hit-gitingest.mp4" src="/montage/reels/hit-gitingest.jpg" views={nb("180 тыс.")} caption="Одно слово в ссылке GitHub" width="13.5cqw" showTop={false} />
        </motion.div>
      }>
      <div style={{ marginTop: "-0.6cqw" }}><ExtrudedNumber value={nb("180 тыс.")} label="просмотров · смонтировал агент" size="6.4cqw" accent={NUM_ACCENT} /></div>
      <Stagger i={4} base={0.6}><Lead style={{ marginTop: "2cqw", maxWidth: "34cqw" }}>Я записал видео, агент собрал графику, анимацию, субтитры и звук по моим правкам.</Lead></Stagger>
      <Note>Счётчик в приложении Instagram на 9 октября 2026</Note>
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
    <Statement obj="lg-s32-hand" kicker="Что нужно для первого ролика" title={<>Кто выпустит первый ролик <Em>на этой неделе</Em>?</>} size="3cqw"
      lead="Первый ролик на этой неделе отличает тех, у кого получится. Напишите +, если готовы. Дальше покажу обучение." />
  );
}

/* ─────────────── Окно продаж 1 ─────────────── */

/** 34 · Продаю не курс, а контент-завод: цепочка с золотыми связками, ниже — что остаётся у вас. */
export function M_NotCourse() {
  const stays = ["Агент-монтажёр", "9 стилей", "6 форматов", "Реклама из фото", "Бот по кодовому слову", "ИИ-менеджер"];
  return (
    <Statement obj="lg-s49-factory" kicker="Vibe Production" title={<>Я продаю не курс, а <Em><span style={{ whiteSpace: "nowrap" }}>контент-завод</span></Em></>} size="2.9cqw">
      <div className="flex items-center gap-[0.8cqw]">
        {["Ролик", "Заявка", "Реклама"].map((c, i) => (
          <div key={c} className="flex items-center gap-[0.8cqw]">
            <Stagger i={i * 2} style={{ ...card, borderRadius: 999, padding: "0.8cqw 1.6cqw", fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.15cqw", color: T.ink,
              ...(i === 1 ? { ...goldButton, border: `1px solid ${T.gold2}` } : null) }}>{c}</Stagger>
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
          <span style={{ ...txt, fontSize: "0.8cqw", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: LT.ink, opacity: 0.7 }}>Результат</span>
          <span style={{ ...txt, fontSize: "1.15cqw", fontWeight: 700, color: LT.ink }}>{result}</span>
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
          <div style={{ marginTop: "0.8cqw" }}><Struck delay={1.1} size="2.5cqw" color={T.brown} usd={moneyUsd(300000)}>{`от ${thousands(a)} ₸`}</Struck></div>
          <div style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.muted, marginTop: "0.8cqw" }}>Каждый месяц. Вакансия на hh.kz, Алматы, 26.09.2026</div>
        </motion.div>
        {/* Полная цена 250 000 ₸; цена участникам эфира 150 000 ₸ — следующим слайдом 39а (Александр, 04.10) */}
        <PricePlate delay={1.2} label="Vibe Production · полная цена" value={`${thousands(b)} ₸`} usd={moneyUsd(250000)} sub="Оплата один раз. Доступ к урокам 3 месяца, навык и конвейер остаются у вас" />
      </div>
      <Stagger i={6} base={1.6}><Note style={{ marginTop: "1.2cqw", maxWidth: "50cqw" }}>Плюс подписки на сервисы: на старт около $51 в месяц. Начать можно с подписки Claude от $20 в месяц. У меня Claude Max за $200: его хватает на 150 роликов в месяц. Список покажу дальше</Note></Stagger>
    </Statement>
  );
}

const BANKS = [{ name: "Kaspi", logo: "kaspi" }, { name: "Home Credit", logo: "homecredit" }, { name: "Halyk", logo: "halyk" }];

/** 39 ✦ · 150 000 ₸ рассыпается на 24 ячейки по 6 250 ₸, ниже банки рассрочки. */
export function M_Installments() {
  return (
    <Statement obj="lg-s39-calendar" objSize="7cqw" kicker="Рассрочка до 24 месяцев без переплаты" title={<>Или от <Em>{nb("6 250 ₸")}</Em> <UsdTag n={6250} /> в месяц</>} size="3cqw"
      lead={<>Меньше {nb("210 ₸")} ({moneyUsd(210)}) в день. Платите ровно {moneyBoth(150000)}, частями.</>}>
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
    <Statement kicker="Только для участников эфира" title={<>Ваша цена: <Em>{nb("150 000 ₸")}</Em> <UsdTag n={150000} /></>} size="3cqw"
      lead="Вы на эфире до этого момента, поэтому для вас цена ниже. Напишите МОНТАЖ в чат, менеджер закрепит её за вами.">
      <div className="flex items-center gap-[1.2cqw]">
        <Stagger i={0}>
          <div style={{ ...txt, fontSize: "0.9cqw", color: T.muted }}>Полная цена</div>
          <div style={{ marginTop: "0.5cqw" }}><Struck delay={0.9} size="2.2cqw" usd={moneyUsd(250000)}>{nb("250 000 ₸")}</Struck></div>
        </Stagger>
        <DrawLine delay={1.05} width="2.4cqw" />
        <motion.div initial={{ opacity: 0, x: "2cqw", scale: 0.96 }} animate={{ opacity: 1, x: "0cqw", scale: 1 }} transition={{ delay: 1.2, duration: 0.5, ease: EASE }}
          style={{ ...pricePlate, padding: "1.1cqw 1.5cqw", border: `1.5px solid ${T.gold2}` }}>
          <div style={{ ...txt, fontSize: "0.9cqw", color: T.gold, fontWeight: 700 }}>Участникам эфира</div>
          <div style={{ marginTop: "0.5cqw" }}><Num size="2.6cqw" color={T.gold}>{`${thousands(after)} ₸`}</Num></div>
          <div style={{ ...txt, fontWeight: 700, fontSize: "1.15cqw", color: T.nightMuted, marginTop: "0.35cqw", whiteSpace: "nowrap" }}>{moneyUsd(150000)}</div>
        </motion.div>
      </div>
      <Stagger i={6} base={1.2} style={{ marginTop: "1.4cqw" }}>
        <GoldChip>или от {moneyBoth(6250)} в месяц в рассрочку на 24 месяца</GoldChip>
      </Stagger>
    </Statement>
  );
}

/**
 * 40 · 6 месяцев вместо 3: полоса доступа растёт вдвое. С 08.10 условие «если купите до конца дня» (раньше «первым 5 броням»).
 * Из показа убран: то же самое («6 месяцев доступа») говорит слайд bon (slides/pipeline.tsx). Вернуть: вставить M_SixMonths с ключом 40 после bon.
 */
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
    <Statement kicker="Бонус до конца дня" title={<>Если купите до конца дня: доступ <Em>6 месяцев</Em> вместо 3</>} size="2.7cqw">
      <Stagger i={0} className="grid gap-[1.1cqw]" style={{ ...card, borderRadius: 22, padding: "1.4cqw 1.6cqw", maxWidth: "40cqw" }}>
        <Bar i={0} label="Стандартный доступ" months={3} />
        <Bar i={1} label="Покупка до конца дня" months={6} gold />
      </Stagger>
    </Statement>
  );
}

/**
 * 41 · Как занять место: три шага крупно, связки прорисовываются, в конце золотая кнопка сайта.
 * 09.10 (Александр: «они не понимают»): третий шаг стал шагом оплаты с теми же формулировками, что на слайде с QR: золотая плашка
 * «Предоплата 10 000 ₸» и строка «В комментарии к оплате оставьте имя и номер телефона» с золотым выделением и иконкой поля комментария.
 * Третья карточка шире двух других (вес 1,5), чтобы плашка стояла в одну строку. Раньше здесь была «Бронь 10 000 ₸ (≈ $22)», слово «бронь» заменено на «предоплата».
 */
export function M_HowToBook() {
  const steps = [["Напишите МОНТАЖ в чат", "Прямо сейчас, под эфиром"], ["Менеджер пришлёт ссылку", "На предоплату и рассрочку"]];
  return (
    <Statement obj="lg-s41-deadline" kicker="Как занять место" title={<>Три шага до <Em>места в потоке</Em></>} size="3cqw">
      <div className="flex items-stretch" style={{ maxWidth: "56cqw" }}>
        {steps.map(([t, d], i) => (
          <div key={t} className="flex items-center" style={{ flex: 1 }}>
            <Stagger i={i * 2} style={{ flex: 1, height: "100%" }}>
              <div style={{ ...card, height: "100%", padding: "1.3cqw 1.4cqw" }}>
                <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "2.6cqw", lineHeight: 1, ...goldText }}>{i + 1}</div>
                <div style={{ ...txt, fontWeight: 700, fontSize: "1.25cqw", lineHeight: 1.25, marginTop: "0.8cqw" }}>{t}</div>
                <div style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.muted, marginTop: "0.4cqw" }}>{d}</div>
              </div>
            </Stagger>
            <div style={{ padding: "0 0.5cqw" }}><DrawLine delay={at(i * 2 + 1, 0.4)} width="1.6cqw" /></div>
          </div>
        ))}
        <div className="flex items-center" style={{ flex: 1.5 }}>
          <Stagger i={4} style={{ flex: 1, height: "100%" }}>
            <div style={{ ...card, height: "100%", padding: "1.3cqw 1.4cqw", border: `1.5px solid ${T.gold2}` }}>
              <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "2.6cqw", lineHeight: 1, ...goldText }}>3</div>
              <div className="flex flex-wrap items-center" style={{ gap: "0.5cqw 0.8cqw", marginTop: "0.8cqw" }}>
                <PrepayPlate size="1.3cqw" delay={at(4, 0.28) + 0.15} />
                <span style={{ ...txt, fontWeight: 700, fontSize: "0.95cqw", color: T.muted, whiteSpace: "nowrap" }}>{moneyUsd(BOOKING_PRICE)}</span>
              </div>
              <div className="flex items-center" style={{ gap: "0.8cqw", marginTop: "0.8cqw" }}>
                <div style={{ ...txt, fontWeight: 700, fontSize: "1.1cqw", lineHeight: 1.3 }}>{glueNode(<>В комментарии к оплате оставьте <Gold>имя и номер телефона</Gold></>)}</div>
                <CommentFieldIcon width="3.6cqw" delay={1.4} />
              </div>
              <div style={{ ...txt, fontWeight: 500, fontSize: "0.95cqw", color: T.muted, marginTop: "0.5cqw" }}>Действует до 23:59 сегодня</div>
            </div>
          </Stagger>
        </div>
      </div>
      <Stagger i={6} style={{ marginTop: "2cqw" }}>
        <motion.div className="inline-flex" animate={{ boxShadow: [`0 0 0 0cqw ${T.gold}66`, `0 0 0 1cqw ${T.gold}00`] }} transition={{ delay: 1.2, duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          style={{ ...goldButton, borderRadius: 999, padding: "1cqw 2cqw", fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.2cqw" }}>МОНТАЖ в чат</motion.div>
      </Stagger>
      <Stagger i={7} base={0.4}><Note style={{ marginTop: "1.4cqw", maxWidth: "52cqw" }}>Предоплата {moneyBoth(BOOKING_PRICE)} входит в цену обучения. Остаток вам пришлёт менеджер вместе со ссылкой. Вопросы: Telegram @futleid, WhatsApp {nb("+7 708 583 4575")}</Note></Stagger>
    </Statement>
  );
}

/* ─────────────── Окно продаж 2 ─────────────── */

/**
 * 52 · Цена бездействия (Александр, 09.10: «выделить главные триггеры»). Слева четыре строки по очереди, справа нисходящая диаграмма и счётчик упущенных заявок.
 * Красным «всего лишь 36 роликов за год», золотом и крупно «360», последней другим цветом вопрос «Посчитайте в уме».
 * Диаграмма честная по масштабу: 36 это десятая часть 360, столбец «Выпустили» падает вниз из высоты первого. Счётчик заявок около 2,5 с набегает
 * и останавливается на «?»: числа заявок у зрителя мы не знаем, поэтому вопрос, а не цифра. Все анимации один раз, интервал счётчика снимается при уходе со слайда.
 * Прежняя версия (до 09.10): абзац lead «Вспомните ответ на опрос в начале. От 0 до 3 роликов в месяц это до 36 за год…» и сетка из 52 квадратов-недель, вернуть из git.
 */

/** Цвет вопроса (строка 4 и «?» счётчика): светлое золото, отличается и от обычного текста, и от золота «360». */
const ASK = GLASS ? "#FFE9B8" : T.brown;

/** Хронометраж слайда 52, секунды от показа. Справа рамка диаграммы стоит с l1, столбцы и счётчик идут за строками 2 и 3. */
const INA = { l1: 0.5, l2: 1.5, l3: 2.7, card: 0.8, bar1: 2.9, fall: 3.6, arrow: 4.2, count: 4.0, countDur: 2.5, l4: 7.0 };
/** Высота столбца «Могли выпустить 360», высота места под цифру над столбцом и честный масштаб второго столбца (десятая часть), в cqw. */
const BAR_FULL = 12.5;
const BAR_LABEL = 2.4;
const BAR_SMALL = BAR_FULL / 10;

/** Счётчик упущенных заявок: с INA.count набегает 2,5 с (всё быстрее, как одометр), потом цифры заменяются знаком вопроса. Интервал снимается при уходе со слайда. */
function LostCounter() {
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<"wait" | "run" | "ask">("wait");
  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    const t = setTimeout(() => {
      const t0 = performance.now();
      setPhase("run");
      id = setInterval(() => {
        const p = Math.min((performance.now() - t0) / (INA.countDur * 1000), 1);
        if (p >= 1) { clearInterval(id); setPhase("ask"); return; }
        setN(Math.floor(9999 * Math.pow(p, 2.4)));
      }, 45);
    }, INA.count * 1000);
    return () => { clearTimeout(t); if (id) clearInterval(id); };
  }, []);
  return (
    <div className="flex items-center justify-center" style={{ height: "3.9cqw", marginTop: "0.3cqw" }}>
      {phase === "ask"
        ? <motion.span aria-label="?" initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: [0.3, 1.25, 1] }} transition={{ duration: 0.55, ease: EASE }}
            style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "4cqw", lineHeight: 1, color: ASK, textShadow: `0 0 1.6cqw ${ASK}66` }}>?</motion.span>
        : <Num size="3.2cqw" color={phase === "wait" ? T.muted : T.ink}>{thousands(n)}</Num>}
    </div>
  );
}

/** Нисходящая диаграмма: «Могли выпустить 360» и «Выпустили 36» в честном масштабе, второй падает из высоты первого, красная стрелка и «−324 ролика»; ниже счётчик заявок. */
function LostChart() {
  const col: CSSProperties = { position: "relative", height: `${BAR_LABEL + BAR_FULL}cqw`, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" };
  const val: CSSProperties = { position: "absolute", top: 0, left: 0, right: 0, height: `${BAR_LABEL}cqw`, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "0.4cqw" };
  const bar: CSSProperties = { width: "5cqw", height: `${BAR_FULL}cqw`, transformOrigin: "bottom", borderRadius: "0.6cqw 0.6cqw 0.2cqw 0.2cqw" };
  const cap: CSSProperties = { ...txt, fontWeight: 700, fontSize: "0.9cqw", lineHeight: 1.25, textAlign: "center", color: T.muted };
  const drop = BAR_FULL - BAR_SMALL; // на сколько опускается верх второго столбца
  const times = [0, 0.2, 0.6, 0.78, 1];
  return (
    <motion.div initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: INA.card, duration: 0.5, ease: EASE }}
      style={{ ...card, borderRadius: 22, padding: "1.1cqw 1.1cqw 1.2cqw" }}>
      <div className="grid" style={{ gridTemplateColumns: "5.4cqw 1fr 5.4cqw" }}>
        {/* столбец «Могли выпустить 360» растёт снизу */}
        <div style={col}>
          <motion.div style={val} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: INA.bar1 + 0.35, duration: 0.3 }}><Num size="1.7cqw" color={T.gold}>360</Num></motion.div>
          <motion.div style={{ ...bar, background: `linear-gradient(180deg, ${T.gold}, ${T.gold2})`, boxShadow: `0 0 1.6cqw ${T.gold}40` }}
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: INA.bar1, duration: 0.7, ease: EASE }} />
        </div>
        {/* между столбцами: красная стрелка вниз от верха первого до верха второго и «−324 ролика» */}
        <div className="relative" aria-hidden>
          <motion.div className="flex flex-col items-center" style={{ position: "absolute", left: "0.5cqw", top: `${BAR_LABEL}cqw`, height: `${drop}cqw`, width: "1.6cqw", filter: `drop-shadow(0 0 0.5cqw ${RED}88)` }}
            initial={{ clipPath: "inset(0 0 100% 0)" }} animate={{ clipPath: "inset(0 0 0% 0)" }} transition={{ delay: INA.arrow, duration: 0.6, ease: EASE }}>
            <div style={{ flex: 1, width: "0.32cqw", background: RED, borderRadius: 2 }} />
            <svg viewBox="0 0 24 14" style={{ width: "1.6cqw", height: "1cqw", display: "block", flexShrink: 0 }}><path d="M1 1 L12 13 L23 1 Z" fill={RED} /></svg>
          </motion.div>
          <div style={{ position: "absolute", left: "2.6cqw", right: 0, top: `${BAR_LABEL + drop / 2}cqw`, transform: "translateY(-50%)" }}>
            <motion.div initial={{ opacity: 0, x: "-0.6cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ delay: INA.arrow + 0.3, duration: 0.45, ease: EASE }}>
              <div><Num size="1.45cqw" color={RED}>−324</Num></div>
              <div style={{ ...txt, fontWeight: 800, fontSize: "1cqw", color: RED, marginTop: "0.2cqw" }}>ролика</div>
            </motion.div>
          </div>
        </div>
        {/* столбец «Выпустили 36» появляется на высоте первого и падает до десятой части */}
        <div style={col}>
          <motion.div style={val} initial={{ opacity: 0, y: "0cqw" }}
            animate={{ opacity: [0, 0, 1, 1, 1], y: ["0cqw", "0cqw", `${drop}cqw`, `${drop - 0.9}cqw`, `${drop}cqw`] }}
            transition={{ delay: INA.fall, duration: 1.1, times, ease: ["linear", "easeIn", "easeOut", "easeIn"] }}><Num size="1.7cqw" color={RED}>36</Num></motion.div>
          <motion.div style={{ ...bar, background: `linear-gradient(180deg, #FF6A4D, ${RED})`, boxShadow: `0 0 1.6cqw ${RED}55` }}
            initial={{ opacity: 0, scaleY: 1 }}
            animate={{ opacity: [0, 1, 1, 1, 1], scaleY: [1, 1, 0.1, 0.17, 0.1] }}
            transition={{ delay: INA.fall, duration: 1.1, times, ease: ["linear", "easeIn", "easeOut", "easeIn"] }} />
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "5.4cqw 1fr 5.4cqw", marginTop: "0.6cqw" }}>
        <div style={cap}>Могли выпустить</div><div /><div style={cap}>Выпустили</div>
      </div>
      <div style={{ marginTop: "1cqw", paddingTop: "0.9cqw", borderTop: `1px solid ${T.line}`, textAlign: "center" }}>
        <div style={{ ...txt, fontWeight: 700, fontSize: "1cqw", color: T.muted }}>Упущенные заявки</div>
        <LostCounter />
      </div>
    </motion.div>
  );
}

export function M_Inaction() {
  const line = (delay: number, children: ReactNode, style?: CSSProperties) => (
    <motion.div initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay, duration: 0.5, ease: EASE }}
      style={{ ...txt, fontWeight: 600, fontSize: "1.4cqw", lineHeight: 1.4, ...style }}>{glueNode(children)}</motion.div>
  );
  return (
    <Statement kicker="Посчитайте" title={<>Сколько роликов вы <Em>не выпустили</Em> за этот год?</>} size="3.2cqw">
      <div className="grid items-start" style={{ gridTemplateColumns: "minmax(0, 25.5cqw) minmax(0, 22.5cqw)", columnGap: "2cqw" }}>
        <div className="flex flex-col" style={{ gap: "1.5cqw" }}>
          {line(INA.l1, "Вспомните ответ на вопрос в начале.", { fontSize: "1.35cqw" })}
          {line(INA.l2, <>От 0 до 3 роликов в месяц: это <span style={{ color: RED, fontWeight: 800 }}>всего лишь 36 роликов за год</span>.</>, { fontSize: "1.5cqw" })}
          {line(INA.l3, <>Если бы вы делали по 30 роликов в месяц, получилось бы <motion.span style={{ display: "inline-block", filter: `drop-shadow(0 0 0.8cqw ${T.gold}66)` }}
            initial={{ scale: 0.6 }} animate={{ scale: [0.6, 1.18, 1] }} transition={{ delay: INA.l3 + 0.35, duration: 0.55, ease: EASE }}><Num size="3cqw" color={T.gold}>360</Num></motion.span> за год.</>, { fontSize: "1.5cqw" })}
          <motion.div initial={{ opacity: 0, y: "1cqw", scale: 0.96 }} animate={{ opacity: 1, y: "0cqw", scale: 1 }} transition={{ delay: INA.l4, duration: 0.55, ease: EASE }}
            style={{ alignSelf: "flex-start", borderRadius: "1.2cqw", padding: "0.9cqw 1.3cqw", background: `${T.gold}1C`, border: `1px solid ${T.gold2}99`, boxShadow: `0 0 2cqw ${T.gold}24`,
              fontFamily: "var(--font-manrope)", fontWeight: 700, fontStyle: "italic", fontSize: "1.65cqw", lineHeight: 1.35, color: ASK }}>
            {glue("И сколько заявок вы из-за этого упустили? Посчитайте в уме.")}
          </motion.div>
        </div>
        <LostChart />
      </div>
    </Statement>
  );
}

/** 53 · Всё на одном экране: три модуля (08.10: AI-креатор стал модулем 3 с золотой пометкой «бонус до конца дня»), под ними условия золотыми чипами, среди них третий бонус: модуль по рекламе и AI-таргетолог. */
export function M_OneScreen() {
  const mods = [["Модуль 1", "AI-монтаж", "Рилсы без знаний монтажа", "lg-i-clapper"], ["Модуль 2", "Автоматизация", "Заявки из директа сами", "lg-i-chatkey"], ["Модуль 3", "AI-креатор", "Реклама товара из фото", "lg-i-box"]];
  return (
    <Statement kicker="Коротко" title={<>Всё на <Em>одном экране</Em></>} size="3cqw">
      <div className="grid grid-cols-3 gap-[0.9cqw]" style={{ maxWidth: "54cqw" }}>
        {mods.map(([no, t, d, ic], i) => (
          <Stagger key={no} i={i} className="relative">
            <Card icon={ic} no={no} title={t} text={d} accent={i === 2} style={{ height: "100%" }} />
            {i === 2 && (
              <span style={{ position: "absolute", top: "0.9cqw", right: "0.9cqw", borderRadius: 999, padding: "0.3cqw 0.8cqw", ...goldButton, border: `1px solid ${T.gold2}`, ...txt, color: LT.ink, fontWeight: 700, fontSize: "0.78cqw", whiteSpace: "nowrap" }}>
                бонус до конца дня
              </span>
            )}
          </Stagger>
        ))}
      </div>
      <div className="flex flex-wrap gap-[0.6cqw]" style={{ marginTop: "1.4cqw" }}>
        {["1 месяц обучения", "Доступ к урокам 3 месяца", `${moneyBoth(150000)} вместо ${moneyBoth(250000)} для участников эфира`, `или от ${moneyBoth(6250)} в месяц`, "6 месяцев доступа, если купите до конца дня"].map((c, i) => (
          <Stagger key={c} i={3 + i}><GoldChip>{c}</GoldChip></Stagger>
        ))}
        <Stagger i={8}><GoldChip>Разбор работ в общем чате потока</GoldChip></Stagger>
        {/* третий бонус до конца дня (Александр, 08.10, 15:00): подробности на слайде bon3 */}
        <Stagger i={9}>
          <span style={{ display: "inline-block", maxWidth: "100%", borderRadius: 999, padding: "0.65cqw 1.2cqw", ...goldButton, border: `1px solid ${T.gold2}`, ...txt, color: LT.ink, fontWeight: 700, fontSize: "0.95cqw" }}>
            Бонус до конца дня: модуль по рекламе и AI-таргетолог
          </span>
        </Stagger>
      </div>
      {/* строка про пакет двух курсов (07.10) убрана 08.10: продаём только Vibe Production. Вернуть: GoldChip с BUNDLE_PRICE и SEPARATE_PRICE из prices.ts */}
    </Statement>
  );
}

/**
 * Строки математики потерь слайда 54: что в левой колонке, что набегает справа счётчиком, чем окрашено.
 * Мои цифры за 30 дней: 57 рилсов и 2 218 обращений в директ (база бота): 2 218 / 57 ≈ 39. В 10 раз меньше ≈ 4. 360 − 36 = 324; 324 × 4 = 1 296. 1 из 100: 1 296 / 100 ≈ 13.
 */
const LOSS_ROWS: { text: string; pre: string; to: number; unit: string; color: string }[] = [
  { text: "Мои 57 рилсов за 30 дней: 2 218 человек написали в директ", pre: "≈ ", to: 39, unit: "обращений с ролика", color: T.gold },
  { text: "Возьмём в 10 раз меньше, чем у меня", pre: "", to: 4, unit: "обращения с ролика", color: T.gold },
  { text: "За год вы не выпустили 324 ролика (360 − 36)", pre: "324 × 4 = ", to: 1296, unit: "обращений", color: RED },
  { text: "Купит хотя бы 1 из 100", pre: "", to: 13, unit: "клиентов", color: T.gold },
];
/** Старт строк математики, шаг между ними, секунды от показа. */
const LOSS_AT = 0.4;
const LOSS_STEP = 0.9;

/** Строка математики: слева шаг, справа крупное число с единицей. Число набегает счётчиком один раз (useCountUp), ширина правой колонки фиксирована, текст слева не дрожит. */
function LossRow({ row, delay, last }: { row: (typeof LOSS_ROWS)[number]; delay: number; last: boolean }) {
  const v = useCountUp(row.to, 0.8, delay + 0.25);
  return (
    <motion.div className="grid items-center" style={{ gridTemplateColumns: "minmax(0, 1fr) 23cqw", columnGap: "1.5cqw", padding: "0.55cqw 0", borderBottom: last ? "none" : `1px solid ${T.line}` }}
      initial={{ opacity: 0, x: "-1cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ delay, duration: 0.4, ease: EASE }}>
      <div style={{ ...txt, fontWeight: 600, fontSize: "1.15cqw", lineHeight: 1.3 }}>{glue(row.text)}</div>
      <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        <Num size="1.7cqw" color={row.color}>{`${row.pre}${thousands(v)}`}</Num>
        <span style={{ ...txt, fontWeight: 700, fontSize: "1cqw", color: row.color, marginLeft: "0.5cqw" }}>{row.unit}</span>
      </div>
    </motion.div>
  );
}

/**
 * 54 · Математика потерь (Александр, 09.10: «Слишком банально описаны боли и их решения… давай посчитаем, сколько клиентов ты не привлёк и сколько денег потерял»).
 * Пять шагов по очереди, числа набегают счётчиком, итог крупно золотом, под ним золотая карточка-решение: массовые публикации, шаблоны, хуки, копирайтинг, пробные рилсы.
 * Прежние три карточки сомнений убраны 09.10 (вернуть из git):
 *   «Я не технарь»: «Агент ведёт по шагам и сам ставит всё нужное. Вы пишете словами.» (lg-i-robot);
 *   «Нет времени»: «Несколько часов в неделю. Монтаж занимает время агента, не ваше.» (lg-i-hourglass);
 *   «А если не залетит»: «Охват не гарантирует никто. Есть данные первых 3 секунд и пробные рилсы.» (lg-i-phonearrow).
 */
export function M_Doubts() {
  const tTotal = LOSS_AT + LOSS_ROWS.length * LOSS_STEP + 0.2;
  return (
    <Statement kicker="Посчитаем честно" title={<>Сколько стоят ролики, которых <Em>не было</Em></>} size="2.7cqw">
      <div style={{ maxWidth: "52cqw" }}>
        {LOSS_ROWS.map((r, i) => <LossRow key={r.text} row={r} delay={LOSS_AT + i * LOSS_STEP} last={i === LOSS_ROWS.length - 1} />)}
      </div>
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: tTotal, type: "spring", stiffness: 160, damping: 16 }}
        style={{ marginTop: "1.1cqw", maxWidth: "52cqw", transformOrigin: "left", fontFamily: "var(--font-unbounded)", fontWeight: 800, fontSize: "2.1cqw", lineHeight: 1.2, letterSpacing: "-.02em",
          ...goldText, filter: "drop-shadow(0 0.8cqw 1.4cqw rgba(201,160,90,.3))" }}>
        {glue("13 × ваш средний чек = столько вы потеряли за год")}
      </motion.div>
      <motion.div initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: tTotal + 0.9, duration: 0.5, ease: EASE }}
        style={{ ...goldButton, border: `1px solid ${T.gold2}`, borderRadius: 20, padding: "1.1cqw 1.5cqw", marginTop: "1.1cqw", maxWidth: "52cqw",
          fontFamily: "var(--font-manrope)", fontWeight: 600, fontSize: "1.15cqw", lineHeight: 1.45, color: LT.ink }}>
        <span style={{ fontWeight: 800 }}>{glue("Охваты дают массовые публикации: 30 роликов в месяц.")}</span>{" "}
        {glue("На обучении я даю шаблоны монтажа, техники хуков и копирайтинга, схему выкладки через пробные рилсы. Так вы закрываете эту дыру.")}
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: tTotal + 1.2, duration: 0.5 }}>
        <Note style={{ marginTop: "0.8cqw", maxWidth: "52cqw" }}>Мои данные за 30 дней: 57 рилсов в Instagram и 2 218 обращений в директ (база бота), октябрь 2026. Конверсия 1 из 100 для примера.</Note>
      </motion.div>
    </Statement>
  );
}

/**
 * 55 · Что ещё понадобится: две группы (Александр, 08.10, 15:00). Обязательно только Claude, остальное по желанию, итог золотом.
 * Цены из ТЗ: ElevenLabs $6, Higgsfield $15, OpenAI API пополнить на $5 в месяц, SYNTX около $10. Сумма «около $51» убрана.
 */
export function M_Subscriptions() {
  const must = [["Claude", "агент-монтажёр и вся система", "от $20 в месяц"]];
  const opt = [
    ["ElevenLabs", "голос, если не записываете сами", "$6"],
    ["Higgsfield", "объекты для монтажа и картинки для каруселей", "$15"],
    ["OpenAI API", "генерация картинок", "пополнить на $5 в месяц"],
    ["SYNTX", "кадры и движение для рекламы, модуль 3", "около $10"],
  ];
  const group = (title: string, rows: string[][], from: number, gold?: boolean) => (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 + from * STEP, duration: 0.35 }}
        style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.85cqw", color: gold ? T.gold2 : T.accent, padding: "0.5cqw 0 0.1cqw" }}>{title}</motion.div>
      {rows.map(([n, d, p], i) => (
        <motion.div key={n} className="flex items-baseline gap-[1cqw]" initial={{ opacity: 0, x: "-1cqw" }} animate={{ opacity: 1, x: "0cqw" }}
          transition={{ delay: 0.4 + (from + i + 1) * STEP, duration: 0.35, ease: EASE }} style={{ padding: "0.6cqw 0", borderBottom: `1px solid ${T.line}` }}>
          <span style={{ ...txt, fontWeight: 700, minWidth: "8cqw" }}>{n}</span>
          <span style={{ ...txt, fontWeight: 500, color: T.muted, fontSize: "0.95cqw" }}>{glueNode(d)}</span>
          <span style={{ ...txt, fontWeight: 700, marginLeft: "auto", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{p}</span>
        </motion.div>
      ))}
    </>
  );
  return (
    <Statement kicker="Без сюрпризов" title={<>Что ещё <Em>понадобится</Em></>} size="2.8cqw">
      <Stagger i={0} style={{ ...card, borderRadius: 22, padding: "0.9cqw 1.6cqw 1cqw", maxWidth: "52cqw" }}>
        {group("Обязательно", must, 0, true)}
        {group("По желанию", opt, 2)}
        <motion.div className="flex items-baseline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.4 }} style={{ paddingTop: "0.9cqw" }}>
          <Num size="1.35cqw" color={T.gold}>Обязательно только Claude, от $20 в месяц</Num>
        </motion.div>
      </Stagger>
      <Stagger i={5} base={0.6} style={{ ...txt, fontWeight: 600, fontSize: "1.15cqw", lineHeight: 1.45, maxWidth: "46cqw", marginTop: "1.3cqw" }}>
        {glueNode("Не хотите лишних подписок? Записывайте голос и видео сами, для монтажа хватит Claude.")}
      </Stagger>
      <Note style={{ marginTop: "0.8cqw" }}>Claude Max за $200 в месяц хватает на 150 роликов. Цены на 26 сентября 2026</Note>
    </Statement>
  );
}

/**
 * Сколько стоит один рилс (Александр, 09.10): перед продажей обучения, на вопрос «во сколько обходится система и монтаж».
 * Три карточки: монтаж ролика, обучение системы на своём дизайне, ИИ-ассистент в директе. Цифры примерные, мои расходы в октябре 2026.
 * Под третьей карточкой скрин отчёта ассистента за 08.10 (public/montage/results/assistant-report.png, 512×156).
 */
export function M_CostNow() {
  const items: { n: string; t: string; d: string }[] = [
    { n: "≈ $1", t: "Монтаж ролика", d: "Claude Max за $100 в месяц: около 100 роликов. Минута монтажа от $0,8 до $1." },
    { n: "≈ $5", t: "Обучить систему на своём дизайне", d: "Разово. Зависит от объёма моушн-дизайна и сложности референсов." },
    { n: "≈ 8 ¢", t: "ИИ-ассистент в директе", d: "За 20 переписок. Закрыли одного клиента: ассистент окупился в 5–20 раз. Как продажник, который работает за копейки." },
  ];
  return (
    <Statement kicker="Без сюрпризов" title={<>Сколько мне обходится <Em>один рилс</Em></>} size="2.8cqw">
      <div className="grid grid-cols-3 gap-[1cqw]" style={{ maxWidth: "58cqw" }}>
        {items.map((it, i) => (
          <Stagger key={it.t} i={i} style={{ ...card, borderRadius: 22, padding: "1.3cqw 1.4cqw 1.4cqw" }}>
            <Num size="2.6cqw" color={T.ink}>{it.n}</Num>
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.15cqw", lineHeight: 1.25, marginTop: "0.9cqw" }}>{glueNode(it.t)}</div>
            <div style={{ ...txt, fontWeight: 500, fontSize: "1cqw", color: T.muted, marginTop: "0.6cqw" }}>{glueNode(it.d)}</div>
          </Stagger>
        ))}
      </div>
      <Stagger i={4} base={0.6} style={{ maxWidth: "58cqw", marginTop: "1.2cqw" }}>
        <div className="flex flex-col items-end" style={{ gap: "0.4cqw" }}>
          <img src="/montage/results/assistant-report.png" alt="Отчёт ассистента за день: модели $0.023, за 7 дней $0.34" draggable={false}
            style={{ display: "block", width: "22cqw", height: "auto", borderRadius: "0.9cqw", border: `1px solid ${T.line}` }} />
          <div style={{ ...txt, fontWeight: 500, fontSize: "0.85cqw", color: T.muted }}>Отчёт моего ассистента за день</div>
        </div>
      </Stagger>
      <Note style={{ marginTop: "0.8cqw" }}>Цифры примерные: мои расходы в октябре 2026.</Note>
    </Statement>
  );
}

/**
 * 56 ✦ · Осталось N из 5. Ведущий переключает занятые места клавишами 0–5: занятое место гаснет и оседает.
 * Из показа убран 08.10: условие «первым 5 броням» заменил бонус «купите до конца дня» (слайд bon). Вернуть: вставить M_Slots с ключом 56 после 54, текст под новое условие.
 */
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
      lead="Доступ 6 месяцев первым 5 броням Vibe Production. Шестой получит стандартные 3 месяца доступа.">
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
        {[`${moneyBoth(150000)} вместо ${moneyBoth(250000)}`, `или от ${moneyBoth(6250)} в месяц`, `бронь ${moneyBoth(BOOKING_PRICE)}`].map((c, i) => (
          <Stagger key={c} i={i} base={0.55}>
            <span style={{ display: "inline-block", ...card, borderRadius: 999, padding: "0.8cqw 1.4cqw", ...txt, fontSize: "1.1cqw",
              ...(i === 0 || i === 2 ? { ...goldButton, border: `1px solid ${T.gold2}` } : null) }}>{c}</span>
          </Stagger>
        ))}
      </div>
      {/* слова для двух других выборов (07.10): под МОНТАЖ и его условиями, цены из prices.ts */}
      <div className="flex flex-wrap gap-[0.8cqw]" style={{ marginTop: "1.5cqw", maxWidth: "52cqw" }}>
        {([["ПРО", `от ${money(PRO_SOLO_PRICE)}`, PRO_SOLO_PRICE], ["ДВА", money(BUNDLE_PRICE), BUNDLE_PRICE]] as const).map(([w, p, n], i) => (
          <Stagger key={w} i={i} base={0.95}>
            <span className="flex items-center" style={{ ...card, border: `1.5px solid ${T.gold2}`, borderRadius: 20, padding: "0.8cqw 1.4cqw", gap: "0.7cqw", whiteSpace: "nowrap" }}>
              <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.5cqw", lineHeight: 1, ...goldText }}>{w}:</span>
              <span className="flex flex-col"><span style={{ ...txt, fontWeight: 700, fontSize: "1.2cqw" }}>{p}</span><span style={{ ...txt, fontWeight: 700, fontSize: "0.95cqw", color: T.muted }}>{moneyUsd(n)}</span></span>
            </span>
          </Stagger>
        ))}
      </div>
    </SlideLayout>
  );
}

/**
 * 57g ✦ · Бонус за игру: слева телефон с роликом игры (public/montage/reels/token-runner.mp4, без звука, на повторе), справа заголовок, лид и QR на Token Runner.
 * Код из игры снимает ещё 10 000 ₸ с Vibe Production (Александр, 07.10). Всё в левых 60% кадра.
 */
export function M_GameBonus() {
  return (
    <Statement kicker="Бонус участникам эфира"
      title={<>Пройдите игру и получите <Em><span style={{ whiteSpace: "nowrap" }}>{nb("−10 000 ₸")}</span></Em> <UsdTag n={10000} /> на Vibe Production</>} size="2.3cqw"
      lead={<>Игра Token Runner в Telegram: пройдите 3 испытания, получите код, и Vibe Production обойдётся в {moneyBoth(140000)} вместо {moneyBoth(150000)}</>}
      leftSize="16cqw"
      left={
        <motion.div initial={{ opacity: 0, y: "3cqw", rotate: -4 }} animate={{ opacity: 1, y: "0cqw", rotate: 0 }} transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.15 }}>
          <Phone video="/montage/reels/token-runner.mp4" src="/montage/reels/token-runner.jpg" width="11.5cqw" chrome={false} />
        </motion.div>
      }>
      <Stagger i={0} className="flex items-center" style={{ gap: "1.6cqw" }}>
        {/* плита QR остаётся белой: тёмные модули на стекле камера не прочитает */}
        <div style={{ ...card, background: LT.paper, borderRadius: 22, padding: "0.9cqw", width: "10cqw", flexShrink: 0 }}>
          <img src="/montage/qr-game.svg" alt="QR-код: игра Token Runner в Telegram" style={{ display: "block", width: "100%", height: "auto" }} />
        </div>
        <div style={{ ...txt, fontWeight: 700, fontSize: "1.3cqw", color: T.brown, whiteSpace: "nowrap" }}>t.me/tokenrunner_bot</div>
      </Stagger>
    </Statement>
  );
}

/**
 * bon4 · ещё один бонус за покупку, сразу после цены и QR (Александр 09.10 через «Монтаж Reels»): стиль монтажа «35 художников»,
 * больше 35 разных стилей для захвата внимания. Видео public/montage/bonus/art-motion-35.mp4 (1080×1920, 49 с, речь Александра):
 * играет само без звука по кругу, клик по видео включает звук с начала, второй клик ставит паузу. Клик слайды не листает.
 */
function BonusMotionVideo() {
  const [sound, setSound] = useState(false);
  const toggle = (e: React.MouseEvent<HTMLVideoElement>) => {
    e.stopPropagation();
    const v = e.currentTarget;
    if (!sound) { v.muted = false; v.volume = 0.8; v.currentTime = 0; v.play().catch(() => {}); setSound(true); return; }
    if (v.paused) v.play().catch(() => {}); else v.pause();
  };
  return (
    <div className="relative" style={{ width: "15cqw", aspectRatio: "9 / 16", borderRadius: "1.4cqw", overflow: "hidden", border: `1px solid ${T.gold2}`, boxShadow: T.shadow, background: "#000", pointerEvents: "auto" }}>
      <video src="/montage/bonus/art-motion-35.mp4" poster="/montage/bonus/art-motion-35.jpg" autoPlay muted loop playsInline preload="auto" onClick={toggle}
        className="absolute inset-0 w-full h-full" style={{ objectFit: "cover", cursor: "pointer" }} />
      {!sound && (
        <div className="absolute left-0 right-0 flex justify-center" style={{ bottom: "1cqw", pointerEvents: "none" }}>
          <span style={{ ...txt, fontWeight: 700, fontSize: "0.75cqw", color: LT.ink, padding: "0.35cqw 0.8cqw", borderRadius: 99, ...goldButton }}>Нажмите, чтобы включить звук</span>
        </div>
      )}
    </div>
  );
}

export function M_BonusMotion() {
  return (
    <Statement kicker="Ещё один бонус за покупку" title={<>Пока я записывал этот воркшоп, я придумал ещё более крутое решение для <Em>motion design</Em>, которое вы тоже получите на обучении</>} size="2.15cqw"
      leftSize="17cqw" left={
        <motion.div initial={{ opacity: 0, y: "3cqw", rotate: -3 }} animate={{ opacity: 1, y: "0cqw", rotate: 0 }} transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.15 }}>
          <BonusMotionVideo />
        </motion.div>
      }>
      <Stagger i={3} base={0.5}>
        <div className="flex items-baseline" style={{ gap: "1cqw", marginTop: "1.2cqw" }}>
          <Num size="4.2cqw" color={T.gold}>35+</Num>
          <div style={{ ...txt, fontWeight: 700, fontSize: "1.25cqw", lineHeight: 1.35, maxWidth: "26cqw" }}>{glueNode("разных стилей монтажа для захвата внимания. Этот стиль тоже даю бонусом к обучению.")}</div>
        </div>
      </Stagger>
    </Statement>
  );
}
