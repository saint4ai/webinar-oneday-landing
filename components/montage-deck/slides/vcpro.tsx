"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { Statement } from "../Statement";
import { BOOKING_PRICE, BUNDLE_PRICE, BUNDLE_SAVING, PRODUCTION_PRICE, PRO_HALF, PRO_PRICE, PRO_SOLO_PRICE, SEPARATE_PRICE, money } from "../prices";
import { LT, T, card, goldButton, goldText, pricePlate } from "../theme";
import { DrawLine, Em, Note, Num, Stagger, at, nb, txt } from "../ui";
import { PricePlate, Struck } from "./sale";

/**
 * Блок «Vibe Coding PRO и два курса вместе», 4 минуты, между практикой 3 (p3i) и окном продаж 2 (51). Эфир 07.10.2026.
 * Слайды v1…v6, тексты: docs/copy/deck-block-vcpro.md (сессия «Скрипты для Reels»), решения Александра 07.10 в
 * docs/tasks/deck_vcpro_block_and_review.md. Цены и всё, что из них считается, берутся из ../prices.ts (PRO_PRICE меняется там одной строкой).
 * Слова в чат: МОНТАЖ (Vibe Production), ПРО (Vibe Coding PRO), ДВА (пакет). Всё в левых 60% кадра, справа камера.
 */

const unb = (size: string, color: string = T.ink): CSSProperties => ({ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: size, lineHeight: 1, color });

/** Золотая метка «PRO» слева от кикера. */
const ProBadge = () => (
  <span style={{ display: "inline-block", marginRight: "0.8cqw", borderRadius: 999, padding: "0.3cqw 0.85cqw", ...goldButton, boxShadow: "none",
    fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.8cqw", letterSpacing: ".08em", verticalAlign: "middle" }}>PRO</span>
);

/* Линейные значки в цветах бренда: сайт, шестерёнка, ноутбук, терминал, клапан рилса, две карточки. */
type GlyphKind = "site" | "gear" | "laptop" | "terminal" | "clapper" | "cards";
const GLYPHS: Record<GlyphKind, ReactNode> = {
  site: <><rect x="3" y="4.5" width="18" height="15" rx="2.5" /><path d="M3 9.5h18M6.6 7h.01M9.2 7h.01" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="6.3" /><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" /></>,
  laptop: <><rect x="5" y="5" width="14" height="10" rx="1.6" /><path d="M2.5 19h19M9.6 19l.5-2h3.8l.5 2" /></>,
  terminal: <><rect x="3" y="4.5" width="18" height="15" rx="2.5" /><path d="M7 10l3 2.5L7 15M12.5 15H17" /></>,
  clapper: <><rect x="3" y="4.5" width="18" height="4" rx="1" /><path d="M8 4.5l-2 4M13 4.5l-2 4M18 4.5l-2 4" /><rect x="3" y="9.5" width="18" height="10" rx="1.6" /></>,
  cards: <><rect x="3" y="7" width="13" height="11" rx="2" /><path d="M8 7V6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" /></>,
};

/** Значок в квадрате со стеклянной заливкой; на золотой плашке (dark) тёмный. */
const IconTile = ({ kind, size = "3.4cqw", dark = false }: { kind: GlyphKind; size?: string; dark?: boolean }) => (
  <span className="flex items-center justify-center" style={{ width: size, height: size, borderRadius: "0.9cqw", flexShrink: 0,
    background: dark ? "rgba(20,16,14,.12)" : `${T.gold}1F`, border: `1px solid ${dark ? "rgba(20,16,14,.28)" : `${T.gold2}66`}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,.18)" }}>
    <svg viewBox="0 0 24 24" fill="none" stroke={dark ? LT.ink : T.gold} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: "58%", height: "58%" }}>{GLYPHS[kind]}</svg>
  </span>
);

const CheckIcon = ({ color = T.gold2, size = "1.1cqw" }: { color?: string; size?: string }) => (
  <svg viewBox="0 0 24 24" style={{ width: size, height: size, flexShrink: 0 }} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);

/* ───────────── v1 · Для кого ───────────── */

export function M_VcWho() {
  const items: [GlyphKind, string][] = [
    ["site", "Свои сервисы и сайты без команды программистов"],
    ["gear", "Рабочая рутина, которую агент берёт на себя"],
    ["laptop", "Личная среда вайбкодинга на вашем компьютере"],
  ];
  return (
    <Statement kicker={<><ProBadge />Vibe Coding PRO · для кого</>} title={<>Хотите вайбкодить <Em>всерьёз</Em>?</>} size="3.2cqw"
      lead="Рилсы и реклама остались в Vibe Production. PRO про свои сервисы и сайты: от первого запуска до работающего продукта.">
      <div className="grid grid-cols-3 gap-[1cqw]" style={{ maxWidth: "54cqw" }}>
        {items.map(([k, t], i) => (
          <Stagger key={t} i={i} style={{ ...card, padding: "1.4cqw 1.5cqw" }}>
            <IconTile kind={k} />
            <div style={{ ...txt, fontWeight: 700, fontSize: "1.2cqw", lineHeight: 1.3, marginTop: "1cqw" }}>{t}</div>
          </Stagger>
        ))}
      </div>
    </Statement>
  );
}

/* ───────────── v2 · Что внутри ───────────── */

/** Колонки-«этажи»: верхняя строка золотая. Строка вида «1. Название» делится на золотой номер и текст. */
const FLOORS: { head: string; rows: string[] }[] = [
  { head: "Основа, 15 уроков", rows: ["1. Запуск двигателя", "2. Язык агента", "3. Резервная копия с GitHub", "4. Конституция проекта, метод onAI"] },
  { head: "Продукт, 11 уроков", rows: ["5. Прокачка агента", "6. База данных продукта", "7. Боевой запуск", "8. Армия агентов"] },
  { head: "Деньги и бонус", rows: ["9. Деньги в продукте", "Бонус: «Эра агентов на вашем компьютере»"] },
];

export function M_VcProgram() {
  return (
    <Statement kicker={<><ProBadge />Vibe Coding PRO · программа</>} title={<>10 модулей, <Em>36 уроков</Em></>} size="3.2cqw"
      lead="Путь от первого запуска до боевого запуска продукта.">
      <div className="grid grid-cols-3 gap-[0.9cqw]" style={{ maxWidth: "54cqw" }}>
        {FLOORS.map((f, c) => (
          <Stagger key={f.head} i={c} className="flex flex-col">
            <div style={{ ...goldButton, borderRadius: "1.2cqw 1.2cqw 0.4cqw 0.4cqw", padding: "0.8cqw 1.1cqw", ...unb("0.95cqw", LT.ink), lineHeight: 1.25 }}>{f.head}</div>
            <div style={{ ...card, borderRadius: "0.4cqw 0.4cqw 1.2cqw 1.2cqw", marginTop: "0.3cqw", padding: "0.4cqw 1.1cqw", flex: 1 }}>
              {f.rows.map((r, i) => {
                const m = /^(\d+)\.\s+(.+)$/.exec(r);
                return (
                  <div key={r} className="flex items-baseline" style={{ gap: "0.6cqw", padding: "0.6cqw 0", borderBottom: i < f.rows.length - 1 ? `1px solid ${T.line}` : "none" }}>
                    {m && <span style={{ ...unb("0.85cqw", T.gold), minWidth: "0.9cqw" }}>{m[1]}</span>}
                    <span style={{ ...txt, fontWeight: 600, fontSize: "1.05cqw", lineHeight: 1.3 }}>{m ? m[2] : r}</span>
                  </div>
                );
              })}
            </div>
          </Stagger>
        ))}
      </div>
      <Stagger i={5} style={{ ...card, border: `1.5px solid ${T.gold2}`, borderRadius: 20, padding: "0.9cqw 1.4cqw", marginTop: "1.2cqw", maxWidth: "54cqw" }}>
        <span style={{ ...txt, fontWeight: 700, fontSize: "1.5cqw", lineHeight: 1.3 }}>На выходе <span style={{ color: T.brownLt }}>свой AI-сервис в интернете</span>: портфолио или старт SaaS</span>
      </Stagger>
    </Statement>
  );
}

/* ───────────── v3 · Тарифы ───────────── */

/** Строка плашки тарифа: золотая галочка и текст. */
const PlanRow = ({ children, muted = false }: { children: ReactNode; muted?: boolean }) => (
  <div className="flex items-start" style={{ gap: "0.6cqw", marginTop: "0.8cqw", ...txt, fontWeight: 600, fontSize: "1.05cqw", lineHeight: 1.3, color: muted ? T.muted : T.ink }}>
    <span style={{ paddingTop: "0.18cqw" }}><CheckIcon color={muted ? T.muted : T.gold} /></span>{children}
  </div>
);

export function M_VcTariffs() {
  return (
    <Statement kicker={<><ProBadge />Vibe Coding PRO · тарифы</>} title={<>Два тарифа: сами <Em><span style={{ whiteSpace: "nowrap" }}>или с кураторами</span></Em></>} size="3cqw"
      lead="Программа и материалы одинаковые, отличается сопровождение.">
      <div className="grid grid-cols-2 items-end gap-[1.2cqw]" style={{ maxWidth: "54cqw" }}>
        <Stagger i={0} style={{ ...card, padding: "1.5cqw 1.7cqw" }}>
          <div style={unb("1.15cqw", T.muted)}>Вайб Solo</div>
          <div style={{ marginTop: "0.9cqw" }}><Num size="2.5cqw" color={T.brown}>{money(PRO_SOLO_PRICE)}</Num></div>
          <PlanRow>Все модули, материалы и промпты</PlanRow>
          <PlanRow>AI-наставник на платформе</PlanRow>
          <PlanRow muted>Без обратной связи, проходите сами</PlanRow>
        </Stagger>
        {/* главный тариф: выше и золотая рамка, на тёмной плашке как цена на слайде 38 */}
        <Stagger i={2} style={{ ...pricePlate, border: `1.5px solid ${T.gold2}`, padding: "1.9cqw 1.7cqw" }}>
          <div style={unb("1.15cqw", T.gold)}>Вайбкодер Pro</div>
          <div style={{ marginTop: "0.9cqw" }}><Num size="2.5cqw" color={T.gold}>{money(PRO_PRICE)}</Num></div>
          <PlanRow>Все модули, материалы и промпты</PlanRow>
          <PlanRow>AI-наставник на платформе</PlanRow>
          <PlanRow>Кураторы разбирают ваши работы</PlanRow>
          <PlanRow>Можно двумя платежами по {money(PRO_HALF)}</PlanRow>
        </Stagger>
      </div>
      <Stagger i={5}><Note style={{ marginTop: "1.2cqw", maxWidth: "54cqw" }}>Рассрочка до 24 месяцев через менеджера. Подписка Claude от $20 в месяц оплачивается отдельно. В тариф входит OPUS.CLUB на 12 месяцев</Note></Stagger>
    </Statement>
  );
}

/* ───────────── v4 · Два курса вместе ───────────── */

/** Курс-обложка: название и цена. */
const CourseCard = ({ name, price, i }: { name: string; price: string; i: number }) => (
  <Stagger i={i} style={{ ...card, padding: "1.1cqw 1.3cqw", width: "15cqw", flexShrink: 0 }}>
    <div style={unb("0.95cqw", T.muted)}>{name}</div>
    <div style={{ marginTop: "0.8cqw" }}><Num size="1.55cqw" color={T.brown}>{price}</Num></div>
  </Stagger>
);

export function M_VcBundle() {
  return (
    <Statement kicker="Только для участников эфира" title={<>Оба курса вместе: <Em>{money(BUNDLE_PRICE)}</Em></>} size="3cqw"
      lead="Vibe Production и Vibe Coding PRO с кураторами.">
      {/* расчёт одной строкой: курс + курс = сумма по отдельности */}
      <div className="flex items-center" style={{ gap: "0.9cqw", maxWidth: "54cqw" }}>
        <CourseCard i={0} name="Vibe Production" price={money(PRODUCTION_PRICE)} />
        <Stagger i={1} className="flex items-center justify-center" style={{ ...goldButton, width: "2.4cqw", height: "2.4cqw", borderRadius: 999, flexShrink: 0, ...unb("1.5cqw", LT.ink) }}>+</Stagger>
        <CourseCard i={2} name="Vibe Coding PRO" price={money(PRO_PRICE)} />
        <Stagger i={3} style={{ ...unb("1.8cqw", T.muted), flexShrink: 0 }}>=</Stagger>
        <Stagger i={4} style={{ flexShrink: 0 }}><Struck delay={1} size="1.7cqw">{money(SEPARATE_PRICE)}</Struck></Stagger>
      </div>
      {/* итог: золотая плашка как цена на слайде 39a и плашка экономии */}
      <div className="flex items-center" style={{ gap: "1.2cqw", marginTop: "1.6cqw", maxWidth: "54cqw" }}>
        <PricePlate delay={1.15} label="Участникам эфира" value={money(BUNDLE_PRICE)} />
        <Stagger i={6} base={1.3}><span style={{ display: "inline-block", ...goldButton, borderRadius: 999, padding: "0.8cqw 1.5cqw", ...txt, fontWeight: 700, fontSize: "1.2cqw", color: LT.ink }}>Вы экономите {money(BUNDLE_SAVING)}</span></Stagger>
      </div>
      <Stagger i={6} base={1.3}>
        <Note style={{ marginTop: "1.4cqw", maxWidth: "54cqw" }}>Vibe Production: 3 модуля, 15 уроков. Vibe Coding PRO: 10 модулей, 36 уроков.</Note>
        <Note style={{ marginTop: "0.3cqw", maxWidth: "54cqw" }}>Предложение только для участников этого эфира, до 23:59 сегодня. Рассрочка до 24 месяцев через менеджера.</Note>
      </Stagger>
    </Statement>
  );
}

/* ───────────── v5 · Что выбрать ───────────── */

export function M_VcChoose() {
  const rows: { kind: GlyphKind; want: string; take: string; price: string; gold?: boolean }[] = [
    { kind: "clapper", want: "Делать рилсы и рекламу без монтажёра", take: "Vibe Production", price: money(PRODUCTION_PRICE) },
    { kind: "terminal", want: "Собирать свои сервисы и сайты", take: "Vibe Coding PRO", price: `от ${money(PRO_SOLO_PRICE)}, с кураторами ${money(PRO_PRICE)}` },
    { kind: "cards", want: "И то и другое", take: "Оба курса", price: `${money(BUNDLE_PRICE)} вместо ${money(SEPARATE_PRICE)}`, gold: true },
  ];
  return (
    <Statement kicker="Выберите свой путь" title={<>Что взять <Em>именно вам</Em></>} size="3cqw"
      lead="Один вопрос: что вы хотите делать после эфира?">
      <div className="grid gap-[0.8cqw]" style={{ maxWidth: "54cqw" }}>
        {rows.map((r, i) => {
          const ink = r.gold ? LT.ink : T.ink;
          const sub = r.gold ? "rgba(42,33,28,.72)" : T.muted;
          return (
            <Stagger key={r.take} i={i} className="flex items-center"
              style={{ ...(r.gold ? { ...goldButton, border: `1px solid ${T.gold2}` } : card), borderRadius: 20, padding: "1cqw 1.4cqw", gap: "1.3cqw" }}>
              <IconTile kind={r.kind} dark={r.gold} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...txt, fontWeight: 700, fontSize: "0.7cqw", letterSpacing: ".14em", textTransform: "uppercase", color: sub }}>Если вы хотите</div>
                <div style={{ ...txt, fontWeight: 700, fontSize: "1.3cqw", lineHeight: 1.25, marginTop: "0.25cqw", color: ink }}>{r.want}</div>
              </div>
              <div style={{ width: "24cqw", flexShrink: 0 }}>
                <div style={{ ...txt, fontWeight: 700, fontSize: "0.7cqw", letterSpacing: ".14em", textTransform: "uppercase", color: sub }}>Берёте</div>
                <div style={{ ...unb("1.2cqw", r.gold ? LT.ink : T.brown), lineHeight: 1.2, marginTop: "0.3cqw" }}>{r.take}</div>
                <div style={{ ...txt, fontWeight: 700, fontSize: "1.2cqw", lineHeight: 1.3, marginTop: "0.3cqw", color: ink }}>{r.price}</div>
              </div>
            </Stagger>
          );
        })}
      </div>
    </Statement>
  );
}

/* ───────────── v6 · Как занять место ───────────── */

export function M_VcBook() {
  const steps = ["Напишите слово в чат: МОНТАЖ, ПРО или ДВА", "Менеджер Аяна пришлёт ссылку на предоплату", `Предоплата ${nb("10 000 ₸")} закрепляет за вами место`];
  return (
    <Statement kicker="Как оплатить" title={<>Предоплата <Em>{money(BOOKING_PRICE)}</Em> закрепляет место</>} size="3cqw"
      lead="Она входит в цену выбранного курса.">
      <div className="flex items-stretch" style={{ maxWidth: "54cqw" }}>
        {steps.map((t, i) => (
          <div key={t} className="flex items-center" style={{ flex: 1 }}>
            <Stagger i={i * 2} style={{ flex: 1, height: "100%" }}>
              <div style={{ ...card, height: "100%", padding: "1.3cqw 1.4cqw", ...(i === 2 ? { border: `1.5px solid ${T.gold2}` } : null) }}>
                <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "2.6cqw", lineHeight: 1, ...goldText }}>{i + 1}</div>
                <div style={{ ...txt, fontWeight: 700, fontSize: "1.2cqw", lineHeight: 1.3, marginTop: "0.8cqw" }}>{t}</div>
              </div>
            </Stagger>
            {i < 2 && <div style={{ padding: "0 0.5cqw" }}><DrawLine delay={at(i * 2 + 1, 0.4)} width="1.6cqw" /></div>}
          </div>
        ))}
      </div>
      <Stagger i={6} style={{ marginTop: "1.8cqw" }}>
        <motion.div className="inline-flex" animate={{ boxShadow: [`0 0 0 0cqw ${T.gold}66`, `0 0 0 1cqw ${T.gold}00`] }} transition={{ delay: 1.2, duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          style={{ ...goldButton, borderRadius: 999, padding: "1cqw 2cqw", fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.2cqw" }}>ДВА в чат</motion.div>
      </Stagger>
      <Stagger i={7} base={0.4}><Note style={{ marginTop: "1.4cqw", maxWidth: "52cqw" }}>Остальное по рассрочке или двумя платежами, менеджер объяснит. Вопросы: Telegram @futleid, WhatsApp {nb("+7 708 583 4575")}</Note></Stagger>
    </Statement>
  );
}
