"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { PaymentBanks } from "../PaymentBanks";
import { PaymentQRPair } from "../PaymentQRPair";

/**
 * Слайд 148 · QR-3 — финальный шанс взять OTO. Текст 1-в-1 STRUCTURE 2066-2078.
 * PLACEHOLDER ASSET: landing/public/payment/kaspi-qr-prepayment.png.
 */
const OTO = [
  "Обучение «AI-менеджеры в ОП» — 390К",
  "2 договора (на сервисы + AI) — 160К",
  "Секретный спикер App Store / Google Play — 650К",
  "Готовый источник заказов (Telegram-канал) — 100К",
];

export function Slide_148_QR3() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="24cqw"
      contentMinWidth={480}
      background={<SlideBg theme="dark" variant="orange-pain" />}
      leftObject={
        <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="relative w-full rounded-2xl overflow-hidden border flex items-center justify-center" style={{ borderColor: "rgba(182,255,0,0.45)", background: "rgba(255,255,255,0.04)" }}>
          <PaymentQRPair kaspiMaxH="48cqh" />
        </motion.div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#FC5C02] mb-3">
        // ПОСЛЕДНИЙ QR В ЭФИРЕ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(22px, 2.7cqw, 40px)" }}
      >
        УСПЕЙ В <span className="text-[#B6FF00]">24 ЧАСА</span> — ЗАБРАТЬ БОНУСЫ
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/65 text-sm md:text-base mb-4 max-w-xl">
        2 бонуса за предоплату ты уже получаешь. Закрой полную сумму за 24 часа → ещё 5 бонусов (1 300 000 ₸ сверху):
      </motion.div>
      <div className="flex flex-col gap-2 max-w-xl mb-4">
        {OTO.map((o, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.5 + i * 0.12 }} className="flex items-center gap-2.5 rounded-lg px-3.5 py-2" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#B6FF00" }} />
            <span className="text-white/85 text-xs md:text-sm">{o}</span>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.0 }} className="text-white/70 text-sm md:text-base">
        QR справа — внеси <span className="text-[#B6FF00] font-semibold">10К сейчас</span>, менеджер закроет полную оплату до конца дня.
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.2 }} className="mt-4">
        <PaymentBanks />
      </motion.div>
    </SlideLayout>
  );
}
