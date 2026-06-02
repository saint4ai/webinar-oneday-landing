"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { QrCode, AtSign } from "lucide-react";

/**
 * Слайд 166 · Мой инстаграм. Текст 1-в-1 STRUCTURE 2293-2294.
 * PLACEHOLDER ASSET: QR-код на профиль Instagram @saint4ai → landing/public/payment/ig-qr-saint4ai.png.
 */
export function Slide_166_Instagram() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="30vw"
      contentMinWidth={480}
      background={<SlideBg theme="dark" variant="aura-tl" />}
      leftObject={
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3, ease: [0.34, 1.4, 0.64, 1] }} className="relative w-full rounded-2xl overflow-hidden border border-dashed flex flex-col items-center justify-center gap-3 text-center aspect-square" style={{ borderColor: "rgba(182,255,0,0.4)", background: "rgba(182,255,0,0.04)" }}>
          <QrCode className="w-16 h-16 text-white/30" strokeWidth={1.2} />
          <span className="text-white/45 text-xs font-mono uppercase tracking-[0.1em] px-4">QR · Instagram</span>
          <span className="text-white/25 text-[10px]">ig-qr-saint4ai.png — Александр</span>
        </motion.div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // СОХРАНИТЕ ПРОФИЛЬ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 3.8vw, 56px)" }}
      >
        МОЙ <span className="text-[#B6FF00]">ИНСТАГРАМ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.45, ease: [0.34, 1.3, 0.64, 1] }} className="inline-flex items-center gap-3 self-start rounded-2xl px-5 py-3" style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.4)" }}>
        <AtSign className="w-7 h-7 text-[#B6FF00]" strokeWidth={1.8} />
        <span className="font-bold text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(28px,3vw,48px)" }}>@saint4ai</span>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.8 }} className="text-white/55 text-sm md:text-base mt-4">
        Сканируйте QR слева или ищите по нику в Instagram.
      </motion.div>
    </SlideLayout>
  );
}
