"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { PaymentBanks } from "../PaymentBanks";
import { PaymentQRPair } from "../PaymentQRPair";

/**
 * Слайд 168 · Финальный QR Kaspi. Текст 1-в-1 STRUCTURE 2313-2315.
 * PLACEHOLDER ASSET: тот же Kaspi QR что на Slide 141, но крупнее → landing/public/payment/kaspi-qr-prepayment.png.
 */
export function Slide_168_FinalQR() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="24cqw"
      contentMinWidth={460}
      background={<SlideBg theme="dark" variant="climax" />}
      leftObject={
        <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="relative w-full rounded-2xl overflow-hidden border flex items-center justify-center" style={{ borderColor: "rgba(182,255,0,0.45)", background: "rgba(255,255,255,0.04)" }}>
          <PaymentQRPair kaspiMaxH="48cqh" />
        </motion.div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // ПРЕДОПЛАТА
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(23px, 2.9cqw, 42px)" }}
      >
        КАК ВНЕСТИ <span className="text-[#B6FF00]">ПРЕДОПЛАТУ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/75 text-base md:text-lg mb-4 max-w-xl">
        <span className="text-[#B6FF00] font-semibold">10 000 ₸</span> через Kaspi.
      </motion.div>
      <div className="flex flex-col gap-2 max-w-xl">
        {["Сканируйте QR-код слева", "В сообщении пишите имя и WhatsApp", "Менеджер свяжется с вами сегодня"].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.5 + i * 0.13 }} className="flex items-center gap-2.5 rounded-lg px-3.5 py-2" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#B6FF00" }} />
            <span className="text-white/85 text-sm md:text-base">{s}</span>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.1 }} className="mt-5">
        <PaymentBanks />
      </motion.div>
    </SlideLayout>
  );
}
