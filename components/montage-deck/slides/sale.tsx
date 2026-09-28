"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { useCountUp } from "@/components/sales-deck/useCountUp";
import { MontageBg } from "../MontageBg";
import { Phone } from "../Phone";
import { Statement } from "../Statement";
import { T, glass, goldButton } from "../theme";
import { Arrow, Card, EASE, H, Kicker, Lead, Note, Num, Px, Rise, nb, thousands } from "../ui";

const txt: React.CSSProperties = { fontFamily: "var(--font-manrope)", fontWeight: 600, fontSize: "1.05cqw", lineHeight: 1.4, color: T.ink };
const light = "rgba(251,248,243,.72)";
const Stagger = ({ i, children, style, className }: { i: number; children: React.ReactNode; style?: React.CSSProperties; className?: string }) => (
  <motion.div className={className} style={style} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.08, duration: 0.45, ease: EASE }}>{children}</motion.div>
);

/** Большое слово в золоте: ХОЧУ, МОНТАЖ. */
const BigWord = ({ word, size = "9cqw" }: { word: string; size?: string }) => (
  <motion.div initial={{ opacity: 0, scale: 0.85, letterSpacing: "0.2em" }} animate={{ opacity: 1, scale: 1, letterSpacing: "-0.03em" }} transition={{ delay: 0.25, duration: 0.8, ease: EASE }}
    style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: size, lineHeight: 1, transformOrigin: "left",
      background: `linear-gradient(180deg, ${T.gold}, ${T.gold2})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
    {word}
  </motion.div>
);

/* ─────────────── Переход к продаже ─────────────── */

/** 30 · Один рилс: 107 237 просмотров. */
export function M_Case107() {
  const v = useCountUp(107237, 1.8, 0.4);
  return (
    <Statement kicker="Точка Б" title={<>Один рилс: {thousands(v)} просмотров</>} size="2.8cqw"
      lead="Я записал видео, агент собрал графику, анимацию, субтитры и звук по моим правкам."
      leftSize="20cqw" left={<Phone video="/montage/reels/mcp.mp4" src="/montage/reels/mcp.jpg" views={nb("107 237")} caption="Четыре подключения для Claude" width="14cqw" showTop={false} />}>
      <Note style={{ marginTop: 0 }}>Статистика Instagram на 26 сентября 2026</Note>
    </Statement>
  );
}

/** 31 · Хотите так же? ХОЧУ. */
export function M_Want() {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="soft" />}>
      <Rise><Kicker>Напишите в чат</Kicker></Rise>
      <BigWord word="ХОЧУ" size="10cqw" />
      <Rise delay={0.5}><H size="2.4cqw" style={{ marginTop: "1.6cqw" }}>если хотите монтировать так же</H></Rise>
    </SlideLayout>
  );
}

/** 32 · Кто выпустит первый ролик на этой неделе. */
export function M_WhoFirst() {
  return (
    <Statement obj="lg-s32-hand" kicker="Честно" title="Кто выпустит первый ролик на этой неделе?" size="2.8cqw"
      lead="Большинство досмотрит и ничего не сделает. Сейчас покажу обучение, а потом урок 3: как просмотр сам становится заявкой." />
  );
}

/* ─────────────── Окно продаж 1 ─────────────── */

/** 34 · Продаю не курс, а контент-завод. */
export function M_NotCourse() {
  const stays = ["Агент-монтажёр", "9 стилей", "6 форматов", "Реклама из фото", "Бот по кодовому слову", "ИИ-менеджер"];
  return (
    <Statement obj="lg-s49-factory" kicker="Vibe Production" title={<>Я продаю не курс, а <span style={{ whiteSpace: "nowrap" }}>контент-завод</span></>} size="2.9cqw">
      <div className="flex items-center gap-[1cqw]">
        {["Ролик", "Реклама", "Заявка"].map((c, i) => (
          <div key={c} className="flex items-center gap-[1cqw]">
            <Stagger i={i} style={{ ...glass, borderRadius: 999, padding: "0.8cqw 1.6cqw", fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.15cqw", color: i === 2 ? T.accent : T.ink }}>{c}</Stagger>
            {i < 2 && <Arrow />}
          </div>
        ))}
      </div>
      <Stagger i={3}><div style={{ ...txt, color: T.muted, marginTop: "1.8cqw", marginBottom: "0.8cqw" }}>Что остаётся у вас после обучения:</div></Stagger>
      <div className="flex flex-wrap gap-[0.6cqw]" style={{ maxWidth: "50cqw" }}>
        {stays.map((s, i) => (
          <Stagger key={s} i={4 + i}><span style={{ display: "inline-block", borderRadius: 999, padding: "0.65cqw 1.2cqw", border: `1px solid ${T.gold2}`, background: "rgba(227,192,123,.14)", ...txt, fontSize: "0.95cqw" }}>{s}</span></Stagger>
        ))}
      </div>
    </Statement>
  );
}

/** 35–37 · Модуль программы. */
export function M_Module({ no, title, lessons, result }: { no: number; title: string; lessons: string[]; result: string }) {
  return (
    <Statement kicker={`Модуль ${no} из 3 · 5 уроков`} title={title} size="3cqw">
      <div className="grid gap-[0.5cqw]" style={{ maxWidth: "46cqw" }}>
        {lessons.map((l, i) => (
          <Stagger key={l} i={i} className="flex items-center gap-[1.1cqw]" style={{ ...glass, borderRadius: 16, padding: "0.75cqw 1.2cqw" }}>
            <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.85cqw", color: T.accent, fontVariantNumeric: "tabular-nums" }}>{no}.{i + 1}</span>
            <span style={txt}>{l}</span>
          </Stagger>
        ))}
      </div>
      <Stagger i={6} className="flex items-center gap-[0.8cqw]" style={{ marginTop: "1.2cqw" }}>
        <span style={{ ...txt, fontSize: "0.85cqw", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: T.gold2 }}>Результат</span>
        <span style={{ ...txt, fontSize: "1.15cqw", fontWeight: 700 }}>{result}</span>
      </Stagger>
    </Statement>
  );
}

/** 38 ✦ · Месяц монтажёра против контент-завода. */
export function M_Anchor() {
  const a = useCountUp(300000, 1.2, 0.5);
  const b = useCountUp(150000, 1.2, 1.1);
  const card: React.CSSProperties = { borderRadius: 24, padding: "1.8cqw", border: "1px solid rgba(227,192,123,.28)", background: "rgba(255,255,255,.04)" };
  const small: React.CSSProperties = { fontFamily: "var(--font-manrope)", fontSize: "0.95cqw", lineHeight: 1.45, color: light, marginTop: "0.8cqw" };
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="ink" />}>
      <Px name="lg-s38-piggy" size="9cqw" style={{ marginBottom: "0.8cqw", marginLeft: "-0.6cqw", filter: "drop-shadow(0 0 22px rgba(227,192,123,.35))" }} />
      <Rise><Kicker color={T.gold}>Сколько это стоит</Kicker></Rise>
      <Rise delay={0.08}><H size="2.8cqw" color={T.paper}>Месяц монтажёра или свой контент-завод</H></Rise>
      <div className="grid grid-cols-2 gap-[1.2cqw]" style={{ marginTop: "2.2cqw", maxWidth: "52cqw" }}>
        <Stagger i={0} style={card}>
          <div style={{ ...small, marginTop: 0, color: "rgba(251,248,243,.85)", fontWeight: 700 }}>Монтажёр</div>
          <div style={{ marginTop: "0.8cqw" }}><Num size="2.6cqw" color={T.paper}>{`от ${thousands(a)} ₸`}</Num></div>
          <div style={small}>Каждый месяц. Вакансия на hh.kz, Алматы, 26.09.2026</div>
        </Stagger>
        <Stagger i={2} style={{ ...card, border: `1px solid ${T.gold2}`, background: "rgba(227,192,123,.10)" }}>
          <div style={{ ...small, marginTop: 0, color: T.gold, fontWeight: 700 }}>Vibe Production</div>
          <div style={{ marginTop: "0.8cqw" }}><Num size="2.6cqw" color={T.gold}>{`${thousands(b)} ₸`}</Num></div>
          <div style={small}>Один раз. Доступ к урокам 3 месяца, навык и конвейер остаются у вас</div>
        </Stagger>
      </div>
    </SlideLayout>
  );
}

/** 39 ✦ · 150 000 ₸ рассыпается на 24 ячейки по 6 250 ₸. */
export function M_Installments() {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="ink" />}>
      <Px name="lg-s39-calendar" size="9cqw" style={{ marginBottom: "0.8cqw", marginLeft: "-0.6cqw", filter: "drop-shadow(0 0 22px rgba(227,192,123,.3))" }} />
      <Rise><Kicker color={T.gold}>Рассрочка до 24 месяцев без переплаты</Kicker></Rise>
      <Rise delay={0.08}><H size="2.8cqw" color={T.paper}>Или от {nb("6 250 ₸")} в месяц</H></Rise>
      <Rise delay={0.16}><Lead color={light} style={{ marginTop: "1cqw" }}>Меньше {nb("210 ₸")} в день. Платите ровно {nb("150 000 ₸")}, частями.</Lead></Rise>
      <div className="grid gap-[0.45cqw]" style={{ gridTemplateColumns: "repeat(12, 1fr)", marginTop: "2cqw", maxWidth: "50cqw" }}>
        {Array.from({ length: 24 }, (_, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: -18, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.045, type: "spring", stiffness: 300, damping: 20 }}
            className="flex items-center justify-center" style={{ height: "3cqw", borderRadius: 10, border: "1px solid rgba(227,192,123,.35)", background: "rgba(227,192,123,.10)",
              fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.72cqw", color: T.gold, fontVariantNumeric: "tabular-nums" }}>
            {nb("6 250")}
          </motion.div>
        ))}
      </div>
      <Rise delay={1.8} className="flex flex-wrap items-center gap-[0.6cqw]" style={{ marginTop: "1.6cqw" }}>
        {["Kaspi", "Home Credit", "Halyk"].map((b) => (
          <span key={b} style={{ borderRadius: 999, padding: "0.5cqw 1.1cqw", border: "1px solid rgba(251,248,243,.25)", fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.9cqw", color: T.paper }}>{b}</span>
        ))}
        <span style={{ fontFamily: "var(--font-manrope)", fontSize: "0.85cqw", color: light, marginLeft: "0.4cqw" }}>Россия, Узбекистан, Беларусь, Кыргызстан: рассрочку подберёт менеджер</span>
      </Rise>
    </SlideLayout>
  );
}

/** 39а ✦ · Скидка 20% тем, кто вписал кодовое слово на сайте. Слово на слайде не показываем. */
export function M_Discount() {
  const after = useCountUp(120000, 1, 1.4);
  return (
    <Statement kicker="Для тех, кто нашёл слово" title="Вписали кодовое слово на сайте? Скидка 20%" size="2.6cqw"
      lead="Напишите это слово в чат эфира. Менеджер видит отметку в вашей заявке и закрепит цену."
      leftSize="19cqw" left={
        <motion.div initial={{ opacity: 0, y: 30, rotate: -3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.7, ease: EASE }}
          style={{ ...glass, borderRadius: 26, padding: "0.6cqw", width: "17cqw" }}>
          <img src="/montage/site-promo.jpg" alt="Поле для кодового слова под роликом на сайте эфира" style={{ width: "100%", height: "auto", display: "block", borderRadius: 20 }} />
        </motion.div>
      }>
      <div className="flex items-end gap-[1.4cqw]">
        <div>
          <div style={{ ...txt, fontSize: "0.9cqw", color: T.muted }}>Обычная цена</div>
          <div className="relative inline-block" style={{ marginTop: "0.5cqw" }}>
            <Num size="2.2cqw" color={T.muted}>{nb("150 000 ₸")}</Num>
            <motion.div className="absolute left-[-3%] right-[-3%] top-1/2" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.9, duration: 0.4, ease: EASE }}
              style={{ height: "0.26cqw", marginTop: "-0.13cqw", background: T.accent, borderRadius: 4, transformOrigin: "left", rotate: "-4deg" }} />
          </div>
        </div>
        <Arrow />
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.5, ease: EASE }}>
          <div style={{ ...txt, fontSize: "0.9cqw", color: T.accent, fontWeight: 700 }}>Со словом с сайта</div>
          <div style={{ marginTop: "0.5cqw" }}><Num size="2.7cqw" color={T.accent}>{`${thousands(after)}\u00A0₸`}</Num></div>
        </motion.div>
      </div>
      <Stagger i={16} style={{ marginTop: "1.2cqw" }}>
        <span style={{ display: "inline-block", borderRadius: 999, padding: "0.6cqw 1.2cqw", border: `1px solid ${T.gold2}`, background: "rgba(227,192,123,.14)", ...txt, fontSize: "0.95cqw" }}>
          или от {nb("5 000 ₸")} в месяц в рассрочку на 24 месяца
        </span>
      </Stagger>
    </Statement>
  );
}

/** 40 · Первым 5 броням 6 месяцев вместо 3. */
export function M_SixMonths() {
  const Bar = ({ label, months, gold, i }: { label: string; months: number; gold?: boolean; i: number }) => (
    <div>
      <div className="flex justify-between" style={{ ...txt, fontSize: "0.95cqw" }}><span>{label}</span><span style={{ color: gold ? T.accent : T.muted }}>{months} месяцев</span></div>
      <div style={{ marginTop: "0.5cqw", height: "1.2cqw", borderRadius: 999, background: "rgba(139,94,60,.1)", overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${(months / 6) * 100}%` }} transition={{ delay: 0.5 + i * 0.3, duration: 0.9, ease: EASE }}
          style={{ height: "100%", borderRadius: 999, background: gold ? `linear-gradient(90deg, ${T.gold}, ${T.gold2})` : "rgba(110,95,83,.45)" }} />
      </div>
    </div>
  );
  return (
    <Statement kicker="Условие эфира" title="Первым 5 броням: доступ 6 месяцев вместо 3" size="2.7cqw" lead="5 мест по условиям эфира. Шестой получит стандартные 3 месяца.">
      <div className="grid gap-[1.1cqw]" style={{ ...glass, borderRadius: 22, padding: "1.4cqw 1.6cqw", maxWidth: "40cqw" }}>
        <Bar i={0} label="Стандартный доступ" months={3} />
        <Bar i={1} label="Первые 5 броней" months={6} gold />
      </div>
    </Statement>
  );
}

/** 41 · Как занять место. */
export function M_HowToBook() {
  const steps = [["Напишите МОНТАЖ в чат", "Прямо сейчас, под эфиром"], ["Менеджер пришлёт ссылку", "На бронь и рассрочку"], [`Бронь ${nb("10 000 ₸")}`, "Действует до 23:59 сегодня"]];
  return (
    <Statement obj="lg-s41-deadline" kicker="Как занять место" title="Три шага до места в потоке" size="2.9cqw">
      <div className="grid grid-cols-3 gap-[1cqw]" style={{ maxWidth: "54cqw" }}>
        {steps.map(([t, d], i) => <Stagger key={t} i={i}><Card no={`Шаг ${i + 1}`} title={t} text={d} accent={i === 2} style={{ height: "100%" }} /></Stagger>)}
      </div>
      <Stagger i={4}><div className="inline-flex" style={{ ...goldButton, marginTop: "1.8cqw", borderRadius: 999, padding: "1cqw 2cqw", fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.2cqw" }}>МОНТАЖ в чат</div></Stagger>
    </Statement>
  );
}

/* ─────────────── Окно продаж 2 ─────────────── */

/** 52 · Цена бездействия. */
export function M_Inaction() {
  return (
    <Statement tone="ink" kicker="Посчитайте" title="Сколько роликов вы не выпустили за этот год?" size="2.9cqw" lead="И сколько заявок с них не пришло." />
  );
}

/** 53 · Всё на одном экране. */
export function M_OneScreen() {
  const mods = [["Модуль 1", "AI-монтаж", "Рилсы без знаний монтажа", "lg-i-clapper"], ["Модуль 2", "AI-креатор", "Реклама товара из фото", "lg-i-box"], ["Модуль 3", "Автоматизация", "Заявки из директа сами", "lg-i-chatkey"]];
  return (
    <Statement kicker="Коротко" title="Всё на одном экране" size="2.9cqw">
      <div className="grid grid-cols-3 gap-[0.9cqw]" style={{ maxWidth: "54cqw" }}>
        {mods.map(([no, t, d, ic], i) => <Stagger key={no} i={i}><Card icon={ic} no={no} title={t} text={d} style={{ height: "100%" }} /></Stagger>)}
      </div>
      <Stagger i={4} className="flex flex-wrap gap-[0.6cqw]" style={{ marginTop: "1.4cqw" }}>
        {["1 месяц обучения", "Доступ к урокам 3 месяца", `${nb("150 000 ₸")} или от ${nb("6 250 ₸")} в месяц`].map((c) => (
          <span key={c} style={{ borderRadius: 999, padding: "0.65cqw 1.2cqw", border: `1px solid ${T.gold2}`, background: "rgba(227,192,123,.14)", ...txt, fontSize: "0.95cqw" }}>{c}</span>
        ))}
      </Stagger>
    </Statement>
  );
}

/** 54 · Три сомнения. */
export function M_Doubts() {
  const d = [
    ["Я не технарь", "Агент ведёт по шагам и сам ставит всё нужное. Вы пишете словами.", "lg-i-robot"],
    ["Нет времени", "Несколько часов в неделю. Монтаж занимает время агента, не ваше.", "lg-i-hourglass"],
    ["А если не залетит", "Охват не гарантирует никто. Есть данные первых 3 секунд и пробные рилсы.", "lg-i-phonearrow"],
  ];
  return (
    <Statement kicker="Честные ответы" title="Три сомнения" size="3cqw">
      <div className="grid grid-cols-3 gap-[1cqw]" style={{ maxWidth: "56cqw" }}>
        {d.map(([q, a, ic], i) => <Stagger key={q} i={i}><Card icon={ic} no={`Сомнение ${i + 1}`} title={q} text={a} style={{ height: "100%" }} /></Stagger>)}
      </div>
    </Statement>
  );
}

/** 55 · Подписки честно. */
export function M_Subscriptions() {
  const rows = [["Claude Pro", "агент-монтажёр, модули 1 и 3", "$20"], ["Higgsfield", "реклама из фото", "$15"], ["SYNTX", "кадры и движение", "около $10"], ["ElevenLabs", "копия голоса", "$6"]];
  return (
    <Statement kicker="Без сюрпризов" title="Что ещё понадобится, честно" size="2.8cqw">
      <div style={{ ...glass, borderRadius: 22, padding: "1.2cqw 1.6cqw", maxWidth: "44cqw" }}>
        {rows.map(([n, d, p], i) => (
          <Stagger key={n} i={i} className="flex items-baseline gap-[1cqw]" style={{ padding: "0.7cqw 0", borderBottom: `1px solid ${T.line}` }}>
            <span style={{ ...txt, fontWeight: 700, minWidth: "8cqw" }}>{n}</span>
            <span style={{ ...txt, fontWeight: 500, color: T.muted, fontSize: "0.95cqw" }}>{d}</span>
            <span style={{ ...txt, fontWeight: 700, marginLeft: "auto", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{p}</span>
          </Stagger>
        ))}
        <Stagger i={5} className="flex items-baseline" style={{ paddingTop: "0.9cqw" }}>
          <span style={{ ...txt, fontWeight: 700 }}>На старт</span>
          <span style={{ marginLeft: "auto" }}><Num size="1.8cqw" color={T.accent}>около $51 в месяц</Num></span>
        </Stagger>
      </div>
      <Note>Для 30 роликов в месяц нужен тариф Claude Max: я плачу около {nb("50 000 ₸")}. Цены на 26 сентября 2026</Note>
    </Statement>
  );
}

/** 56 ✦ · Осталось N из 5. Ведущий переключает занятые места клавишами 0–5. */
export function M_Slots() {
  const [taken, setTaken] = useState(0);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (/^[0-5]$/.test(e.key)) setTaken(Number(e.key)); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const left = 5 - taken;
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="ink" />}>
      <Rise><Kicker color={T.gold}>Условие эфира</Kicker></Rise>
      <Rise delay={0.08}><H size="2.8cqw" color={T.paper}>Доступ 6 месяцев:<br />осталось <span style={{ color: T.gold, fontVariantNumeric: "tabular-nums" }}>{left}</span>{"\u00A0из\u00A05"}</H></Rise>
      <div className="flex gap-[1cqw]" style={{ marginTop: "2.4cqw" }}>
        {Array.from({ length: 5 }, (_, i) => {
          const isTaken = i < taken;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, scale: isTaken ? 0.92 : 1 }} transition={{ delay: 0.3 + i * 0.08, duration: 0.45, ease: EASE }}
              className="flex flex-col items-center justify-center" style={{ width: "7.5cqw", height: "9cqw", borderRadius: 20, transition: "background .4s, border-color .4s",
                border: `1.5px solid ${isTaken ? "rgba(251,248,243,.15)" : T.gold2}`, background: isTaken ? "rgba(251,248,243,.04)" : "rgba(227,192,123,.14)" }}>
              <Num size="2.6cqw" color={isTaken ? "rgba(251,248,243,.25)" : T.gold}>{i + 1}</Num>
              <div style={{ fontFamily: "var(--font-manrope)", fontWeight: 700, fontSize: "0.8cqw", marginTop: "0.6cqw", color: isTaken ? "rgba(251,248,243,.35)" : T.gold }}>{isTaken ? "занято" : "свободно"}</div>
            </motion.div>
          );
        })}
      </div>
      <Rise delay={0.8}><Lead color={light} style={{ marginTop: "1.8cqw" }}>Шестой получит стандартные 3 месяца доступа.</Lead></Rise>
    </SlideLayout>
  );
}

/** 57 · Финальный призыв. */
export function M_FinalCTA() {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg tone="soft" />}>
      <Rise><Kicker>Напишите в чат до 23:59</Kicker></Rise>
      <div className="flex items-center gap-[1.6cqw]"><BigWord word="МОНТАЖ" size="8cqw" /><Px name="lg-i-hourglass" size="9cqw" delay={0.7} /></div>
      <Rise delay={0.5} className="flex flex-wrap gap-[0.6cqw]" style={{ marginTop: "2cqw" }}>
        {[nb("150 000 ₸"), `со словом с сайта ${nb("120 000 ₸")}`, `или от ${nb("6 250 ₸")} в месяц`, `бронь ${nb("10 000 ₸")}`].map((c, i) => (
          <span key={c} style={{ ...glass, borderRadius: 999, padding: "0.8cqw 1.4cqw", ...txt, fontSize: "1.1cqw", ...(i === 1 || i === 3 ? { border: `1.5px solid ${T.gold2}` } : null) }}>{c}</span>
        ))}
      </Rise>
    </SlideLayout>
  );
}
