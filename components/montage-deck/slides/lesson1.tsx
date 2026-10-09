"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { MontageBg } from "../MontageBg";
import { Phone } from "../Phone";
import { ReelPhone } from "./pipeline";
import { ReelRail, Views } from "../ReelRail";
import { RESULTS, coversFrom } from "../results";
import { Statement } from "../Statement";
import { LT, T, card, goldButton } from "../theme";
import { moneyUsd } from "../prices";
import { Card, EASE, Em, H, Kicker, MaskIcon, Note, Num, RISE_DUR, Rise, STEP, UsdTag, at, nb } from "../ui";

const txt: React.CSSProperties = { fontFamily: "var(--font-manrope)", fontWeight: 600, fontSize: "1.05cqw", lineHeight: 1.4, color: T.ink };
const Stagger = ({ i, children, style, className }: { i: number; children: React.ReactNode; style?: React.CSSProperties; className?: string }) => (
  <motion.div className={className} style={style} initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: at(i, 0.28), duration: RISE_DUR, ease: EASE }}>{children}</motion.div>
);

/** 12 · Монтаж стал узким местом: тезис крупно, три пути карточками. */
export function M_Bottleneck() {
  const ways = [
    ["Монтажёр", "Дорого, и платить каждый месяц", "lg-i-laptopcoins"],
    ["Сам в CapCut", "Вечер уходит на один ролик", "lg-i-laptopfilm"],
    ["Не выкладываю", "Снял, а монтировать некогда", "lg-i-calendar"],
  ];
  return (
    <Statement kicker="Проблема" title={<>Рилсы нужны. Монтаж стал <Em>узким местом</Em></>} size="3.3cqw">
      <div className="grid grid-cols-3 gap-[1cqw]" style={{ maxWidth: "54cqw" }}>
        {ways.map(([t, d, ic], i) => <Stagger key={t} i={i}><Card icon={ic} no={`Путь ${i + 1}`} title={t} text={d} style={{ height: "100%" }} /></Stagger>)}
      </div>
      <Stagger i={3}><div style={{ ...txt, fontSize: "1.35cqw", fontWeight: 700, marginTop: "2cqw", color: T.brown }}>Проблема не в вас. Монтаж перестал быть ручной работой.</div></Stagger>
    </Statement>
  );
}

/** 13 · Вакансия монтажёра: цена крупно. */
export function M_Vacancy() {
  return (
    <Statement obj="lg-s13-editor" kicker="Сколько стоит монтажёр" title={<>Монтажёр на окладе: <Em>{nb("от 300 000 ₸")}</Em> <UsdTag n={300000} /> в месяц</>} size="3.1cqw">
      <div className="grid grid-cols-2 gap-[1cqw]" style={{ maxWidth: "50cqw" }}>
        <Stagger i={0} style={{ ...card, padding: "1.4cqw 1.6cqw" }}>
          <div style={{ ...txt, color: T.accent, fontSize: "0.85cqw", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>Вакансия · hh.kz</div>
          <div style={{ ...txt, fontSize: "1.3cqw", fontWeight: 700, marginTop: "0.7cqw" }}>Видеомонтажёр на CapCut</div>
          <div style={{ ...txt, color: T.muted, fontWeight: 500, marginTop: "0.3cqw" }}>Алматы</div>
          <div style={{ marginTop: "1cqw" }}><Num size="2.3cqw" color={T.brown}>{nb("от 300 000 ₸")}</Num></div>
          <div style={{ ...txt, color: T.muted, fontWeight: 700, fontSize: "1.1cqw", marginTop: "0.4cqw", whiteSpace: "nowrap" }}>{moneyUsd(300000)}</div>
          <div style={{ ...txt, color: T.muted, fontWeight: 500, fontSize: "0.85cqw", marginTop: "0.5cqw" }}>на руки, в месяц</div>
        </Stagger>
        <Stagger i={1}><Card no="Или самому" title="Premiere и CapCut учить месяцами" text="Сложные программы и ручная работа над каждым роликом." style={{ height: "100%" }} /></Stagger>
      </div>
      <Note>Вакансия на hh.kz, 26 сентября 2026</Note>
    </Statement>
  );
}

/** 14 ✦ · Охват решают первые 3 секунды: лента листается сама, полосы растут. */
export function M_ThreeSeconds() {
  const Row = ({ label, value, pct, strong, i }: { label: string; value: string; pct: number; strong?: boolean; i: number }) => (
    <Stagger i={i} style={{ ...card, borderRadius: 20, padding: "1.3cqw 1.6cqw" }}>
      <div className="flex items-baseline justify-between gap-[1cqw]">
        <span style={txt}>{label}</span>
        <Num size="2.6cqw" color={strong ? T.brown : T.muted}>{value}</Num>
      </div>
      <div style={{ marginTop: "0.9cqw", height: "0.9cqw", borderRadius: 999, background: `${T.brown}1A`, overflow: "hidden" }}>
        <motion.div initial={{ width: "0%" }} animate={{ width: `${pct}%` }} transition={{ delay: 0.6 + i * 0.2, duration: 0.9, ease: EASE }}
          style={{ height: "100%", borderRadius: 999, background: strong ? `linear-gradient(90deg, ${T.gold}, ${T.gold2})` : `${T.muted}73` }} />
      </div>
    </Stagger>
  );
  return (
    <Statement kicker="Моя статистика Instagram · 14 рилсов" title={<>Охват решают<br /><Em>первые 3 секунды</Em></>} size="3.1cqw"
      lead="Медиана охвата рилса в зависимости от того, сколько людей пролистали его сразу."
      leftSize="15cqw" leftOverflow="hidden"
      left={
        // мои рилсы с охватом: обложки со счётчиком из приложения Instagram летят вниз бесконечной колонкой, цифра крупно поверх
        <ReelRail vertical items={coversFrom(RESULTS.appCovers, 4)} itemWidth="9.5cqw" gap={0.1} speed={0.22} style={{ height: "100%", width: "100%" }} render={(r) => (
          <div className="relative" style={{ width: "100%", aspectRatio: "9/16", borderRadius: "1cqw", overflow: "hidden", boxShadow: T.shadowSm, background: T.night2 }}>
            <img src={`/montage/reels/${r.file}.jpg`} alt={`${r.title}: ${r.views} просмотров`} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-start" style={{ padding: "0.5cqw", background: "linear-gradient(transparent, rgba(10,8,7,.55))" }}>
              <Views value={r.views} size="0.85cqw" />
            </div>
          </div>
        )} />
      }>
      <div className="grid gap-[0.9cqw]" style={{ maxWidth: "40cqw" }}>
        <Row i={0} label="Пролистали меньше 46%" value={nb("4 816")} pct={100} strong />
        <Row i={1} label="Пролистали больше 46%" value={nb("1 098")} pct={23} />
      </div>
      <Note>Мои 14 рилсов на 19 сентября 2026. Разница в охвате: в 4 раза</Note>
    </Statement>
  );
}

/** 15 · Правило первой фразы. */
export function M_OnePhrase() {
  const rules = ["Огромный шрифт", "Контраст с фоном", "Без мелких подписей"];
  const Bar = ({ label, pct, strong, i }: { label: string; pct: number; strong?: boolean; i: number }) => (
    <div>
      <div className="flex justify-between" style={{ ...txt, fontSize: "0.95cqw" }}><span>{label}</span><span style={{ fontVariantNumeric: "tabular-nums", color: strong ? T.brown : T.muted, fontWeight: 700 }}>{pct}%</span></div>
      <div style={{ marginTop: "0.5cqw", height: "0.7cqw", borderRadius: 999, background: `${T.brown}1A`, overflow: "hidden" }}>
        <motion.div initial={{ width: "0%" }} animate={{ width: `${pct * 1.6}%` }} transition={{ delay: 0.6 + i * 0.2, duration: 0.8, ease: EASE }}
          style={{ height: "100%", borderRadius: 999, background: strong ? `${T.muted}73` : `linear-gradient(90deg, ${T.gold}, ${T.gold2})` }} />
      </div>
    </div>
  );
  return (
    <Statement kicker="Правило первых 3 секунд" title={<>Одна фраза-обещание на <Em>4–6 слов</Em></>} size="3.3cqw">
      <div className="flex flex-wrap gap-[0.7cqw]">
        {rules.map((r, i) => (
          <Stagger key={r} i={i}><span style={{ ...card, borderRadius: 999, padding: "0.8cqw 1.4cqw", display: "inline-block", ...txt, fontWeight: 700, fontSize: "1.15cqw" }}>{r}</span></Stagger>
        ))}
      </div>
      <Stagger i={3} style={{ ...card, padding: "1.4cqw 1.6cqw", marginTop: "1.6cqw", maxWidth: "40cqw" }}>
        <div style={{ ...txt, fontWeight: 700, marginBottom: "1cqw" }}>Тот же голос, два монтажа. Сколько пролистали сразу:</div>
        <div className="grid gap-[0.9cqw]">
          <Bar i={0} label="Оригинал" pct={34} />
          <Bar i={1} label="Красивый перемонтаж" pct={49} strong />
        </div>
      </Stagger>
      <Note>Красота не спасает слабое начало. Данные моей статистики Instagram</Note>
    </Statement>
  );
}

/** 16 · Из 14 залетел 1 → 30 роликов в месяц. */
export function M_OneOf14() {
  return (
    <Statement obj="lg-s16-phones" objSize="4.6cqw" kicker="Моя статистика" title={<>Из 14 рилсов залетел 1. Поэтому <Em>30 роликов в месяц</Em></>} size="2.85cqw"
      lead="Пробные рилсы сначала видят неподписчики. Показывать ли ролик подписчикам, решаете по первым 72 часам.">
      <div className="flex flex-wrap gap-[0.5cqw]" style={{ maxWidth: "40cqw" }}>
        {Array.from({ length: 14 }, (_, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: i === 9 ? [1, 1.25, 1] : 1 }}
            transition={{ delay: 0.3 + i * 0.03, duration: i === 9 ? 0.8 : 0.3, ease: EASE }}
            style={{ width: "2.3cqw", height: "4cqw", borderRadius: "0.5cqw",
              background: i === 9 ? `linear-gradient(180deg, ${T.gold}, ${T.gold2})` : `${T.brown}24`,
              boxShadow: i === 9 ? `0 10px 24px -10px ${T.gold2}` : "none" }} />
        ))}
      </div>
      <Note>14 рилсов на 19 сентября 2026. Охват никто не гарантирует, количество по системе повышает шансы</Note>
    </Statement>
  );
}

/** Строки промпта печатаются по буквам: одна строка за другой, мигает золотой курсор. */
function Typed({ lines, start = 0.4, cps = 110 }: { lines: string[]; start?: number; cps?: number }) {
  const total = lines.reduce((n, l) => n + l.length, 0);
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0; let t0 = 0;
    const id = setTimeout(() => {
      const tick = (now: number) => {
        if (!t0) t0 = now;
        const k = Math.min(total, Math.floor(((now - t0) / 1000) * cps));
        setN(k);
        if (k < total) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, start * 1000);
    return () => { clearTimeout(id); cancelAnimationFrame(raf); };
  }, [total, start, cps]);
  let left = n;
  return (
    <div className="grid gap-[0.45cqw]">
      {lines.map((l, i) => {
        const shown = l.slice(0, Math.max(0, Math.min(l.length, left)));
        const active = left >= 0 && left <= l.length && n < total;
        left -= l.length;
        if (!shown && !active) return <div key={i} style={{ height: "1.6cqw" }} />;
        return (
          <div key={i} className="flex gap-[0.7cqw]">
            <span style={{ color: T.gold, fontWeight: 700 }}>›</span>
            <span>{shown}{(active || (i === lines.length - 1 && n >= total)) && <span className="animate-pulse" style={{ display: "inline-block", width: "0.55cqw", height: "1.1cqw", marginLeft: "0.15cqw", verticalAlign: "-0.15cqw", background: T.gold }} />}</span>
          </div>
        );
      })}
    </div>
  );
}

/** 17 · Монтажёр живёт на вашем компьютере: терминал в цветах бренда, промпт печатается строками. */
export function M_AgentOnPC() {
  return (
    <Statement kicker="Как это устроено" title={<>Монтажёр теперь живёт <Em>на вашем компьютере</Em></>} size="3cqw"
      lead="Программировать не нужно. Агент сам ставит всё нужное и ведёт по шагам.">
      <div className="flex items-end gap-[1.2cqw]">
        <motion.img src="/montage/obj/s17-laptop.webp" alt="Монтажёр внутри ноутбука" initial={{ opacity: 0, y: "2cqw", scale: 0.94 }} animate={{ opacity: 1, y: "0cqw", scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE }} style={{ width: "10cqw", height: "auto", filter: "drop-shadow(0 20px 30px rgba(42,33,28,.22))" }} />
        <Stagger i={1} style={{ width: "30cqw", borderRadius: 22, overflow: "hidden", background: T.night2, border: `1px solid ${T.nightLine}`, boxShadow: T.shadow }}>
          <div className="flex items-center gap-[0.5cqw]" style={{ padding: "0.8cqw 1.1cqw", borderBottom: `1px solid ${T.nightLine}`, background: T.night }}>
            {[T.gold, T.brownLt, T.nightMuted].map((c) => <span key={c} style={{ width: "0.6cqw", height: "0.6cqw", borderRadius: 99, background: c }} />)}
            <span style={{ width: "0.6cqw" }} />
            <MaskIcon name="claude" color={T.gold} size="1.1cqw" />
            <MaskIcon name="openai_mark" color={T.nightText} size="1.1cqw" />
            <span style={{ ...txt, fontSize: "0.8cqw", color: T.nightMuted, marginLeft: "0.3cqw" }}>Одно сообщение на старте</span>
          </div>
          <div style={{ padding: "1.1cqw 1.3cqw 1.3cqw", ...txt, fontWeight: 600, fontSize: "1.1cqw", color: T.nightText, minHeight: "9.4cqw" }}>
            <Typed lines={["Прочитай навык монтажа и работай только по нему.", "Проведи со мной интервью.", "Финал не собирай, пока я не одобрю кадры и черновик."]} />
          </div>
        </Stagger>
        {/* Мой ролик «Система, на которой Claude монтирует мои ролики» (раздатки 05.10, папка 06): шаги записи, расшифровки и проверки кадров */}
        <Stagger i={2}><Phone video="/montage/reels/ai-system.mp4" src="/montage/reels/ai-system.jpg" width="11cqw" chrome={false} /></Stagger>
      </div>
    </Statement>
  );
}

/** 18 ✦ · 5 шагов: горизонтальная линия, золото бежит по ней, шаги загораются по очереди. */
export function M_FiveSteps() {
  const steps = ["Голос и расшифровка", "Формат и стиль", "Сборка", "Проверка кадров", "Публикация"];
  const T0 = 0.35, DT = 0.32; // когда загорается первый шаг и шаг между ними
  return (
    <Statement kicker="Практика 1 · Порядок работы" title={<>От голоса до ролика: <Em>5 шагов</Em></>} size="3.2cqw">
      <div className="relative" style={{ width: "52cqw", paddingTop: "1.2cqw" }}>
        {/* Линия: подложка и золотое заполнение слева направо */}
        <div className="absolute" style={{ left: "5.2cqw", right: "5.2cqw", top: "3.2cqw", height: "0.3cqw", borderRadius: 4, background: `${T.brown}26` }} />
        <motion.div className="absolute" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: T0, duration: DT * 4, ease: "linear" }}
          style={{ left: "5.2cqw", right: "5.2cqw", top: "3.2cqw", height: "0.3cqw", borderRadius: 4, background: `linear-gradient(90deg, ${T.gold}, ${T.gold2})`, transformOrigin: "left" }} />
        <div className="relative grid grid-cols-5">
          {steps.map((name, i) => (
            <div key={name} className="flex flex-col items-center text-center">
              <motion.div className="flex items-center justify-center"
                initial={{ scale: 0.7, backgroundColor: T.card, color: T.muted }} animate={{ scale: [0.7, 1.15, 1], backgroundColor: [T.card, T.gold, T.gold], color: [T.muted, LT.ink, LT.ink] }}
                transition={{ delay: T0 + i * DT, duration: 0.45, ease: EASE }}
                style={{ width: "4cqw", height: "4cqw", borderRadius: 999, border: `1.5px solid ${T.gold2}`, boxShadow: T.shadowSm, fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.4cqw" }}>
                {i + 1}
              </motion.div>
              <motion.div initial={{ opacity: 0.35, y: "0.4cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: T0 + i * DT, duration: 0.35 }}
                style={{ ...txt, fontWeight: 700, fontSize: "1.1cqw", marginTop: "1cqw", maxWidth: "9cqw" }}>{name}</motion.div>
            </div>
          ))}
        </div>
      </div>
      <Note style={{ marginTop: "2cqw" }}>Агент останавливается и ждёт вашего одобрения на сценарии, кадрах и черновике</Note>
    </Statement>
  );
}

/** 19 · Шаг 1: голос и расшифровка. */
export function M_StepVoice() {
  const words = [["00:00.4", "Монтаж"], ["00:00.9", "перестал"], ["00:01.3", "быть"], ["00:01.6", "ручной"], ["00:02.1", "работой"]];
  return (
    <Statement kicker="Шаг 1" title="Голос и расшифровка" size="3.2cqw" lead="Записываете голос на телефон. Агент расшифровывает каждое слово со временем, чтобы субтитры и графика попали точно.">
      <div style={{ ...card, padding: "1.4cqw 1.6cqw", maxWidth: "46cqw" }}>
        <div className="flex items-center gap-[0.25cqw]" style={{ height: "4cqw" }}>
          {Array.from({ length: 48 }, (_, i) => (
            <motion.div key={i} style={{ width: "0.42cqw", borderRadius: 3, background: i < 30 ? T.gold2 : `${T.brown}40` }}
              animate={{ height: [`${20 + ((i * 37) % 60)}%`, `${35 + ((i * 53) % 65)}%`, `${20 + ((i * 37) % 60)}%`] }}
              transition={{ duration: 1.2 + (i % 5) * 0.15, repeat: Infinity, ease: "easeInOut" }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-[0.5cqw]" style={{ marginTop: "1.2cqw" }}>
          {words.map(([t, w], i) => (
            <motion.div key={t} initial={{ opacity: 0, y: "0.5cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.4 + i * 0.16, duration: 0.3 }}
              style={{ borderRadius: 12, padding: "0.5cqw 0.8cqw", background: T.paper, border: `1px solid ${T.line}` }}>
              <div style={{ fontFamily: "var(--font-manrope)", fontSize: "0.72cqw", color: T.muted, fontVariantNumeric: "tabular-nums" }}>{t}</div>
              <div style={{ ...txt, fontWeight: 700 }}>{w}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </Statement>
  );
}


/**
 * 20 ✦ · Шаг 2: стена из шести моих опубликованных рилсов, смонтированных агентом (видео играют, RESULTS.postedReels),
 * на каждом плашка просмотров. Золотая рамка переходит с ролика на ролик, справа его тема и охват.
 * Раньше здесь были демо-клипы стилей с ножницами: Александр 06.10 попросил живые ролики.
 */
export function M_Styles() {
  const reels = RESULTS.postedReels;
  const n = reels.length;
  const [a, setA] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setA((v) => (v + 1) % n), 2200);
    return () => clearInterval(id);
  }, [n]);
  return (
    <Statement kicker="Шаг 2 · Формат и стиль" title={<>6 форматов и <Em>9 стилей</Em></>} size="2.9cqw" lead="Выбираете по живым примерам, а не по описанию. Это мои ролики, их смонтировал агент."
      leftSize="31cqw" leftOverflow="visible"
      left={
        <div className="grid grid-cols-3" style={{ gap: "0.6cqw", width: "28cqw", marginLeft: "2cqw" }}>
          {reels.map((r, i) => (
            <motion.div key={r.video} className="relative overflow-hidden" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + (i % 3) * 0.06 + Math.floor(i / 3) * 0.06, duration: 0.4, ease: EASE }}
              style={{ aspectRatio: "9 / 16", borderRadius: "0.8cqw", background: T.night2, boxShadow: T.shadowSm }}>
              <video src={`/montage/reels/${r.video}.mp4`} poster={`/montage/reels/${r.video}.jpg`} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0" style={{ padding: "0.45cqw", background: "linear-gradient(transparent, rgba(10,8,7,.55))" }}><Views value={r.views} size="0.78cqw" /></div>
              <div className="absolute inset-0" style={{ borderRadius: "0.8cqw", transition: "box-shadow .35s", boxShadow: i === a ? `inset 0 0 0 0.25cqw ${T.gold}` : `inset 0 0 0 1px ${T.nightLine}` }} />
            </motion.div>
          ))}
        </div>
      }>
      <div style={{ minHeight: "3cqw" }}>
        <AnimatePresence mode="wait">
          <motion.div key={a} initial={{ opacity: 0, y: "0.4cqw" }} animate={{ opacity: 1, y: "0cqw" }} exit={{ opacity: 0, y: "-0.4cqw" }} transition={{ duration: 0.22 }}
            className="inline-flex items-center gap-[0.8cqw]" style={{ ...goldButton, borderRadius: 999, padding: "0.6cqw 1.3cqw", whiteSpace: "nowrap", maxWidth: "100%" }}>
            <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.05cqw" }}>{reels[a].views}</span>
            <span style={{ ...txt, color: LT.ink, fontWeight: 700, fontSize: "0.9cqw" }}>{reels[a].title}</span>
          </motion.div>
        </AnimatePresence>
      </div>
      <Note>Instagram, счётчик просмотров, 05.10.2026</Note>
    </Statement>
  );
}

/** 21 · Шаг 3: агент собирает, правка словами. */
export function M_StepAssemble() {
  return (
    <Statement obj="lg-s21-robot" kicker="Шаг 3" title={<>Агент собирает. Правку просим <Em>словами</Em></>} size="3cqw">
      <div className="flex items-start gap-[1.6cqw]">
        <div style={{ width: "40cqw" }}>
          <div className="grid grid-cols-3 gap-[0.8cqw]">
            {[["Сцены", "По карте монтажа: что на экране в каждую секунду"], ["Субтитры", "По словам, точно под голос"], ["Звук", "Музыка, эффекты и ровная громкость"]].map(([t, d], i) => (
              <Stagger key={t} i={i}><Card title={t} text={d} style={{ height: "100%" }} /></Stagger>
            ))}
          </div>
          <div className="grid gap-[0.6cqw]" style={{ marginTop: "1.4cqw" }}>
            <Stagger i={3} style={{ justifySelf: "end", maxWidth: "80%", borderRadius: "18px 18px 4px 18px", padding: "0.9cqw 1.2cqw", background: "rgba(227,192,123,.16)", border: `1px solid ${T.gold2}66`, ...txt, fontWeight: 500, color: T.nightText }}>
              Сделай первую фразу крупнее и убери мелкие подписи
            </Stagger>
            <Stagger i={5} style={{ justifySelf: "start", maxWidth: "80%", borderRadius: "18px 18px 18px 4px", padding: "0.9cqw 1.2cqw", ...card, ...txt, fontWeight: 500 }}>
              Готово. Собрал новый черновик, проверь кадры
            </Stagger>
          </div>
        </div>
        {/* Мой ролик «Palmier: монтаж обычными командами» (раздатки 05.10, папка 06) */}
        <Stagger i={2}><Phone video="/montage/reels/ai-palmier.mp4" src="/montage/reels/ai-palmier.jpg" width="11cqw" chrome={false} /></Stagger>
      </div>
    </Statement>
  );
}

/** 22 · Готовый ролик: телефон по центру левой зоны; слева подпись, справа чипы. */
export function M_ReadyReel() {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg />} contentClassName="items-center text-center" contentMinWidth={0}>
      <Rise><Kicker>Результат</Kicker></Rise>
      <Rise delay={STEP}><H size="3.4cqw">Готовый ролик</H></Rise>
      <div className="flex items-center justify-center gap-[2cqw]" style={{ marginTop: "2cqw", width: "100%" }}>
        <Stagger i={2} style={{ width: "19cqw", textAlign: "right" }}>
          <p style={{ ...txt, fontWeight: 500, fontSize: "1.15cqw", color: T.muted, lineHeight: 1.45 }}>Графика, субтитры и звук собраны агентом по голосу. Сначала черновик на одобрение, потом финал в 4K.</p>
        </Stagger>
        <motion.div initial={{ opacity: 0, y: "3cqw", rotate: -4 }} animate={{ opacity: 1, y: "0cqw", rotate: 0 }} transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.2 }}>
          {/* Мой ролик «Этот рилс смонтировал не человек» (раздатки 05.10, папка 06) */}
          <Phone video="/montage/reels/ai-notman.mp4" src="/montage/reels/ai-notman.jpg" width="13.4cqw" showTop={false} />
        </motion.div>
        <div className="flex flex-col items-start gap-[0.6cqw]" style={{ width: "15cqw", flexShrink: 0 }}>
          {["Premiere не открывал", "CapCut не открывал", "Правки словами"].map((c, i) => (
            <Stagger key={c} i={3 + i}><span style={{ ...card, display: "inline-block", borderRadius: 999, padding: "0.65cqw 1.2cqw", ...txt, fontWeight: 700, fontSize: "1cqw", whiteSpace: "nowrap" }}>{c}</span></Stagger>
          ))}
        </div>
      </div>
    </SlideLayout>
  );
}

const FORMATS = [
  // full: мой рилс этого формата целиком (public/montage/noface, сдал «Монтаж Reels» 08.10), views: Instagram API на 08.10.2026 (рилсы 1, 2 и 4: на 09.10.2026).
  // 08.10, 14:30 (Александр): четыре формата вместо шести. Подкаст, «Половина и окно в углу» и «Спикер внизу» убраны: это тот же формат, что половина экрана.
  // 09.10 (Александр: «не разбирать один и тот же видос на вебинаре», ТЗ docs/tasks/deck_reels_variety_1009.md): три формата из четырёх сменили рилс, потому что
  // «4 умных коннектора» (120 тыс.) уже разбирается на слайдах с ключами 30, 35 и 44, а у «Карточки спикера» стоял рилс на 3,1 тыс. «Пишет: готово»:
  //   1. Половина экрана: «Джарвис из „Железного человека“ теперь живёт у тебя на компьютере», 9 835 (instagram.com/reel/DdvsAG-NtQb/), face-half-jarvis;
  //   2. Карточка спикера: «Записываешь экран, а выглядит как моушн-дизайн», 9 257 (instagram.com/reel/DeEX0O2gNTu/), face-card-screenstudio;
  //   4. Без лица, голос и графика: «Бесплатные тарифы 34 нейросетей на GitHub», 8 068 (instagram.com/reel/Ddvaf6byKio/), noface-voice-free34.
  // Третий формат (голова-рассказчик) не менялся. Старые файлы face-half-connectors, face-card-unlazy, noface-voice-searchconsole лежат в public/montage/noface.
  // Вернуть из убранных форматов: face-corner-jarvis (9,6 тыс.), face-bottom-github (112 тыс.), face-podcast-dilorom (6,1 тыс.).
  { f: "01-polovina-ekrana", t: "Половина экрана", full: "face-half-jarvis", views: "9,8 тыс." },
  { f: "02-kartochka-spikera", t: "Карточка спикера, как в Screen Studio", full: "face-card-screenstudio", views: "9,3 тыс." },
  { f: "03-bez-lica-golova", t: "Без лица: анимированная голова", noFace: true, full: "noface-puppet-zashita", views: "16,4 тыс." },
  { f: "04-bez-lica-golos", t: "Без лица: голос и графика", noFace: true, full: "noface-voice-free34", views: "8,1 тыс." },
];

/**
 * 23 ✦ · Без лица: четыре формата, ведущий сам включает нужный. Автопереключения нет: клик по пункту или клавиши 1–4 (по длине списка), ↑ и ↓.
 * Старт на третьем формате «Без лица: анимированная голова». Видео в телефоне каждый раз идёт с начала, повторный клик по тому же пункту тоже запускает его заново.
 * Клик и эти клавиши презентацию не листают: цифры и стрелки вверх и вниз общая колода не использует (SlideDeck слушает ← → пробел PageUp PageDown Home End F S).
 */
export function M_NoFace() {
  const [k, setK] = useState(2);
  const [run, setRun] = useState(0); // счётчик включений: новый ключ запускает видео сначала
  const [playing, setPlaying] = useState<number | null>(null); // какой рилс играет со звуком
  const pick = (i: number) => { setK(i); setRun((r) => r + 1); };
  const pickRef = useRef(pick);
  pickRef.current = pick;
  const kRef = useRef(k);
  kRef.current = k;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      const n = FORMATS.length;
      if (/^[1-9]$/.test(e.key) && Number(e.key) <= n) pickRef.current(Number(e.key) - 1);
      else if (e.key === "ArrowDown") pickRef.current((kRef.current + 1) % n);
      else if (e.key === "ArrowUp") pickRef.current((kRef.current + n - 1) % n);
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const cur = FORMATS[k];
  return (
    <Statement obj="lg-s23-noface" kicker="Блог без лица · Форматы" title={<>А если не хочу в кадр? <Em>Можно так</Em></>} size="2.8cqw" leftSize="19cqw"
      left={
        <div className="relative" style={{ width: "13.5cqw", aspectRatio: "9/19" }}>
          <AnimatePresence mode="popLayout">
            <motion.div key={`${cur.f}-${run}`} className="absolute inset-0" initial={{ opacity: 0, scale: 0.92, rotateY: -25 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} exit={{ opacity: 0, scale: 1.04, rotateY: 20 }} transition={{ duration: 0.55, ease: EASE }}>
              <ReelPhone file={cur.full} views={cur.views} width="13.5cqw" i={k} active={playing} setActive={setPlaying} />
            </motion.div>
          </AnimatePresence>
        </div>
      }>
      <style>{`
        .nf-item { cursor: pointer; text-align: left; width: 100%; transition: background .25s, border-color .25s, transform .2s; }
        .nf-item:hover:not([aria-pressed="true"]) { background: ${T.card}; border-color: ${T.gold2}88 !important; }
        .nf-item:active { transform: scale(.985); }
        .nf-item:focus-visible { outline: 2px solid ${T.gold}; outline-offset: 2px; }
      `}</style>
      {/* pointer-events: auto — слой слайда в колоде пропускает клики насквозь, кнопкам их нужно вернуть */}
      <div className="grid gap-[0.5cqw]" style={{ maxWidth: "34cqw", pointerEvents: "auto" }}>
        {FORMATS.map((f, i) => (
          <button key={f.f} type="button" className="nf-item flex items-center gap-[0.9cqw]" aria-pressed={i === k} aria-label={`Формат ${i + 1}: ${f.t}`}
            onClick={(e) => { e.stopPropagation(); pick(i); }}
            style={{ borderRadius: 16, padding: "0.65cqw 1cqw", font: "inherit", background: i === k ? T.card : "transparent", border: `1px solid ${i === k ? T.gold2 : "transparent"}` }}>
            <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "0.9cqw", color: i === k ? T.brown : T.muted }}>{i + 1}</span>
            <span style={{ ...txt, color: i === k ? T.ink : T.muted, fontWeight: i === k ? 700 : 600 }}>{f.t}</span>
            {f.noFace && <span style={{ marginLeft: "auto", borderRadius: 999, padding: "0.25cqw 0.7cqw", ...goldButton, ...txt, color: LT.ink, fontSize: "0.75cqw", fontWeight: 700, whiteSpace: "nowrap" }}>без лица</span>}
          </button>
        ))}
      </div>
      <Note>Мои настоящие рилсы целиком, клик по телефону включает со звуком. Просмотры: Instagram API, 9 октября 2026</Note>
    </Statement>
  );
}
