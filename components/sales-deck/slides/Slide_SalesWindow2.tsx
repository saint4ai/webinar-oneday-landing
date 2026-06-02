"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Check } from "lucide-react";

/**
 * Блок H · 2-е окно продаж — сжатый повтор оффера + QR предоплаты. После ProgramRecap, перед 161 (бонусы за просмотр).
 * Дубль-оффер «зайти можно прямо сейчас». QR — тот же kaspi-qr-prepayment.png.
 */
const INCLUDED = [
  "Обучение «Вайбкодинг PRO» — 10 модулей до первого клиента",
  "3 бонуса за предоплату (~199 000 ₸) — бесплатно",
  "Пакет за покупку до конца дня (+600 000 ₸) — бесплатно",
];

export function Slide_SalesWindow2() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="27vw"
      contentMinWidth={520}
      background={<SlideBg theme="dark" variant="climax" />}
      leftObject={
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 1, 0.5, 1] }} className="relative w-full rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: "#fff", aspectRatio: "1/1", boxShadow: "0 30px 80px -30px rgba(0,0,0,0.6), 0 0 60px -24px rgba(182,255,0,0.35)" }}>
          <img src="/payment/kaspi-qr-prepayment.png" alt="Kaspi QR · предоплата 5 000 ₸" className="block object-contain" style={{ maxWidth: "92%", maxHeight: "92%" }} />
        </motion.div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#FC5C02] mb-3 self-start">
        // ПОСЛЕДНЕЕ ОКНО СЕГОДНЯ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3.2vw, 50px)" }}
      >
        ЗАЙТИ МОЖНО <span className="text-[#B6FF00]">ПРЯМО СЕЙЧАС</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.35 }} className="flex items-baseline gap-3 mb-4">
        <span className="text-white/40 line-through tabular-nums" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(18px,1.8vw,26px)" }}>390 000 ₸</span>
        <span className="font-bold tabular-nums" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(30px,3.4vw,52px)", color: "#B6FF00", textShadow: "0 0 50px rgba(182,255,0,0.4)" }}>290 900 ₸</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/45">спеццена эфира</span>
      </motion.div>

      <div className="flex flex-col gap-2 max-w-xl mb-4">
        {INCLUDED.map((t, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.5 + i * 0.13 }} className="flex items-start gap-2.5">
            <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#B6FF00]" strokeWidth={2.8} />
            <span className="text-white/85 text-sm md:text-base leading-snug">{t}</span>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.0 }} className="rounded-xl px-4 py-3 max-w-xl" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}>
        <span className="text-white text-sm md:text-base font-semibold">Предоплата <span className="text-[#B6FF00]">5 000 ₸</span> по QR закрепляет цену. Рассрочка 24 мес — <span className="text-[#B6FF00]">399 ₸/день</span>.</span>
      </motion.div>
    </SlideLayout>
  );
}
