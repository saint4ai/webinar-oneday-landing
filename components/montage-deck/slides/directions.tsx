"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { SlideLayout } from "@/components/sales-deck/SlideLayout";
import { useCountUp } from "@/components/sales-deck/useCountUp";
import { MontageBg } from "../MontageBg";
import { Phone } from "../Phone";
import { Statement } from "../Statement";
import { T, card, goldButton, nightCard } from "../theme";
import { Arrow, EASE, Em, H, Kicker, MaskIcon, Note, Num, Px, Rise, STEP, nb, thousands, txt } from "../ui";
import { DirectPhone } from "./lesson3";

/**
 * Волна 4 (05.10): блок «Обучение» как экскурсия по контент-заводу со слайда 34 — «Ролик → Реклама → Заявка».
 * Каждый модуль — цех: одно превращение (голос → ролик, фото → реклама, комментарий → заявка), одно доказательство цифрой,
 * уроки конвейером внизу. 37w переворачивает карточки опроса со слайда 03, 37v — «сами или с обучением» (паттерн прошлых воркшопов).
 * Раскадровка и тексты: docs/tasks/deck_wave4_directions.md. Всё в левых 60% кадра.
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
      {["Ролик", "Реклама", "Заявка"].map((l, i) => (
        <div key={l} className="flex items-center" style={{ gap: "0.5cqw" }}>
          <motion.span initial={{ opacity: 0, y: "-0.5cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.05 + i * 0.06, duration: 0.35, ease: EASE }}
            style={{ display: "inline-block", borderRadius: 999, padding: "0.45cqw 1.05cqw", ...unb("0.8cqw", i === active ? T.ink : T.muted),
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
              <div style={unb("0.72cqw", last ? T.ink : T.brownLt)}>{no}.{i + 1}</div>
              <div style={{ ...txt, fontSize: "0.88cqw", fontWeight: 700, lineHeight: 1.25, marginTop: "0.3cqw" }}>{l}</div>
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
        <svg viewBox="0 0 24 24" style={{ width: "1.1cqw", height: "1.1cqw" }} fill="none" stroke={T.ink} strokeWidth="2.2" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg>
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

/** Каркас цеха: цепочка, кикер, заголовок-обещание, слева превращение, справа доказательство, внизу конвейер уроков. */
function Shop({ active, kicker, title, visual, side, lessons, conveyorStart }: {
  active: number; kicker: string; title: ReactNode; visual: ReactNode; side: ReactNode; lessons: string[]; conveyorStart: number;
}) {
  return (
    <SlideLayout className="bg-transparent" background={<MontageBg />}>
      <ChainHeader active={active} />
      <Rise><Kicker color={T.accent}>{kicker}</Kicker></Rise>
      <Rise delay={STEP}><H size="2.7cqw" color={T.brown}>{title}</H></Rise>
      <div className="grid items-center" style={{ gridTemplateColumns: "22cqw minmax(0, 1fr)", gap: "2.4cqw", maxWidth: "54cqw", marginTop: "1.6cqw" }}>
        {visual}
        <div className="min-w-0">{side}</div>
      </div>
      <Conveyor no={active + 1} lessons={lessons} start={conveyorStart} />
    </SlideLayout>
  );
}

/* ───────────── 35 · Цех «Ролик»: голос → ролик ───────────── */

export function M_ShopReel() {
  const views = useCountUp(825701, 1.1, 0.8);
  return (
    <Shop active={0} kicker="Модуль 1 · AI-монтаж · 5 уроков" title={<>30 роликов в месяц <Em>без монтажёра</Em></>} conveyorStart={1.5}
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
            <Phone video="/montage/reels/hit-connectors.mp4" src="/montage/reels/hit-connectors.jpg" width="10.8cqw" chrome={false} />
          </motion.div>
          {["графика", "субтитры", "звук"].map((t, i) => (
            <motion.span key={t} className="absolute" style={{ right: "9.9cqw", top: `${8.4 + i * 3.6}cqw` }}
              initial={{ opacity: 0, x: "-1.6cqw", scale: 0.8 }} animate={{ opacity: 1, x: "0cqw", scale: 1 }} transition={{ delay: 1.2 + i * 0.2, type: "spring", stiffness: 320, damping: 18 }}>
              <span style={{ display: "inline-block", borderRadius: 999, padding: "0.45cqw 0.95cqw", whiteSpace: "nowrap", ...goldButton, ...unb("0.8cqw") }}>{t}</span>
            </motion.span>
          ))}
        </div>
      }
      side={
        <>
          <motion.div initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.9, duration: 0.4, ease: EASE }}>
            <Num size="3.4cqw" color={T.brown}>{thousands(views)}</Num>
            <div style={{ ...txt, fontSize: "1cqw", color: T.muted, marginTop: "0.5cqw" }}>просмотров за 30 дней у роликов, собранных так же</div>
          </motion.div>
          <ResultLine delay={1.6}>Результат: первые ролики и план выпуска на месяц</ResultLine>
        </>
      } />
  );
}

/* ───────────── 36 · Цех «Реклама»: фото → реклама ───────────── */

const PRODUCTS = ["lg-i-box", "lg-s38-piggy", "lg-i-stall"];

export function M_ShopAd() {
  // Веер фото товара слева остаётся на месте (это вход), их копии по очереди влетают в телефон справа (это выход)
  const fan = [{ x: 0, y: 5.2, r: -9 }, { x: 2.7, y: 3.8, r: 0 }, { x: 5.3, y: 5.4, r: 9 }];
  const W = 5.4; // ширина полароида, cqw
  const target = { x: 16.6, y: 9.6 }; // центр экрана телефона в координатах блока, cqw
  return (
    <Shop active={1} kicker="Модуль 2 · AI-креатор · 5 уроков, около часа" title={<>Реклама товара из фото, <Em>без камеры и студии</Em></>} conveyorStart={1.7}
      lessons={["Сценарий и два кадра", "Движение между кадрами", "Реклама по шаблону", "Предметная motion-реклама", "Сборка и копия голоса"]}
      visual={
        <div className="relative" style={{ width: "22cqw", height: "20.6cqw" }}>
          {fan.map((f, i) => (
            <motion.div key={i} className="absolute" style={{ left: `${f.x}cqw`, top: `${f.y}cqw`, width: `${W}cqw`, padding: "0.3cqw 0.3cqw 0.95cqw", background: T.paper, borderRadius: 6,
              boxShadow: "0 1cqw 2cqw -1cqw rgba(42,33,28,.35)", border: `1px solid ${T.line}`, zIndex: i === 1 ? 3 : 2 }}
              initial={{ opacity: 0, y: "1.5cqw", rotate: f.r * 2 }} animate={{ opacity: 1, y: "0cqw", rotate: f.r }}
              transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 170, damping: 15 }}>
              <div style={{ aspectRatio: "1", background: T.card, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <img src={`/montage/lego/${PRODUCTS[i]}.webp`} alt="" style={{ width: "86%", height: "auto" }} />
              </div>
            </motion.div>
          ))}
          <div className="absolute" style={{ left: "1.6cqw", top: "13.4cqw", ...txt, fontSize: "0.85cqw", color: T.muted }}>3 фото товара</div>
          {fan.map((f, i) => (
            <motion.img key={`fly-${i}`} src={`/montage/lego/${PRODUCTS[i]}.webp`} alt="" className="absolute" style={{ left: `${f.x + W / 2 - 1.5}cqw`, top: `${f.y + W / 2 - 1.5}cqw`, width: "3cqw", zIndex: 5 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0], x: ["0cqw", "0cqw", `${target.x - f.x - W / 2}cqw`, `${target.x - f.x - W / 2}cqw`], y: ["0cqw", "-0.6cqw", `${target.y - f.y - W / 2}cqw`, `${target.y - f.y - W / 2}cqw`], scale: [0.7, 1, 0.6, 0.3] }}
              transition={{ delay: 0.75 + i * 0.18, duration: 0.85, times: [0, 0.2, 0.8, 1], ease: EASE }} />
          ))}
          <motion.div className="absolute" style={{ right: 0, top: 0 }} initial={{ opacity: 0, y: "2.4cqw", scale: 0.94 }} animate={{ opacity: 1, y: "0cqw", scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 120, damping: 16 }}>
            <PhoneFrame width="10.8cqw">
              <div className="absolute" style={{ left: "6%", top: "4%", zIndex: 2, borderRadius: 999, padding: "0.25cqw 0.6cqw", ...goldButton, ...unb("0.62cqw") }}>9:16</div>
              <motion.div className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.35, duration: 0.5 }}>
                <motion.img src="/montage/lego/lg-i-box.webp" alt="Товар в рекламном ролике" style={{ width: "78%", height: "auto", filter: "drop-shadow(0 1.2cqw 1.4cqw rgba(42,33,28,.3))" }}
                  animate={{ scale: [1, 1.12, 1], y: ["0%", "-3%", "0%"] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
              </motion.div>
              <motion.div className="absolute inset-0" style={{ background: `linear-gradient(105deg, transparent 35%, ${GOLD(0.4)} 50%, transparent 65%)`, backgroundSize: "260% 100%" }}
                initial={{ backgroundPosition: "160% 0" }} animate={{ backgroundPosition: ["160% 0", "-60% 0"] }} transition={{ delay: 1.5, duration: 1.4, repeat: Infinity, repeatDelay: 2.2 }} />
              <motion.div className="absolute flex items-center" style={{ left: "8%", right: "8%", bottom: "5%", gap: "0.4cqw", borderRadius: 12, padding: "0.35cqw 0.5cqw", background: "rgba(20,16,14,.82)" }}
                initial={{ opacity: 0, y: "0.6cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 1.6, duration: 0.35, ease: EASE }}>
                <Wave bars={12} height="1.2cqw" />
                <span style={{ ...txt, fontSize: "0.6cqw", color: T.nightText, whiteSpace: "nowrap" }}>ваш голос</span>
              </motion.div>
            </PhoneFrame>
          </motion.div>
        </div>
      }
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
  { me: true, t: "МОНТАЖ" },
  { t: "Держите гайд: как делать вирусный рилс" },
  { t: "Подсказать, с какого ролика начать под вашу нишу?" },
];

export function M_ShopLead() {
  const leads = useCountUp(101, 1, 1.0);
  return (
    <Shop active={2} kicker="Модуль 3 · Ассистенты и автоматизация · 5 уроков" title={<>Ролик приводит заявку, <Em>агент отвечает в директе</Em></>} conveyorStart={2.0}
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
          <motion.div className="absolute" style={{ right: 0, top: "3.4cqw", width: "8.6cqw", ...card, borderRadius: 16, padding: "0.8cqw 0.9cqw", border: `1.5px solid ${T.gold2}` }}
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
            <Num size="4.4cqw" color={T.brown}>{String(leads)}</Num>
            <div style={{ ...txt, fontSize: "1cqw", color: T.muted, marginTop: "0.5cqw" }}>обращение за 30 дней в моём директе</div>
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
  ["Хочу брать заказы на монтаж", `Заказы на монтаж: рынок платит ${nb("10 000 ₸")} за ролик`, "lg-i-laptopcoins"],
];

export function M_ForYou() {
  const face: CSSProperties = { position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", borderRadius: 24 };
  return (
    <Statement kicker="Вспомните ответ в начале" title={<>Что даст обучение <Em>именно вам</Em></>} size="2.7cqw">
      <div className="grid grid-cols-2 gap-[1cqw]" style={{ maxWidth: "54cqw" }}>
        {FOR_YOU.map(([q, a, ic], i) => (
          <motion.div key={q} initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.25 + i * STEP, duration: 0.4, ease: EASE }}
            style={{ height: "9cqw", perspective: "80cqw" }}>
            <motion.div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}
              initial={{ rotateY: 0 }} animate={{ rotateY: 180 }} transition={{ delay: 0.9 + i * 0.35, duration: 0.65, ease: EASE }}>
              {/* Лицо: как на слайде 03 */}
              <div className="flex items-center" style={{ ...face, ...card, gap: "1.2cqw", padding: "1.2cqw 1.6cqw" }}>
                <span style={{ ...unb("4.6cqw", T.brown), fontVariantNumeric: "tabular-nums", minWidth: "3.4cqw" }}>{i + 1}</span>
                <Px name={ic} size="4.4cqw" bob={false} delay={0.3 + i * STEP} />
                <span style={{ ...txt, fontWeight: 700, fontSize: "1.3cqw", lineHeight: 1.3 }}>{q}</span>
              </div>
              {/* Оборот: результат */}
              <div className="flex flex-col justify-center" style={{ ...face, transform: "rotateY(180deg)", background: GOLD(0.16), border: `1.5px solid ${T.gold2}`, padding: "1.1cqw 1.6cqw", boxShadow: T.shadowSm }}>
                <span style={unb("0.8cqw", T.brownLt)}>{i + 1} · {q}</span>
                <span style={{ ...txt, fontWeight: 700, fontSize: "1.3cqw", lineHeight: 1.3, marginTop: "0.5cqw" }}>{a}</span>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5, duration: 0.5 }}>
        <Note style={{ marginTop: "1.2cqw", fontSize: "0.95cqw" }}>Доход не обещаю: обучение даёт навык, а не гарантию.</Note>
      </motion.div>
    </Statement>
  );
}

/* ───────────── 37v · Сами или с обучением (паттерн Slide_130_WithVsWithout в бренде колоды) ───────────── */

const SOLO = ["Месяцами учите CapCut и Premiere", "Вечер уходит на один ролик", `Монтажёру ${nb("10 000 ₸")} за каждый ролик`, "Застряли, спросить некого"];
const COURSE = ["Готовый движок: 9 стилей и 6 форматов", "Ролик собирает агент, вы утверждаете кадры", "План на 30 роликов в месяц", "Разбор работ в общем чате потока"];

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
