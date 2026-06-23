"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { PaymentBanks } from "../PaymentBanks";
import { PaymentQRPair } from "../PaymentQRPair";

/**
 * Слайд 133 · QR-1 — внеси предоплату. Текст 1-в-1 STRUCTURE 1758-1766.
 * PLACEHOLDER ASSET: landing/public/payment/kaspi-qr-prepayment.png — скрин Kaspi от Александра.
 */
const STEPS = [
  { n: "Шаг 1", t: "Скан QR справа в Kaspi", d: "или по кнопке под видео" },
  { n: "Шаг 2", t: "Сумма 10 000 ₸", d: "в «Комментарий» — твой НОМЕР ТЕЛЕФОНА" },
  { n: "Шаг 3", t: "Менеджер свяжется сегодня", d: "для оформления полной оплаты" },
];

export function Slide_133_QR1() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="24cqw"
      contentMinWidth={480}
      background={<SlideBg theme="dark" variant="climax" />}
      leftObject={
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3, ease: [0.34, 1.4, 0.64, 1] }} className="relative w-full rounded-2xl overflow-hidden border flex items-center justify-center" style={{ borderColor: "rgba(182,255,0,0.4)", background: "rgba(255,255,255,0.04)" }}>
          <PaymentQRPair kaspiMaxH="50cqh" />
        </motion.div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ЗАКРЕПИ МЕСТО
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(23px, 2.9cqw, 42px)" }}
      >
        ВНЕСИ <span className="text-[#B6FF00] whitespace-nowrap">10 000 ₸</span> ПРЯМО СЕЙЧАС
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/65 text-sm md:text-base mb-5 max-w-xl">
        Сканируй QR справа. Или жми кнопку под видео. 60 секунд — и место за тобой.
      </motion.div>
      <div className="flex flex-col gap-2.5 max-w-xl mb-4">
        {STEPS.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.5 + i * 0.14 }} className="flex items-start gap-3 rounded-lg px-3.5 py-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#B6FF00] shrink-0 mt-0.5 font-bold w-12">{s.n}</span>
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm md:text-base leading-tight">{s.t}</div>
              <div className="text-white/45 text-xs md:text-sm">{s.d}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.1 }} className="text-white/80 text-sm md:text-base mb-4">
        Цена <span className="text-[#B6FF00] font-semibold">290 900 ₸</span> закрепляется сразу после предоплаты.
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.3 }}>
        <PaymentBanks />
      </motion.div>
    </SlideLayout>
  );
}
