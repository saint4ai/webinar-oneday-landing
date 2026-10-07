"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Statement } from "../Statement";
import { BOOKING_PRICE, BUNDLE_PRICE, PRODUCTION_PRICE, SEPARATE_PRICE, money, moneyUsd } from "../prices";
import { LT, T, card } from "../theme";
import { EASE, Em, Lead, Note, STEP, glue, txt } from "../ui";

/**
 * Слайд оплаты с двумя QR (Александр, 07.10.2026): «Сделайте два QR-кода. Первый со ссылкой на Каспи, второй для СНГ или других карт мира.
 * Этот QR будет повторяться несколько раз». Один слайд, три варианта текста над QR (variant): production, bundle, final.
 * Вставка в колоду (MontageDeck.tsx): три слайда с разными ключами, например
 *   <M_PayQR key="pay1" variant="production" />  после M_HowToBook (41);
 *   <M_PayQR key="pay2" variant="bundle" />      после M_VcBook (v6);
 *   <M_PayQR key="pay3" variant="final" />       после M_GameBonus (57g) или M_FinalCTA (57).
 * Есть и готовые обёртки M_PayProduction, M_PayBundle, M_PayFinal.
 *
 * QR: public/montage/qr-pay-kaspi.svg (https://pay.kaspi.kz/pay/ub82mpkc) и qr-pay-cis.svg (https://pay.rrllc.ru/onai.academy),
 * сделаны тем же способом, что qr-*.svg финала: путь из квадратов 1×1, поле 4 модуля внутри файла, версия 3, коррекция M.
 * Плиты светлые (LT.paper): тёмные модули на тёмном стекле камера не прочитает.
 * Цены и доллары берутся из prices.ts, поэтому при смене цены слайд пересчитывается сам. Всё в левых 60% кадра.
 */

export type PayVariant = "production" | "bundle" | "final";

/** Ссылки оплаты. Подписи под QR заданы Александром дословно. */
const PAY = [
  { src: "/montage/qr-pay-kaspi.svg", url: "https://pay.kaspi.kz/pay/ub82mpkc", caption: "Предоплата, Казахстан", alt: "QR-код оплаты через Kaspi, предоплата для Казахстана" },
  { src: "/montage/qr-pay-cis.svg", url: "https://pay.rrllc.ru/onai.academy", caption: "Предоплата, СНГ или другие карты мира", alt: "QR-код оплаты для СНГ и других карт мира, предоплата" },
] as const;

/** Текст над QR: кикер, заголовок, строка под ним. Цифры считаются из prices.ts, формулировки заданы Александром. */
function copy(v: PayVariant): { kicker: string; title: ReactNode; lead: string } {
  const prepay = `предоплата ${money(BOOKING_PRICE)} (${moneyUsd(BOOKING_PRICE)}) входит в цену`;
  switch (v) {
    case "production":
      return {
        kicker: "Vibe Production",
        title: <>Закрепите место <Em>{`за ${money(PRODUCTION_PRICE)}`}</Em></>,
        lead: `${moneyUsd(PRODUCTION_PRICE)} · ${prepay}`,
      };
    case "bundle":
      return {
        kicker: "Два курса вместе",
        title: <>Vibe Production + PRO <Em>{`за ${money(BUNDLE_PRICE)}`}</Em></>,
        lead: `${moneyUsd(BUNDLE_PRICE)} вместо ${money(SEPARATE_PRICE)} (${moneyUsd(SEPARATE_PRICE)}) · ${prepay}`,
      };
    case "final":
      return {
        kicker: "Последний шаг",
        title: <>Цена эфира действует <Em>до 23:59</Em></>,
        lead: `Предоплата ${money(BOOKING_PRICE)} (${moneyUsd(BOOKING_PRICE)}) закрепит её за вами`,
      };
  }
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

/** M_PayQR · Оплата: два QR рядом (Казахстан и СНГ или другие карты), призыв оставить имя и телефон в комментариях. */
export function M_PayQR({ variant = "production" }: { variant?: PayVariant }) {
  const c = copy(variant);
  return (
    // lead не передаём в Statement: у него ширина 46cqw, а строка про пакет длиннее и теряла «в цену» на второй строке
    <Statement kicker={c.kicker} title={c.title} size="2.6cqw">
      <Lead style={{ fontSize: "1.2cqw", maxWidth: "54cqw", marginTop: "-0.9cqw", marginBottom: "1.5cqw" }}>{c.lead}</Lead>
      <div className="flex items-start" style={{ gap: "2.4cqw" }}>
        {PAY.map((p, i) => <Plate key={p.src} src={p.src} alt={p.alt} caption={p.caption} i={i} />)}
      </div>
      <motion.div initial={{ opacity: 0, y: "1cqw" }} animate={{ opacity: 1, y: "0cqw" }} transition={{ delay: 0.3 + 3 * STEP, duration: 0.45, ease: EASE }}
        style={{ marginTop: "1.3cqw", maxWidth: "54cqw" }}>
        <div style={{ ...txt, fontWeight: 800, fontSize: "1.7cqw", lineHeight: 1.25, color: T.ink, textWrap: "balance" }}>{glue("После оплаты напишите в комментариях")} <Em>{glue("имя и номер телефона")}</Em></div>
        <Note style={{ marginTop: "0.4cqw", fontSize: "1cqw" }}>Из другой страны? Кнопка оплаты под видео. Тоже оставьте комментарий</Note>
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
