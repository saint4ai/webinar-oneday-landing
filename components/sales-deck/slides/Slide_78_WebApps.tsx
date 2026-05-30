"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { BrandLogo } from "../BrandLogo";

/**
 * Слайд 78 · А Web-приложения. Текст 1-в-1 STRUCTURE 957-962.
 */
const TOOLS = [
  { logo: "claude", t: "Claude Code", d: "агент в твоей папке" },
  { logo: "cursor", t: "Cursor", d: "AI-редактор кода" },
  { logo: "lovable", t: "Lovable", d: "сайт из описания" },
];

export function Slide_78_WebApps() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={720}
      background={<SlideBg theme="dark" variant="aura-tr" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // А ЕСЛИ НЕ ANDROID
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.02] tracking-[-0.03em] mb-3"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.4vw, 52px)" }}
      >
        А ЕСЛИ НУЖЕН <span className="text-[#B6FF00]">САЙТ ИЛИ СЕРВИС</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/65 text-base md:text-lg leading-snug max-w-2xl mb-8"
      >
        Та же логика — другие инструменты. Та же простота, та же скорость.
      </motion.div>

      <div className="grid grid-cols-3 gap-4 max-w-3xl">
        {TOOLS.map((t, i) => {
          return (
            <motion.div
              key={t.t}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.15, ease: [0.25, 1, 0.5, 1] }}
              whileHover={{ y: -5 }}
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(182,255,0,0.2)" }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(182,255,0,0.12)" }}>
                <BrandLogo name={t.logo} alt={t.t} className="w-6 h-6" />
              </div>
              <div>
                <div className="text-white font-bold text-base md:text-lg leading-none">{t.t}</div>
                <div className="text-white/45 text-xs md:text-sm mt-1.5">{t.d}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}
