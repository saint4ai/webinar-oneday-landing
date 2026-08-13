"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { PaymentQRPair } from "../PaymentQRPair";
import { PaymentBanks } from "../PaymentBanks";

/**
 * W60 · ОПЛАТА И ФИНАЛ — три слайда под одну цену 150 000 ₸.
 *
 * Заменяют слайды трёхчасовой деки, которые продавали предоплату 10 000 ₸,
 * рассрочку от 290 900 ₸ и бонусы за оплату в 24 часа. В часовой версии
 * этих механик нет: одна цена, одна оплата.
 *
 * ⚠️ QR в public/payment/ был сделан под предоплату. Проверить, что он
 * принимает произвольную сумму, либо заменить на QR под 150 000 ₸.
 */

const STEPS = [
  { n: "Шаг 1", t: "Сканируйте QR в Kaspi", d: "или откройте кнопку под видео" },
  { n: "Шаг 2", t: "Предоплата 10 000 ₸", d: "это бронь места, а не вся сумма" },
  { n: "Шаг 3", t: "В «Комментарий» — номер телефона", d: "по нему вас найдёт менеджер" },
  { n: "Шаг 4", t: "Менеджер свяжется сегодня", d: "выберете тариф и оформите остаток" },
];

export function W60_HowToPay() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="30cqw"
      contentMinWidth={480}
      background={<SlideBg theme="dark" variant="climax" />}
      leftObject={
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.34, 1.4, 0.64, 1] }}
          className="relative w-full rounded-2xl overflow-hidden border flex items-center justify-center"
          style={{ borderColor: "rgba(182,255,0,0.4)", background: "rgba(255,255,255,0.04)" }}
        >
          <PaymentQRPair kaspiMaxH="48cqh" />
        </motion.div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ИНСТРУКЦИЯ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-6"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(22px, 2.5cqw, 38px)",
        }}
      >
        КАК <span className="text-[#B6FF00]">ЗАНЯТЬ МЕСТО</span>
      </motion.h1>

      <div className="flex flex-col gap-2.5 max-w-xl">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.4 + i * 0.13 }}
            className="flex items-start gap-3 rounded-lg px-3.5 py-2.5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#B6FF00] shrink-0 mt-0.5 font-bold w-12">
              {s.n}
            </span>
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm md:text-base leading-tight">{s.t}</div>
              {s.d && <div className="text-white/45 text-xs md:text-sm">{s.d}</div>}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.1 }}
        className="mt-5"
      >
        <PaymentBanks />
      </motion.div>
    </SlideLayout>
  );
}

/* ——— Возражение про деньги: без рассрочки и скидок, через цену бездействия ——— */
export function W60_ObjNoMoney() {
  return (
    <SlideLayout
      speakerSide="right"
      background={
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(720px 520px at 74% 8%, rgba(252,92,2,0.10), transparent 66%), radial-gradient(520px 430px at 6% 90%, rgba(182,255,0,0.07), transparent 70%)",
          }}
        />
      }
    >
      <div className="flex flex-col justify-center h-full w-full">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold mb-3"
          style={{ color: "#7E7E7E" }}
        >
          <span style={{ color: "#FC5C02", fontWeight: 700 }}>// </span>ВОЗРАЖЕНИЕ
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
          transition={{ duration: 0.75, delay: 0.12, ease: [0.25, 1, 0.5, 1] }}
          className="font-bold uppercase leading-[1.02] tracking-[-0.02em] text-white"
          style={{
            fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(28px, 3.5cqw, 58px)",
          }}
        >
          «ДОРОГО, СЕЙЧАС НЕТ ТАКИХ ДЕНЕГ»
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-5 leading-snug max-w-3xl"
          style={{ color: "rgba(255,255,255,0.62)", fontSize: "clamp(15px,1.35cqw,23px)" }}
        >
          Считайте не расход, а обмен. Вот что вы отдаёте сейчас каждый месяц:
        </motion.p>

        <div className="mt-6 grid gap-3" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
          {[
            { big: "40+", unit: "часов", small: "уходит на рутину, которую агент закрывает за минуты" },
            { big: "1", unit: "подрядчик", small: "один сайт на заказ стоит дороже всего обучения" },
            { big: "0", unit: "навыка", small: "заплатили за результат — но повторить его сами не можете" },
          ].map((c, i) => (
            <motion.div
              key={c.big}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.62 + i * 0.14, ease: [0.25, 1, 0.5, 1] }}
              className="rounded-2xl px-5 py-5"
              style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.10)" }}
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className="font-bold uppercase leading-none"
                  style={{
                    color: "#FC5C02",
                    fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
                    fontSize: "clamp(22px,2.3cqw,42px)",
                  }}
                >
                  {c.big}
                </span>
                <span
                  className="font-semibold uppercase leading-none"
                  style={{ color: "#FC5C02", fontSize: "clamp(13px,1.15cqw,20px)" }}
                >
                  {c.unit}
                </span>
              </div>
              <div
                className="mt-2.5 leading-snug"
                style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(13px,1.12cqw,20px)" }}
              >
                {c.small}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1, ease: [0.25, 1, 0.5, 1] }}
          className="mt-6 rounded-2xl px-6 py-5"
          style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.3)" }}
        >
          <div
            className="font-mono uppercase tracking-[0.14em] mb-3"
            style={{ color: "#B6FF00", fontSize: "clamp(10px,0.85cqw,13px)" }}
          >
            Можно частями
          </div>
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
            <div>
              <span
                className="font-bold"
                style={{
                  color: "#B6FF00",
                  fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
                  fontSize: "clamp(22px,2.3cqw,42px)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                10 000 ₸
              </span>
              <span
                className="ml-2"
                style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(13px,1.15cqw,20px)" }}
              >
                в месяц · тариф 120 000
              </span>
            </div>
            <div>
              <span
                className="font-bold"
                style={{
                  color: "#B6FF00",
                  fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
                  fontSize: "clamp(22px,2.3cqw,42px)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                12 500 ₸
              </span>
              <span
                className="ml-2"
                style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(13px,1.15cqw,20px)" }}
              >
                в месяц · тариф 150 000
              </span>
            </div>
          </div>
          <div
            className="mt-3 leading-snug text-white font-semibold"
            style={{ fontSize: "clamp(15px,1.4cqw,25px)" }}
          >
            Беспроцентная рассрочка от банков. Обучение окупается{" "}
            <span style={{ color: "#B6FF00" }}>одним заказом</span>.
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}

/* ——— Финальное напоминание: без предоплаты и дедлайнов ——— */
export function W60_FinalReminder() {
  return (
    <SlideLayout
      speakerSide="right"
      background={
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(760px 540px at 72% 6%, rgba(182,255,0,0.13), transparent 66%), radial-gradient(540px 440px at 6% 92%, rgba(252,92,2,0.08), transparent 70%)",
          }}
        />
      }
    >
      <div className="flex flex-col justify-center h-full w-full">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold mb-3"
          style={{ color: "#7E7E7E" }}
        >
          <span style={{ color: "#B6FF00", fontWeight: 700 }}>// </span>ЕСЛИ ЕЩЁ ДУМАЕТЕ
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
          transition={{ duration: 0.75, delay: 0.12, ease: [0.25, 1, 0.5, 1] }}
          className="font-bold uppercase leading-[1.02] tracking-[-0.02em] text-white"
          style={{
            fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(28px, 3.5cqw, 58px)",
          }}
        >
          РЕШАЙТЕ <span style={{ color: "#B6FF00" }}>СПОКОЙНО</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-5 leading-snug max-w-3xl"
          style={{ color: "rgba(255,255,255,0.68)", fontSize: "clamp(16px,1.45cqw,26px)" }}
        >
          Здесь нет таймера и нет цены, которая испарится через час. Оба тарифа стоят
          столько же завтра.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75, ease: [0.25, 1, 0.5, 1] }}
          className="mt-8 rounded-2xl px-6 py-6 max-w-3xl"
          style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.3)" }}
        >
          <div
            className="font-semibold leading-tight text-white"
            style={{ fontSize: "clamp(17px,1.7cqw,30px)" }}
          >
            Единственное, что уходит безвозвратно, — это ваше время.
            <br />
            Каждый месяц без агента вы платите за рутину{" "}
            <span style={{ color: "#B6FF00" }}>своими часами</span>.
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="mt-6 leading-snug"
          style={{ color: "rgba(255,255,255,0.55)", fontSize: "clamp(14px,1.25cqw,22px)" }}
        >
          Остались вопросы — напишите менеджеру, разберём вашу задачу до оплаты.
        </motion.div>
      </div>
    </SlideLayout>
  );
}

/* ——— Финальный QR: полная оплата, без предоплаты ——— */
export function W60_FinalQR() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="30cqw"
      contentMinWidth={460}
      background={<SlideBg theme="dark" variant="climax" />}
      leftObject={
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.34, 1.4, 0.64, 1] }}
          className="relative w-full rounded-2xl overflow-hidden border flex items-center justify-center"
          style={{ borderColor: "rgba(182,255,0,0.4)", background: "rgba(255,255,255,0.04)" }}
        >
          <PaymentQRPair kaspiMaxH="52cqh" />
        </motion.div>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ОПЛАТА
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em]"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(26px, 3cqw, 46px)",
        }}
      >
        ЗАБРАТЬ ДОСТУП
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="mt-4 text-white leading-snug"
        style={{ fontSize: "clamp(16px,1.5cqw,27px)" }}
      >
        Предоплата <span className="text-[#B6FF00] font-semibold">10 000 ₸</span> через Kaspi по QR слева.
        Это бронь места — остальное оформите с менеджером.
      </motion.div>

      <div className="flex flex-col gap-2.5 mt-6 max-w-xl">
        {[
          "Сканируйте QR-код слева",
          "В комментарии — имя и номер WhatsApp",
          "Менеджер свяжется сегодня и оформит тариф",
        ].map((t, i) => (
          <motion.div
            key={t}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.6 + i * 0.13 }}
            className="flex items-start gap-3 rounded-lg px-3.5 py-2.5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span
              aria-hidden
              className="shrink-0 mt-[0.6em]"
              style={{ width: 14, height: 2, background: "#B6FF00" }}
            />
            <span className="text-white leading-snug" style={{ fontSize: "clamp(14px,1.2cqw,21px)" }}>
              {t}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.1 }}
        className="mt-5 leading-snug"
        style={{ color: "rgba(255,255,255,0.5)", fontSize: "clamp(13px,1.1cqw,19px)" }}
      >
        Оплата другой картой или из другой страны — по кнопке под видео.
      </motion.div>
    </SlideLayout>
  );
}
