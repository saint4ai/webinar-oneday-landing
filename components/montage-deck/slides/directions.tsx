"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { useCountUp } from "@/components/sales-deck/useCountUp";
import { MontageBg } from "../MontageBg";
import { Phone } from "../Phone";
import { Views } from "../ReelRail";
import { RESULTS } from "../results";
import { Statement } from "../Statement";
import { LT, T, card, goldButton, nightCard } from "../theme";
import { moneyBoth } from "../prices";
import { Arrow, EASE, Em, H, Kicker, MaskIcon, Note, Num, Px, Rise, STEP, Stagger, glueNode, nb, thousands, txt } from "../ui";
import { DirectPhone } from "./lesson3";

/**
 * Волна 4 (05.10): блок «Обучение» как экскурсия по контент-заводу со слайда 34 — «Ролик → Реклама → Заявка».
 * Каждый модуль — цех: одно превращение (голос → ролик, фото → реклама, комментарий → заявка), одно доказательство цифрой,
 * уроки конвейером внизу. 37w переворачивает карточки опроса со слайда 03, 37v — «сами или с обучением» (паттерн прошлых воркшопов).
 * Раскадровка и тексты: docs/tasks/deck_wave4_directions.md. Всё в левых 60% кадра.
 * 08.10 (решение Александра): модулей по-прежнему три, меняется порядок. Модуль 1 AI-монтаж (35), модуль 2 ассистенты и автоматизация (37),
 * модуль 3 AI-креатор (36): он же бонус за покупку до конца дня, в колоде стоит после рассрочки 39 и слайда bon (slides/pipeline.tsx).
 */

const unb = (size: string, color: string = T.ink): CSSProperties => ({ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: size, lineHeight: 1, color });
const GOLD = (a: number) => `rgba(227,192,123,${a})`;
const LINE = "rgba(160,83,42,0.2)";
const GOLD2 = "rgba(201,160,90,1)";

const CheckIcon = ({ color = T.gold2, size = "1.15cqw" }: { color?: string; size?: string }) => (
  <svg viewBox="0 0 24 24" style={{ width: size, height: size, flexShrink: 0 }} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
const CrossIcon = ({ color = T.brownLt, size = "1.05cqw" }: { color?: string; size?: string }) => (
  <svg viewBox="0 0 24 24" style={{ width: size, height: size, flexShrink: 0 }} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></svg>
);

/** Цепочка завода над кикером: текущий цех золотой, пройденные связки золотые. */
function ChainHeader({ active }: { active: number }) {
  return (
    <div className="flex items-center" style={{ gap: "0.5cqw", marginBottom: "1.3cqw" }}>
      {["Ролик", "Заявка", "Реклама"].map((l, i) => (
        <div key={l} className="flex items-center" style={{ gap: "0.5cqw" }}>
          <motion.span initial={{ opacity: 0, y: "-0.5cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.05 + i * 0.06, duration: 0.35, ease: EASE }}
            style={{ display: "inline-block", borderRadius: 999, padding: "0.45cqw 1.05cqw", ...unb("0.8cqw", i === active ? LT.ink : T.muted),
              ...(i === active ? goldButton : { border: `1px solid ${T.line}` }) }}>
            {l}
          </motion.span>
          {i < 2 && <span style={{ width: "1.6cqw", height: 2, borderRadius: 2, background: i < active ? T.gold2 : T.line }} />}
        </div>
      ))}
    </div>
  );
}

/** Уроки модуля конвейером: плашки загораются по очереди, последняя — золотая. */
function Conveyor({ no, lessons, start }: { no: number; lessons: string[]; start: number }) {
  return (
    <div className="flex items-stretch" style={{ maxWidth: "54cqw", marginTop: "1.6cqw" }}>
      {lessons.map((l, i) => {
        const last = i === lessons.length - 1;
        const t = start + i * 0.15;
        return (
          <div key={l} className="flex items-center" style={{ flex: 1, minWidth: 0 }}>
            <motion.div initial={{ opacity: 0.4, backgroundColor: GOLD(0), borderColor: LINE }} animate={{ opacity: 1, backgroundColor: last ? GOLD(1) : GOLD(0.16), borderColor: GOLD2 }}
              transition={{ delay: t, duration: 0.3, ease: EASE }}
              style={{ flex: 1, minWidth: 0, alignSelf: "stretch", borderRadius: 14, borderWidth: 1.5, borderStyle: "solid", padding: "0.55cqw 0.75cqw" }}>
              <div style={unb("0.72cqw", last ? LT.ink : T.brownLt)}>{no}.{i + 1}</div>
              <div style={{ ...txt, fontSize: "0.88cqw", fontWeight: 700, lineHeight: 1.25, marginTop: "0.3cqw", ...(last ? { color: LT.ink } : null) }}>{l}</div>
            </motion.div>
            {!last && <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: t + 0.12, duration: 0.15 }}
              style={{ width: "0.55cqw", height: 2, background: T.gold2, transformOrigin: "left", flexShrink: 0 }} />}
          </div>
        );
      })}
    </div>
  );
}

/** Живая волна голоса: столбики дышат с разной частотой. */
function Wave({ bars = 16, height = "1.9cqw", color = T.gold }: { bars?: number; height?: string; color?: string }) {
  return (
    <div className="flex items-center" style={{ height, gap: "0.16cqw", flex: 1 }}>
      {Array.from({ length: bars }, (_, i) => (
        <motion.span key={i} style={{ width: "0.22cqw", borderRadius: 2, background: color }}
          animate={{ height: [`${25 + ((i * 37) % 55)}%`, `${45 + ((i * 53) % 55)}%`, `${25 + ((i * 37) % 55)}%`] }}
          transition={{ duration: 0.9 + (i % 5) * 0.14, repeat: Infinity, ease: "easeInOut" }} />
      ))}
    </div>
  );
}

/** Голосовое: тёмная плашка с микрофоном и волной. */
function VoiceNote({ width = "9.4cqw" }: { width?: string }) {
  return (
    <div className="flex items-center" style={{ ...nightCard, width, borderRadius: 18, padding: "0.65cqw 0.8cqw", gap: "0.6cqw" }}>
      <span className="flex items-center justify-center" style={{ width: "2cqw", height: "2cqw", borderRadius: 99, flexShrink: 0, ...goldButton }}>
        <svg viewBox="0 0 24 24" style={{ width: "1.1cqw", height: "1.1cqw" }} fill="none" stroke={LT.ink} strokeWidth="2.2" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg>
      </span>
      <Wave />
    </div>
  );
}

/** Рамка телефона как у Phone, но с любым содержимым экрана. */
function PhoneFrame({ width, children }: { width: string; children: ReactNode }) {
  return (
    <div style={{ width, aspectRatio: "9/16", background: T.night, borderRadius: "1.8cqw", padding: "0.25cqw", boxShadow: `0 0 0 1px ${T.nightLine} inset, ${T.shadow}` }}>
      <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: "1.55cqw", background: T.card }}>{children}</div>
    </div>
  );
}

/** Строка результата: золотая галочка и жирный текст. */
function ResultLine({ delay, children }: { delay: number; children: ReactNode }) {
  return (
    <motion.div className="flex items-start" initial={{ opacity: 0, x: "-0.8cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ delay, duration: 0.4, ease: EASE }}
      style={{ gap: "0.6cqw", marginTop: "1.2cqw", ...txt, fontSize: "1.1cqw", fontWeight: 700, lineHeight: 1.3 }}>
      <span style={{ paddingTop: "0.15cqw" }}><CheckIcon /></span>{children}
    </motion.div>
  );
}

/** Каркас цеха: цепочка (active — какой цех золотой), кикер, заголовок-обещание, слева превращение, справа доказательство, внизу конвейер уроков (no — номер модуля). */
function Shop({ active, no, kicker, title, visual, side, lessons, conveyorStart, visualWidth = "22cqw" }: {
  active: number; no: number; kicker: string; title: ReactNode; visual: ReactNode; side: ReactNode; lessons: string[]; conveyorStart: number; visualWidth?: string;
}) {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg />} contentMinWidth={0}>
      <ChainHeader active={active} />
      <Rise><Kicker color={T.accent}>{kicker}</Kicker></Rise>
      <Rise delay={STEP}><H size="2.7cqw" color={T.brown}>{title}</H></Rise>
      <div className="grid items-center" style={{ gridTemplateColumns: `${visualWidth} minmax(0, 1fr)`, gap: "2.4cqw", maxWidth: "54cqw", marginTop: "1.6cqw" }}>
        {visual}
        <div className="min-w-0">{side}</div>
      </div>
      <Conveyor no={no} lessons={lessons} start={conveyorStart} />
    </SlideLayout>
  );
}

/* ───────────── 35 · Цех «Ролик»: голос → ролик ───────────── */

export function M_ShopReel() {
  const views = useCountUp(RESULTS.totalViewsNum, 1.1, 0.8);
  return (
    <Shop active={0} no={1} kicker="Модуль 1 · AI-монтаж · 5 уроков" title={<>30 роликов в месяц <Em>без монтажёра</Em></>} conveyorStart={1.5}
      lessons={["Рабочее место", "Сценарий и 3 секунды", "Выбор стиля", "Сборка ролика", "Серия роликов"]}
      visual={
        <div className="relative" style={{ width: "22cqw", height: "20.6cqw" }}>
          <motion.div className="absolute" style={{ left: 0, top: "0.6cqw" }} initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.25, duration: 0.45, ease: EASE }}>
            <VoiceNote />
            <div style={{ ...txt, fontSize: "0.85cqw", color: T.muted, marginTop: "0.4cqw", paddingLeft: "0.3cqw" }}>ваш голос</div>
          </motion.div>
          <motion.div className="absolute" style={{ left: "9.8cqw", top: "1.6cqw" }} initial={{ opacity: 0, x: "-0.6cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ delay: 0.65, duration: 0.3, ease: EASE }}>
            <Arrow color={T.gold2} size="1.5cqw" />
          </motion.div>
          <motion.div className="absolute" style={{ right: 0, top: 0 }} initial={{ opacity: 0, y: "3cqw", scale: 0.92 }} animate={{ opacity: 1, y: "0cqw", scale: 1 }}
            transition={{ delay: 0.85, type: "spring", stiffness: 120, damping: 16 }}>
            <div className="relative">
              <Phone video="/montage/reels/hit-semrush.mp4" src="/montage/reels/hit-semrush.jpg" width="10.8cqw" chrome={false} />
              {/* охват этого рилса: счётчик приложения Instagram, 5 октября 2026 (RESULTS.appCovers) */}
              <Views value="118 тыс." size="0.75cqw" style={{ position: "absolute", left: "0.7cqw", bottom: "0.9cqw" }} />
            </div>
          </motion.div>
          {["графика", "субтитры", "звук"].map((t, i) => (
            <motion.span key={t} className="absolute" style={{ right: "11.6cqw", top: `${8.4 + i * 3.6}cqw` }}
              initial={{ opacity: 0, x: "-1.6cqw", scale: 0.8 }} animate={{ opacity: 1, x: "0cqw", scale: 1 }} transition={{ delay: 1.2 + i * 0.2, type: "spring", stiffness: 320, damping: 18 }}>
              <span style={{ display: "inline-block", borderRadius: 999, padding: "0.45cqw 0.95cqw", whiteSpace: "nowrap", ...goldButton, ...unb("0.8cqw", LT.ink) }}>{t}</span>
            </motion.span>
          ))}
        </div>
      }
      side={
        <>
          <motion.div initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.9, duration: 0.4, ease: EASE }}>
            <Num size="3.4cqw" color={T.brown}>{nb(`${views} тыс.`)}</Num>
            <div style={{ ...txt, fontSize: "1cqw", color: T.muted, marginTop: "0.5cqw" }}>просмотров за 30 дней у роликов, собранных так же</div>
          </motion.div>
          <ResultLine delay={1.6}>Результат: первые ролики и план выпуска на месяц</ResultLine>
        </>
      } />
  );
}

/**
 * 35p · Что внутри модуля AI-монтаж (Александр, 09.10): программа обучения не была расписана, люди не понимали, что входит в курс.
 * Пять уроков строками: номер и название, что делаете, справа золотом результат; под ними золотая карточка бонуса.
 * Тексты: docs/tasks/deck_program_1009.md. Всё в левых 60% кадра.
 */
export function M_ReelProgram() {
  const rows: [string, string, string, string][] = [
    ["1", "Рабочее место", "Ставим Claude и систему монтажа по шагам. Терминал не нужен: агент ставит всё сам", "Агент готов монтировать"],
    ["2", "Сценарий и 3 секунды", "Идея по чужим удачным рилсам, текст с сильным началом", "Сценарий, который не пролистывают"],
    ["3", "Выбор стиля", "Форматы с лицом и без, голос свой или нейросети", "Ваш стиль закреплён за агентом"],
    ["4", "Сборка ролика", "Агент собирает графику, субтитры и звук по вашему голосу, вы правите словами", "Готовый рилс"],
    ["5", "Серия роликов", "Несколько рилсов за раз и план выпуска на месяц", "30 роликов в месяц"],
  ];
  return (
    <Statement kicker="Модуль 1 · AI-монтаж" title={<>Что вы сделаете <Em>за 5 уроков</Em></>} size="2.6cqw">
      <div style={{ maxWidth: "56cqw" }}>
        {rows.map(([n, name, what, res], i) => (
          <motion.div key={n} className="grid items-center" initial={{ opacity: 0, x: "-1cqw" }} animate={{ opacity: 1, x: "0cqw" }}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.4, ease: EASE }}
            style={{ gridTemplateColumns: "2.4cqw minmax(0, 1fr) 13.5cqw", columnGap: "1.2cqw", padding: "0.75cqw 0", borderBottom: `1px solid ${T.line}` }}>
            <span style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.5cqw", lineHeight: 1, color: T.gold }}>{n}</span>
            <div className="min-w-0">
              <div style={{ ...txt, fontWeight: 800, fontSize: "1.2cqw", lineHeight: 1.25 }}>{glueNode(name)}</div>
              <div style={{ ...txt, fontWeight: 500, fontSize: "0.98cqw", lineHeight: 1.35, color: T.muted, marginTop: "0.2cqw" }}>{glueNode(what)}</div>
            </div>
            <span style={{ ...txt, fontWeight: 800, fontSize: "1.05cqw", lineHeight: 1.3, color: T.gold }}>{glueNode(res)}</span>
          </motion.div>
        ))}
      </div>
      <Stagger i={0} base={1}
        style={{ ...card, maxWidth: "56cqw", marginTop: "1.2cqw", borderRadius: 22, padding: "1cqw 1.6cqw", border: `1px solid ${T.gold2}`, background: `${T.gold}1F` }}>
        <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.1cqw", lineHeight: 1.25, color: T.gold }}>{glueNode("Бонус: моя схема выкладки через пробные рилсы")}</div>
        <div style={{ ...txt, fontWeight: 500, fontSize: "1cqw", lineHeight: 1.4, marginTop: "0.4cqw" }}>
          {glueNode("Во сколько публикую и как тестирую рилс на новой аудитории, прежде чем его увидят подписчики.")}
        </div>
      </Stagger>
    </Statement>
  );
}

/* ───────────── 36 · Цех «Реклама», модуль 3 «AI-креатор»: фото → реклама (с 08.10 бонус за покупку до конца дня) ───────────── */

/**
 * Ролик «Альтернатива рекламы» (public/montage/lessons/alt-ad.mp4, 16:9, 15 с, со звуком, Александр 09.10 вместо видеоурока 2 мин 17 с).
 * Запускается сам при входе на слайд, по кругу, звук приглушён (громкость 0,3). Если браузер не даёт играть со звуком, играет без звука,
 * клик по ролику включает звук или ставит паузу. Клик слайды не листает (stopPropagation). Видеоурок ai-creator-lesson.mp4 лежит рядом:
 * вернуть, поменяв src и poster обратно.
 */
function LessonPlayer() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.volume = 0.3;
    v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
    return () => { v.pause(); };
  }, []);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.muted) { v.muted = false; v.volume = 0.3; if (v.paused) v.play().catch(() => {}); return; }
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };
  return (
    <motion.div initial={{ opacity: 0, y: "2cqw", scale: 0.97 }} animate={{ opacity: 1, y: "0cqw", scale: 1 }} transition={{ delay: 0.25, duration: 0.5, ease: EASE }} style={{ width: "100%", pointerEvents: "auto" }}>
      <div style={{ ...card, borderRadius: 18, overflow: "hidden", boxShadow: T.shadow }}>
        <div className="flex items-center" style={{ gap: "0.4cqw", padding: "0.6cqw 0.9cqw", background: T.night2 }}>
          {[T.gold, T.brownLt, T.nightMuted].map((c) => <span key={c} style={{ width: "0.6cqw", height: "0.6cqw", borderRadius: 99, background: c }} />)}
        </div>
        <div className="relative" style={{ aspectRatio: "16 / 9", background: "#000" }}>
          <video ref={ref} src="/montage/lessons/alt-ad.mp4" poster="/montage/lessons/alt-ad.jpg" preload="auto" playsInline loop
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
            className="absolute inset-0 h-full w-full" style={{ objectFit: "contain", background: "#000" }} />
          <button type="button" aria-label={playing ? "Пауза" : "Воспроизвести видеоурок"} aria-pressed={playing}
            onClick={(e) => { e.stopPropagation(); toggle(); }}
            className="absolute inset-0 flex items-center justify-center" style={{ cursor: "pointer", background: playing ? "transparent" : "rgba(10,8,7,.28)", border: 0, padding: 0, transition: "background .25s" }}>
            {!playing && (
              <span className="flex items-center justify-center" style={{ width: "5cqw", height: "5cqw", borderRadius: 999, ...goldButton, boxShadow: `0 1cqw 2.4cqw -0.8cqw ${T.gold2}` }}>
                <svg viewBox="0 0 24 24" style={{ width: "2cqw", height: "2cqw", marginLeft: "0.25cqw" }} fill={LT.ink}><path d="M8 5v14l11-7z" /></svg>
              </span>
            )}
          </button>
        </div>
      </div>
      <div style={{ ...txt, fontSize: "0.95cqw", color: T.muted, marginTop: "0.6cqw" }}>Реклама из модуля AI-креатор</div>
    </motion.div>
  );
}

export function M_ShopAd() {
  return (
    <Shop active={2} no={3} kicker="Модуль 3 · AI-креатор · бонус, если купите до конца дня" title={<>Реклама товара из фото, <Em>без камеры и студии</Em></>} conveyorStart={1.7}
      lessons={["Сценарий и два кадра", "Движение между кадрами", "Реклама по шаблону", "Предметная motion-реклама", "Сборка и копия голоса"]}
      visualWidth="30cqw" visual={<LessonPlayer />}
      side={
        <>
          {["Копия вашего голоса для озвучки", "Ролики на заказ для клиентов"].map((t, i) => (
            <motion.div key={t} className="flex items-start" initial={{ opacity: 0, x: "-0.8cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ delay: 0.9 + i * 0.15, duration: 0.4, ease: EASE }}
              style={{ gap: "0.6cqw", marginTop: i ? "0.8cqw" : 0, ...txt, fontSize: "1.2cqw", fontWeight: 700, lineHeight: 1.3 }}>
              <span style={{ paddingTop: "0.2cqw" }}><CheckIcon /></span>{t}
            </motion.div>
          ))}
          <ResultLine delay={1.5}>Результат: рекламный ролик 9:16 вашего товара</ResultLine>
        </>
      } />
  );
}

/* ───────────── 37 · Цех «Заявка»: комментарий → заявка ───────────── */

// Короткая версия переписки со слайда 45: в узкий телефон длинные сообщения не влезают
const LEAD_MSGS = [
  { me: true, t: "ГАЙД" },
  { t: "Держите гайд: как делать вирусный рилс" },
  { t: "Подсказать, с какого ролика начать под вашу нишу?" },
];

export function M_ShopLead() {
  // total хранится строкой с пробелом («2 218», results.ts): Number("2 218") давал NaN на слайде 37, берём только цифры
  const leads = useCountUp(Number(String(RESULTS.inquiries.total).replace(/\D/g, "")), 1, 1.0);
  return (
    <Shop active={1} no={2} kicker="Модуль 2 · Ассистенты и автоматизация · 5 уроков" title={<>Ролик приводит заявку, <Em>агент отвечает в директе</Em></>} conveyorStart={2.0}
      lessons={["Вайбкодинг в личных делах", "ИИ-менеджер в WhatsApp и Instagram", "Автоматизация процессов", "Документы и презентации", "Контент-завод целиком"]}
      visual={
        <div className="relative" style={{ width: "22cqw", height: "22.8cqw" }}>
          <motion.div className="absolute" style={{ left: 0, top: 0 }} initial={{ opacity: 0, y: "2.4cqw", rotate: -3 }} animate={{ opacity: 1, y: "0cqw", rotate: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.1 }}>
            <DirectPhone msgs={LEAD_MSGS} step={0.45} width="12cqw" />
          </motion.div>
          <motion.div className="absolute" style={{ left: "12.6cqw", top: "1.4cqw" }} initial={{ opacity: 0, x: "-0.6cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ delay: 1.35, duration: 0.3, ease: EASE }}>
            <Arrow color={T.gold2} size="1.4cqw" />
          </motion.div>
          <motion.div className="absolute" style={{ ...card, position: "absolute", right: 0, top: "3.4cqw", width: "8.6cqw", borderRadius: 16, padding: "0.8cqw 0.9cqw", border: `1.5px solid ${T.gold2}` }}
            initial={{ opacity: 0, y: "-2.6cqw", scale: 0.92 }}
            animate={{ opacity: 1, y: "0cqw", scale: 1, boxShadow: [`0 0 0 0cqw ${GOLD(0.55)}`, `0 0 0 0.9cqw ${GOLD(0)}`] }}
            transition={{ delay: 1.5, type: "spring", stiffness: 160, damping: 16, boxShadow: { delay: 1.8, duration: 1.2 } }}>
            <div className="flex items-center" style={{ gap: "0.4cqw" }}>
              <MaskIcon name="telegram" color={T.brownLt} size="1.1cqw" />
              <span style={{ ...txt, fontSize: "0.72cqw", color: T.muted }}>Telegram</span>
            </div>
            <div style={{ ...txt, fontSize: "0.98cqw", fontWeight: 700, lineHeight: 1.3, marginTop: "0.45cqw" }}>Новая заявка из рилса</div>
          </motion.div>
        </div>
      }
      side={
        <>
          <motion.div initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.9, duration: 0.4, ease: EASE }}>
            <Num size="4.4cqw" color={T.brown}>{thousands(leads)}</Num>
            <div style={{ ...txt, fontSize: "1cqw", color: T.muted, marginTop: "0.5cqw" }}>человек написали в директ за 30 дней</div>
          </motion.div>
          <ResultLine delay={1.7}>Результат: воронка от ролика до заявки</ResultLine>
        </>
      } />
  );
}

/* ───────────── 37w · Что даст обучение именно вам: карточки опроса 03 переворачиваются ───────────── */

const FOR_YOU: [string, string, string][] = [
  ["Эксперт, у меня свой продукт", "Ролики и реклама своего продукта без команды", "lg-i-stall"],
  ["Не хочу сниматься сам", "Ролики без камеры: формат без лица и ваш голос", "lg-i-camera"],
  ["SMM, делаю рилсы для клиентов", "Монтаж клиентам собирает агент, вы утверждаете кадры", "lg-i-phones"],
  ["Хочу брать заказы на монтаж", "Заказы на монтаж", "lg-i-laptopcoins"],
];

/**
 * 37w · Карточки стоят лицом «Кто вы» (вопрос опроса 03). Автоматического переворота нет: ведущий переворачивает карточку кликом или цифрой 1–4,
 * повторный клик возвращает вопрос. Цифры общая колода не использует (SlideDeck слушает ← → пробел PageUp PageDown Home End F S), клик слайды не листает.
 */
export function M_ForYou() {
  const [open, setOpen] = useState<boolean[]>(() => FOR_YOU.map(() => false));
  const flip = (i: number) => setOpen((o) => o.map((v, j) => (j === i ? !v : v)));
  const flipRef = useRef(flip);
  flipRef.current = flip;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (!/^[1-4]$/.test(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
      flipRef.current(Number(e.key) - 1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const face: CSSProperties = { position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", borderRadius: 24 };
  return (
    <Statement kicker="Вспомните ответ в начале" title={<>Что даст обучение <Em>именно вам</Em></>} size="2.7cqw">
      <style>{`
        .fy-card[aria-pressed="false"]:hover .fy-front, .fy-card[aria-pressed="true"]:hover .fy-back { outline: 1.5px solid ${T.gold2}; outline-offset: -1.5px; }
        .fy-card:focus-visible { outline: 2px solid ${T.gold}; outline-offset: 4px; border-radius: 24px; }
      `}</style>
      {/* pointer-events: auto — слой слайда в колоде пропускает клики насквозь, карточкам-кнопкам их нужно вернуть */}
      <div className="grid grid-cols-2 gap-[1cqw]" style={{ maxWidth: "54cqw", pointerEvents: "auto" }}>
        {FOR_YOU.map(([q, a, ic], i) => (
          <motion.button key={q} type="button" className="fy-card" aria-pressed={open[i]} aria-label={`${i + 1}. ${q}`}
            onClick={(e) => { e.stopPropagation(); flip(i); }}
            initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.25 + i * STEP, duration: 0.4, ease: EASE }}
            style={{ display: "block", width: "100%", height: "9cqw", perspective: "80cqw", padding: 0, border: 0, background: "none", font: "inherit", color: "inherit", textAlign: "left", cursor: "pointer" }}>
            <motion.div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}
              initial={false} animate={{ rotateY: open[i] ? 180 : 0 }} transition={{ duration: 0.7, ease: EASE }}>
              {/* Лицо: как на слайде 03 */}
              <div className="fy-front flex items-center" style={{ ...face, ...card, gap: "1.2cqw", padding: "1.2cqw 1.6cqw" }}>
                <span style={{ ...unb("4.6cqw", T.brown), fontVariantNumeric: "tabular-nums", minWidth: "3.4cqw" }}>{i + 1}</span>
                <Px name={ic} size="4.4cqw" bob={false} delay={0.3 + i * STEP} />
                <span style={{ ...txt, fontWeight: 700, fontSize: "1.3cqw", lineHeight: 1.3 }}>{q}</span>
              </div>
              {/* Оборот: результат */}
              <div className="fy-back flex flex-col justify-center" style={{ ...face, transform: "rotateY(180deg)", background: GOLD(0.16), border: `1.5px solid ${T.gold2}`, padding: "1.1cqw 1.6cqw", boxShadow: T.shadowSm }}>
                <span style={unb("0.8cqw", T.brownLt)}>{i + 1} · {q}</span>
                <span style={{ ...txt, fontWeight: 700, fontSize: "1.3cqw", lineHeight: 1.3, marginTop: "0.5cqw" }}>{a}</span>
              </div>
            </motion.div>
          </motion.button>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5, duration: 0.5 }}>
        <Note style={{ marginTop: "1.2cqw", fontSize: "0.95cqw" }}>Доход не обещаю: обучение даёт навык, а не гарантию.</Note>
      </motion.div>
    </Statement>
  );
}

/* ───────────── 37v · Сами или с обучением (паттерн Slide_130_WithVsWithout в бренде колоды) ───────────── */

// 09.10 Александр: сами учиться монтажу в Claude (у него ушло 2 месяца) или со мной: 7 дней на моих шаблонах, 30 дней обучения и обратной связи
const SOLO = ["Учитесь сами: у меня ушло 2 месяца, хотя у меня опыт", "Сами ищете навыки для Claude и дообучаете его", `Монтажёру ${moneyBoth(10000)} за каждый ролик`, "Застряли, спросить некого"];
const COURSE = ["За 7 дней первые ролики на моих шаблонах", "Ролик собирает агент, вы утверждаете кадры", "План на 30 роликов в месяц", "30 дней обучения и обратной связи по курсу"];

export function M_SoloVsCourse() {
  return (
    <Statement kicker="Как вы будете двигаться" title={<>Сами или <Em>с обучением</Em></>} size="3cqw">
      <div className="grid grid-cols-2 gap-[1.6cqw]" style={{ maxWidth: "54cqw" }}>
        <motion.div initial={{ opacity: 0, x: "-2cqw" }} animate={{ opacity: [0, 1, 1, 0.6], x: ["-2cqw", "0cqw", "0cqw", "0cqw"] }}
          transition={{ delay: 0.3, duration: 2.1, times: [0, 0.25, 0.75, 1], ease: EASE }}
          style={{ ...card, background: T.paper, padding: "1.4cqw 1.5cqw" }}>
          <div style={unb("1.3cqw", T.muted)}>Сами</div>
          <div className="grid" style={{ gap: "0.9cqw", marginTop: "1.1cqw" }}>
            {SOLO.map((t, i) => (
              <motion.div key={t} className="flex items-start" style={{ gap: "0.6cqw", ...txt, fontSize: "1.1cqw", color: T.muted, lineHeight: 1.3 }}
                initial={{ opacity: 0, y: "0.6cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.55 + i * 0.18, duration: 0.35, ease: EASE }}>
                <span style={{ paddingTop: "0.2cqw" }}><CrossIcon /></span>{t}
              </motion.div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: "2cqw" }} animate={{ opacity: 1, x: "0cqw" }} transition={{ delay: 0.6, duration: 0.55, ease: EASE }}
          style={{ ...card, padding: "1.4cqw 1.5cqw", border: `1.5px solid ${T.gold2}`, boxShadow: `0 1.6cqw 3cqw -1.6cqw ${T.gold2}` }}>
          <div style={unb("1.3cqw", T.brown)}>С Vibe Production</div>
          <div className="grid" style={{ gap: "0.9cqw", marginTop: "1.1cqw" }}>
            {COURSE.map((t, i) => (
              <motion.div key={t} className="flex items-start" style={{ gap: "0.6cqw", ...txt, fontSize: "1.1cqw", fontWeight: 700, lineHeight: 1.3 }}
                initial={{ opacity: 0, y: "0.6cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.85 + i * 0.18, duration: 0.35, ease: EASE }}>
                <span style={{ paddingTop: "0.2cqw" }}><CheckIcon /></span>{t}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      <Rise delay={2.0}><div style={{ ...txt, fontSize: "1.15cqw", fontWeight: 700, color: T.brown, marginTop: "1.4cqw" }}>Навык и движок остаются у вас после обучения.</div></Rise>
    </Statement>
  );
}
