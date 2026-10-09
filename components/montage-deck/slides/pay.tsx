"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Statement } from "../Statement";
import { BOOKING_PRICE, BUNDLE_PRICE, PRODUCTION_PRICE, SEPARATE_PRICE, money, moneyUsd } from "../prices";
import { LT, T, card, goldButton } from "../theme";
import { EASE, Em, Note, STEP, glue, glueNode, txt } from "../ui";

/**
 * Слайд оплаты с двумя QR (Александр, 07.10.2026): «Сделайте два QR-кода. Первый со ссылкой на Каспи, второй для СНГ или других карт мира.
 * Этот QR будет повторяться несколько раз». Один слайд, три варианта текста над QR (variant): production, bundle, final.
 * С 08.10 в показе только Vibe Production: идут production (после 41) и final (после 57g). Вариант bundle (оба курса, 390 000 ₸)
 * из показа ушёл вместе с блоком Vibe Coding PRO; код оставлен, чтобы его можно было вернуть одной вставкой слайда.
 * Вставка в колоду (MontageDeck.tsx): слайды с разными ключами, например
 *   <M_PayQR key="pay1" variant="production" />  после M_HowToBook (41);
 *   <M_PayQR key="pay3" variant="final" />       после M_GameBonus (57g) или M_FinalCTA (57).
 * Есть и готовые обёртки M_PayProduction, M_PayBundle, M_PayFinal.
 *
 * QR: public/montage/qr-pay-kaspi.svg (https://pay.kaspi.kz/pay/ub82mpkc) и qr-pay-cis.svg (https://pay.rrllc.ru/onai.academy),
 * сделаны тем же способом, что qr-*.svg финала: путь из квадратов 1×1, поле 4 модуля внутри файла, версия 3, коррекция M.
 * Плиты светлые (LT.paper): тёмные модули на тёмном стекле камера не прочитает.
 * Цены и доллары берутся из prices.ts, поэтому при смене цены слайд пересчитывается сам. Всё в левых 60% кадра.
 *
 * 09.10 (Александр: «они не понимают»): предоплата выделена золотой плашкой «Предоплата 10 000 ₸», под QR три нумерованных шага
 * (отсканировать, внести предоплату, оставить в комментарии к оплате имя и телефон). В варианте final над QR ещё живой таймер
 * до 23:59:59 по Алматы с красным свечением. Плашка, золотое выделение и иконка поля комментария экспортируются и для M_HowToBook (sale.tsx).
 */

/** Красный бренда (точка LIVE, #E5472C): читается и на тёмном стекле, и на светлом. */
export const RED = "#E5472C";

export type PayVariant = "production" | "bundle" | "final";

/** Ссылки оплаты. Подписи под QR заданы Александром дословно. */
const PAY = [
  { src: "/montage/qr-pay-kaspi.svg", url: "https://pay.kaspi.kz/pay/ub82mpkc", caption: "Предоплата, Казахстан", alt: "QR-код оплаты через Kaspi, предоплата для Казахстана" },
  { src: "/montage/qr-pay-cis.svg", url: "https://pay.rrllc.ru/onai.academy", caption: "Предоплата, СНГ или другие карты мира", alt: "QR-код оплаты для СНГ и других карт мира, предоплата" },
] as const;

/** Текст над QR: кикер, заголовок, мелкая строка рядом с плашкой предоплаты. Цифры считаются из prices.ts, формулировки заданы Александром. */
function copy(v: PayVariant): { kicker: string; title: ReactNode; sub: string; extra?: string } {
  const inPrice = (price: number) => `${moneyUsd(BOOKING_PRICE)}, входит в цену ${money(price)}`;
  switch (v) {
    case "production":
      return {
        kicker: "Vibe Production",
        title: <>Закрепите место <Em>{`за ${money(PRODUCTION_PRICE)}`}</Em></>,
        sub: inPrice(PRODUCTION_PRICE),
      };
    case "bundle":
      return {
        kicker: "Два курса вместе",
        title: <>Vibe Production + PRO <Em>{`за ${money(BUNDLE_PRICE)}`}</Em></>,
        sub: inPrice(BUNDLE_PRICE),
        extra: `${moneyUsd(BUNDLE_PRICE)} вместо ${money(SEPARATE_PRICE)} (${moneyUsd(SEPARATE_PRICE)})`,
      };
    case "final":
      return {
        kicker: "Последний шаг",
        title: <>Цена эфира действует <Em>до 23:59</Em></>,
        sub: inPrice(PRODUCTION_PRICE),
      };
  }
}

/** Золотое выделение внутри строки: «имя и номер телефона». */
export const Gold = ({ children }: { children: ReactNode }) => <span style={{ color: T.gold }}>{children}</span>;

/** Крупная золотая плашка «Предоплата 10 000 ₸»: сумма из BOOKING_PRICE, текст на золоте тёмный. Въезжает пружиной один раз. */
export function PrepayPlate({ size = "2cqw", delay = 0.2 }: { size?: string; delay?: number }) {
  return (
    <motion.span initial={{ opacity: 0, scale: 0.9, y: "0.6cqw" }} animate={{ opacity: 1, scale: 1, y: "0cqw" }} transition={{ delay, type: "spring", stiffness: 220, damping: 18 }}
      style={{ display: "inline-block", flexShrink: 0, ...goldButton, border: `1px solid ${T.gold2}`, borderRadius: "1.2em", padding: "0.4em 0.8em",
        fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: size, lineHeight: 1.15, letterSpacing: "-.02em", whiteSpace: "nowrap",
        boxShadow: `0 0.9cqw 2.2cqw -1cqw ${T.gold2}, 0 0 1.6cqw ${T.gold}40` }}>
      {`Предоплата ${money(BOOKING_PRICE)}`}
    </motion.span>
  );
}

/** Иконка-подсказка поля комментария к оплате: рамка поля, набранный текст и мигающий курсор (четыре мигания, дальше стоит). */
export function CommentFieldIcon({ width = "4.2cqw", delay = 1.2 }: { width?: string; delay?: number }) {
  return (
    <svg viewBox="0 0 56 28" aria-hidden style={{ width, height: "auto", flexShrink: 0, display: "block" }}>
      <rect x="1.5" y="1.5" width="53" height="25" rx="7" fill={`${T.gold}22`} stroke={T.gold2} strokeWidth="2" />
      <rect x="9" y="11" width="22" height="6" rx="3" fill={T.gold} opacity=".8" />
      <motion.rect x="36" y="7.5" width="2.6" height="13" rx="1.3" fill={T.gold} initial={{ opacity: 1 }} animate={{ opacity: [1, 0, 1] }}
        transition={{ delay, duration: 0.9, repeat: 4, ease: "linear" }} />
    </svg>
  );
}

/** Плита с QR и подписью под ней. Плита белая, QR крупный: код читается камерой телефона с экрана эфира. */
function Plate({ src, alt, caption, i }: { src: string; alt: string; caption: string; i: number }) {
  const delay = 0.3 + i * STEP;
  return (
    <motion.div style={{ width: "19.5cqw" }} initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay, duration: 0.45, ease: EASE }}>
      <motion.div initial={{ rotate: i % 2 ? 3 : -3, scale: 0.94 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: delay + 0.1, type: "spring", stiffness: 180, damping: 15 }}
        style={{ ...card, background: LT.paper, borderRadius: 24, padding: "0.9cqw", boxShadow: T.shadow }}>
        <img src={src} alt={alt} draggable={false} style={{ display: "block", width: "100%", height: "auto" }} />
      </motion.div>
      <div style={{ ...txt, fontWeight: 800, fontSize: "1.3cqw", lineHeight: 1.25, color: T.brown, marginTop: "0.7cqw", textAlign: "center" }}>{caption}</div>
    </motion.div>
  );
}

/** Шаг оплаты: золотой кружок с номером и крупный текст; icon: подсказка справа от текста. */
function PayStep({ n, children, icon }: { n: number; children: ReactNode; icon?: ReactNode }) {
  return (
    <motion.div className="flex items-center" style={{ gap: "1cqw" }} initial={{ opacity: 0, x: "-1.2cqw" }} animate={{ opacity: 1, x: "0cqw" }}
      transition={{ delay: 0.62 + (n - 1) * 0.12, duration: 0.4, ease: EASE }}>
      <span className="flex items-center justify-center" style={{ ...goldButton, width: "2.3cqw", height: "2.3cqw", flexShrink: 0, borderRadius: "50%", border: `1px solid ${T.gold2}`,
        fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "1.1cqw", lineHeight: 1 }}>{n}</span>
      <span style={{ ...txt, fontWeight: 800, fontSize: "1.4cqw", lineHeight: 1.25, color: T.ink, textWrap: "balance" }}>{glueNode(children)}</span>
      {icon}
    </motion.div>
  );
}

/** Секунд до 23:59:59 по Алматы (Asia/Almaty, не по часовому поясу компьютера): момент окончания считаем один раз при показе слайда. */
function almatyDeadline(now: number): number {
  let sec: number;
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Almaty", hourCycle: "h23", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(now));
    const g = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    sec = g("hour") * 3600 + g("minute") * 60 + g("second");
  } catch {
    sec = Math.floor(((now + 5 * 3600_000) % 86_400_000) / 1000); // запасной вариант: Алматы без перехода на летнее время, UTC+5
  }
  return now - (now % 1000) + (86_399 - sec) * 1000;
}

/** Остаток в секундах: тик раз в секунду, после нуля показывает 0 и интервал снят (так же при уходе со слайда). До первого тика null. */
function useDeadlineLeft(): number | null {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const end = almatyDeadline(Date.now());
    const tick = () => {
      const s = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) clearInterval(id);
    };
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, []);
  return left;
}

/** Каждая цифра в ячейке фиксированной ширины: ряд не дрожит, даже если у шрифта цифры пропорциональные. */
const Digit = ({ c }: { c: string }) => <span style={{ display: "inline-block", width: "0.76em", textAlign: "center" }}>{c}</span>;

/** Живой таймер «ЧЧ:ММ:СС до конца предложения»: красный #E5472C, мягкое свечение вокруг плашки, двоеточия мигают раз в секунду. */
function DeadlineTimer() {
  const left = useDeadlineLeft();
  const pad = (n: number) => String(n).padStart(2, "0");
  const t = left == null ? ["--", "--", "--"] : [pad(Math.floor(left / 3600)), pad(Math.floor((left % 3600) / 60)), pad(left % 60)];
  const ticking = left != null && left > 0; // после нуля двоеточия перестают мигать
  const colon = <span style={{ display: "inline-block", width: "0.34em", textAlign: "center", animation: ticking ? "dl-blink 1s ease-in-out infinite" : "none" }}>:</span>;
  return (
    <motion.div role="timer" aria-label={`До конца предложения ${t.join(":")}`} initial={{ opacity: 0, scale: 0.92, y: "0.8cqw" }} animate={{ opacity: 1, scale: 1, y: "0cqw" }}
      transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 18 }}
      style={{ ...card, flexShrink: 0, borderRadius: 22, padding: "0.8cqw 1.5cqw 0.9cqw", textAlign: "center",
        background: "linear-gradient(160deg, rgba(70,20,12,.72), rgba(24,12,10,.88))", border: `1.5px solid ${RED}`,
        boxShadow: `0 0 2.6cqw ${RED}66, inset 0 0 1.4cqw ${RED}2E` }}>
      <style>{`@keyframes dl-blink { 0%, 100% { opacity: 1; } 50% { opacity: .2; } }`}</style>
      <div style={{ fontFamily: "var(--font-unbounded)", fontWeight: 700, fontSize: "2.5cqw", lineHeight: 1.1, letterSpacing: "-.03em", color: RED, whiteSpace: "nowrap",
        textShadow: `0 0 1cqw ${RED}99`, fontVariantNumeric: "tabular-nums" }}>
        {t[0].split("").map((c, i) => <Digit key={i} c={c} />)}{colon}{t[1].split("").map((c, i) => <Digit key={i} c={c} />)}{colon}{t[2].split("").map((c, i) => <Digit key={i} c={c} />)}
      </div>
      <div style={{ ...txt, fontWeight: 700, fontSize: "0.95cqw", color: T.nightText, marginTop: "0.35cqw" }}>до конца предложения</div>
    </motion.div>
  );
}

/** M_PayQR · Оплата: плашка предоплаты, два QR рядом (Казахстан и СНГ или другие карты), три шага: QR, предоплата, имя и телефон в комментарии к оплате. */
export function M_PayQR({ variant = "production" }: { variant?: PayVariant }) {
  const c = copy(variant);
  const sub = <div style={{ ...txt, fontWeight: 600, fontSize: "1.1cqw", lineHeight: 1.35, color: T.muted }}>{glue(c.sub)}</div>;
  return (
    // lead не передаём в Statement: у него ширина 46cqw, а наши строки шире
    <Statement kicker={c.kicker} title={c.title} size="2.6cqw">
      <div style={{ marginTop: "-0.6cqw", marginBottom: "1.3cqw", maxWidth: "54cqw" }}>
        {variant === "final" ? (
          // над QR: слева плашка и мелкая строка под ней, справа таймер
          <div className="flex items-center" style={{ gap: "2cqw" }}>
            <div className="flex flex-col" style={{ gap: "0.5cqw", alignItems: "flex-start" }}>
              <PrepayPlate />
              {sub}
              {c.extra && <Note style={{ marginTop: 0 }}>{c.extra}</Note>}
            </div>
            <DeadlineTimer />
          </div>
        ) : (
          <div className="flex items-center" style={{ gap: "1.4cqw" }}>
            <PrepayPlate />
            <div style={{ maxWidth: "17cqw" }}>{sub}</div>
          </div>
        )}
        {variant !== "final" && c.extra && <Note style={{ marginTop: "0.5cqw" }}>{c.extra}</Note>}
      </div>
      <div className="flex items-start" style={{ gap: "2.4cqw" }}>
        {PAY.map((p, i) => <Plate key={p.src} src={p.src} alt={p.alt} caption={p.caption} i={i} />)}
      </div>
      <div className="flex flex-col" style={{ marginTop: "1.2cqw", maxWidth: "54cqw", gap: "0.55cqw" }}>
        <PayStep n={1}>Отсканируйте QR</PayStep>
        <PayStep n={2}>Внесите предоплату <Gold>{money(BOOKING_PRICE)}</Gold></PayStep>
        <PayStep n={3} icon={<CommentFieldIcon />}>В комментарии к оплате оставьте <Gold>имя и номер телефона</Gold></PayStep>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.05, duration: 0.45, ease: EASE }}>
        <Note style={{ marginTop: "0.9cqw", fontSize: "1cqw" }}>Из другой страны? Кнопка оплаты под видео. Тоже оставьте комментарий</Note>
      </motion.div>
    </Statement>
  );
}

/** Первый показ: сразу после «Как занять место». */
export const M_PayProduction = () => <M_PayQR variant="production" />;
/** Второй показ: после блока Vibe Coding PRO и пакета двух курсов. */
export const M_PayBundle = () => <M_PayQR variant="bundle" />;
/** Третий показ: в самом конце продажи, перед финалом. */
export const M_PayFinal = () => <M_PayQR variant="final" />;
