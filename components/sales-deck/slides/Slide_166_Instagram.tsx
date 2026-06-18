"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { AtSign } from "lucide-react";

/**
 * Слайд 166 · Бонус ЗА ОТМЕТКУ В СТОРИС — мой Instagram + QR.
 * Сверху скрин Instagram, снизу QR для сканирования. Бонус: курс + кураторство.
 */
export function Slide_166_Instagram() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="27vw"
      contentMinWidth={460}
      background={<SlideBg theme="dark" variant="aura-tl" />}
      leftObject={
        <div className="flex flex-col items-center gap-3 w-full">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="w-full rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(182,255,0,0.3)", boxShadow: "0 24px 60px -28px rgba(0,0,0,0.7)", maxWidth: 270 }}>
            <Image src="/handouts/insta-screenshot.png" alt="Instagram @saint4ai" width={1424} height={1038} className="w-full h-auto block" />
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.5 }} className="rounded-2xl overflow-hidden bg-white p-2.5" style={{ border: "1px solid rgba(182,255,0,0.45)", boxShadow: "0 0 50px -16px rgba(182,255,0,0.4)" }}>
            <Image src="/handouts/insta-qr.jpg" alt="QR Instagram @saint4ai" width={708} height={714} className="block" style={{ width: 200, height: 200 }} />
          </motion.div>
        </div>
      }
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4">
        // БОНУС ЗА СТОРИС
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-4"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.4vw, 52px)" }}
      >
        ОТМЕТЬ МЕНЯ <span className="text-[#B6FF00]">В СТОРИС</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/70 text-base md:text-lg leading-snug max-w-md mb-5">
        Отметь меня в сторис — и можешь получить бонус: <span className="text-white font-semibold">курс и кураторство</span>.
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.6, ease: [0.34, 1.3, 0.64, 1] }} className="inline-flex items-center gap-3 self-start rounded-2xl px-5 py-3" style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.4)" }}>
        <AtSign className="w-7 h-7 text-[#B6FF00]" strokeWidth={1.8} />
        <span className="font-bold text-[#B6FF00]" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(24px,2.6vw,40px)" }}>@saint4ai</span>
      </motion.div>
    </SlideLayout>
  );
}
