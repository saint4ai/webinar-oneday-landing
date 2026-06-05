"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { PaymentBanks } from "../PaymentBanks";

/**
 * Слайд 141 · Как внести 10 000 ₸. Текст 1-в-1 STRUCTURE 1934-1940.
 * PLACEHOLDER ASSET: landing/public/payment/kaspi-qr-prepayment.png.
 */
const STEPS = [
  { n: "Шаг 1", t: "Сканируй QR в Kaspi", d: "или ссылка в чате под видео" },
  { n: "Шаг 2", t: "Сумма 10 000 ₸", d: "" },
  { n: "Шаг 3", t: "В «Комментарий» — НОМЕР ТЕЛЕФОНА", d: "" },
  { n: "Шаг 4", t: "Менеджер свяжется сегодня", d: "оформит полную оплату" },
];

export function Slide_141_HowToPay() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="30vw"
      contentMinWidth={480}
      background={<SlideBg theme="dark" variant="climax" />}
      leftObject={
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3, ease: [0.34, 1.4, 0.64, 1] }} className="relative w-full rounded-2xl overflow-hidden border flex items-center justify-center" style={{ borderColor: "rgba(182,255,0,0.4)", background: "rgba(255,255,255,0.04)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/payment/kaspi-qr-prepayment.png" alt="Kaspi QR · 10 000 ₸" className="block object-contain" style={{ maxWidth: "100%", maxHeight: "66vh" }} />
        </motion.div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ИНСТРУКЦИЯ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-6"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 4vw, 60px)" }}
      >
        КАК ВНЕСТИ <span className="text-[#B6FF00] whitespace-nowrap">10 000 ₸</span>
      </motion.h1>
      <div className="flex flex-col gap-2.5 max-w-xl">
        {STEPS.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.4 + i * 0.13 }} className="flex items-start gap-3 rounded-lg px-3.5 py-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#B6FF00] shrink-0 mt-0.5 font-bold w-12">{s.n}</span>
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm md:text-base leading-tight">{s.t}</div>
              {s.d && <div className="text-white/45 text-xs md:text-sm">{s.d}</div>}
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.1 }} className="mt-5">
        <PaymentBanks />
      </motion.div>
    </SlideLayout>
  );
}
