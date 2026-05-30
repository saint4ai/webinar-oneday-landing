"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Gift, Globe, Download } from "lucide-react";
import { BrandLogo } from "../BrandLogo";

/**
 * Слайд 72 · Google AI Studio. Текст 1-в-1 STRUCTURE 900-904.
 * H1 + 3 преимущества + стилизованное окно браузера (слот под реальный скрин).
 */
const PERKS = [
  { icon: Gift, t: "Бесплатно", d: "инструмент от Google" },
  { icon: Globe, t: "В браузере", d: "ничего не качать" },
  { icon: Download, t: "Без установки", d: "открыл и работаешь" },
];

export function Slide_72_GoogleAIStudio() {
  return (
    <SlideLayout
      speakerSide="right"
      contentClassName="!justify-start !py-0"
      contentMinWidth={720}
      background={<SlideBg theme="dark" variant="aura-tr" />}
    >
      <div className="flex flex-col h-full w-full justify-center" style={{ paddingTop: "clamp(32px,5vh,64px)", paddingBottom: "clamp(28px,4vh,52px)" }}>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3 flex items-center gap-2"
        >
          <BrandLogo name="google" alt="Google" className="w-3.5 h-3.5" />
          // ПРАКТИКА · ИНСТРУМЕНТ
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
          className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
          style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(34px, 4.4vw, 76px)" }}
        >
          GOOGLE <span className="text-[#B6FF00]">AI STUDIO</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-white/65 text-base md:text-lg leading-snug max-w-2xl mb-7"
        >
          Бесплатный инструмент от Google. Работает в браузере. Без установки.
        </motion.div>

        <div className="flex items-stretch gap-5 flex-wrap">
          {/* 3 преимущества */}
          <div className="flex flex-col gap-3 shrink-0">
            {PERKS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.t}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.6 + i * 0.13 }}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.2)", width: 280 }}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(182,255,0,0.12)" }}>
                    <Icon className="w-5 h-5 text-[#B6FF00]" strokeWidth={1.9} />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm md:text-base leading-none">{p.t}</div>
                    <div className="text-white/45 text-xs mt-1">{p.d}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Стилизованное окно браузера + слот */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.7, ease: [0.25, 1, 0.5, 1] }}
            className="flex-1 min-w-[300px] rounded-xl overflow-hidden border border-white/12"
            style={{ background: "#0E1116" }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border-b border-white/8">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-3 font-mono text-[11px] text-white/45">🔒 aistudio.google.com</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 text-center" style={{ minHeight: 180 }}>
              <BrandLogo name="google" alt="Google" className="w-8 h-8" />
              <span className="text-white/50 text-sm font-mono uppercase tracking-[0.1em] mt-1">скрин AI Studio</span>
              <span className="text-white/25 text-[10px]">добавит Александр</span>
            </div>
          </motion.div>
        </div>
      </div>
    </SlideLayout>
  );
}
