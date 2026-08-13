"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";

/**
 * W60 · Возражение «не хочу брать рассрочку».
 *
 * Своя вёрстка, не через ObjectionSlide: тот компонент рисует сквозную плашку
 * «ВОЗРАЖЕНИЕ N / 4», а в часовой версии состав возражений другой и нумерация
 * не сходится. Компонент общий с трёхчасовой декой — править его нельзя.
 */

export function W60_ObjInstallment() {
  return (
    <SlideLayout
      speakerSide="right"
      background={
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(720px 520px at 74% 8%, rgba(182,255,0,0.11), transparent 66%), radial-gradient(520px 430px at 6% 90%, rgba(252,92,2,0.08), transparent 70%)",
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
          «НЕ ХОЧУ БРАТЬ <span style={{ color: "#FC5C02" }}>РАССРОЧКУ</span>»
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-5 leading-snug max-w-3xl"
          style={{ color: "rgba(255,255,255,0.7)", fontSize: "clamp(15px,1.4cqw,25px)" }}
        >
          Понимаю. Тогда сравните, на что вы её обычно берёте — и на что берёте сейчас.
        </motion.p>

        <div className="mt-7 grid gap-4" style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className="rounded-2xl px-6 py-6 flex flex-col"
            style={{ background: "rgba(252,92,2,0.07)", border: "1px solid rgba(252,92,2,0.32)" }}
          >
            <div
              className="font-mono uppercase tracking-[0.14em] mb-3"
              style={{ color: "#FC5C02", fontSize: "clamp(10px,0.85cqw,13px)" }}
            >
              Рассрочка, которая забирает
            </div>
            <div
              className="font-semibold text-white leading-tight"
              style={{ fontSize: "clamp(17px,1.6cqw,29px)" }}
            >
              Новый телефон, техника, отпуск
            </div>
            <div
              className="mt-3 leading-snug"
              style={{ color: "rgba(255,255,255,0.58)", fontSize: "clamp(14px,1.2cqw,21px)" }}
            >
              Платите год, а вещь дешевеет с первого дня. В конце остаётся только чек.
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.78, ease: [0.25, 1, 0.5, 1] }}
            className="rounded-2xl px-6 py-6 flex flex-col"
            style={{ background: "rgba(182,255,0,0.07)", border: "1px solid rgba(182,255,0,0.34)" }}
          >
            <div
              className="font-mono uppercase tracking-[0.14em] mb-3"
              style={{ color: "#B6FF00", fontSize: "clamp(10px,0.85cqw,13px)" }}
            >
              Рассрочка, которая возвращает
            </div>
            <div
              className="font-semibold text-white leading-tight"
              style={{ fontSize: "clamp(17px,1.6cqw,29px)" }}
            >
              Навык, который остаётся с вами
            </div>
            <div
              className="mt-3 leading-snug"
              style={{ color: "rgba(255,255,255,0.65)", fontSize: "clamp(14px,1.2cqw,21px)" }}
            >
              Один заказ на стороне закрывает её целиком. Дальше он работает только на вас.
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 1.05, ease: [0.25, 1, 0.5, 1] }}
          className="mt-7 rounded-2xl px-6 py-5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <div
            className="font-semibold leading-tight text-white"
            style={{ fontSize: "clamp(16px,1.55cqw,27px)" }}
          >
            10 000 ₸ в месяц — это меньше, чем вы отдаёте за подписки, которыми почти не
            пользуетесь.
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
