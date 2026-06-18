"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { PaymentQRPair } from "../PaymentQRPair";

/**
 * Слайд 139 · QR-2 — повтор для тех кто думает. Текст 1-в-1 STRUCTURE 1902-1911.
 * PLACEHOLDER ASSET: landing/public/payment/kaspi-qr-prepayment.png (тот же Kaspi-QR).
 */
export function Slide_139_QR2() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="30vw"
      contentMinWidth={480}
      background={<SlideBg theme="dark" variant="orange-pain" />}
      leftObject={
        <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="relative w-full rounded-2xl overflow-hidden border flex items-center justify-center" style={{ borderColor: "rgba(182,255,0,0.45)", background: "rgba(255,255,255,0.04)" }}>
          <PaymentQRPair kaspiMaxH="48vh" />
        </motion.div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#FC5C02] mb-3">
        // НЕ УПУСТИ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.6vw, 54px)" }}
      >
        ВОТ QR ЕЩЁ РАЗ — <span className="text-[#B6FF00]">НЕ УПУСТИ</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="mb-4">
        <span className="font-bold tabular-nums text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(36px,4.2vw,68px)", textShadow: "0 0 60px rgba(182,255,0,0.4)" }}>290 900 ₸</span>
        <div className="text-white/60 text-sm md:text-base mt-1">закрепляются после 10К предоплаты</div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="text-white/70 text-sm md:text-base leading-snug max-w-xl">
        Решение — в течение 10 минут. Кто внёс предоплату — закрепил место, цену и 4 бонуса. Кто думает «потом» — уйдёт на следующий поток по <span className="text-[#FC5C02] font-semibold">390К</span>.
      </motion.div>
    </SlideLayout>
  );
}
