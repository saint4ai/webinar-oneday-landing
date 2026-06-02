"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";
import { LiquidBackground } from "../LiquidBackground";
import { BinaryDecodeText } from "../BinaryDecodeText";
import { Puzzle, Plug, Sparkles, LayoutPanelTop } from "lucide-react";

/**
 * Слайд 65 · Chapter «ЧТО ОТЛИЧАЕТ ЛЮБИТЕЛЯ ОТ ПРОФЕССИОНАЛА». Текст 1-в-1 STRUCTURE 800-808.
 * Cyberpunk glitch (water + scan-lines + binary-decode) + 4 инструмента бенто.
 */
const TOOLS = [
  { icon: Puzzle, t: "Skills", d: "навыки агента" },
  { icon: Plug, t: "MCP", d: "подключение к сервисам" },
  { icon: Sparkles, t: "Higgsfield", d: "генерация визуала" },
  { icon: LayoutPanelTop, t: "Дизайн UI", d: "production-grade интерфейс" },
];

export function Slide_65_QualityChapter() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={760}
      background={
        <>
          <LiquidBackground variant="water" opacity={0.32} />
          <div className="sd-scan-lines" />
          <div className="absolute inset-0 pointer-events-none z-[1]" style={{ background: "radial-gradient(ellipse at center, transparent 32%, rgba(0,0,0,0.68) 100%)" }} />
        </>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ЧАСТЬ VI · ИНСТРУМЕНТЫ КАЧЕСТВА
      </motion.div>

      <div className="font-bold uppercase text-white/90 leading-[1.05] tracking-[-0.02em]" style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(22px, 2.4vw, 40px)" }}>
        ЧТО ОТЛИЧАЕТ ЛЮБИТЕЛЯ ОТ
      </div>
      <div className="sd-glitch-rgb sd-chapter-shake" style={{ maxWidth: "100%" }}>
        <BinaryDecodeText
          text="ПРОФЕССИОНАЛА"
          color="#ffffff"
          bitColor="rgba(182,255,0,0.6)"
          accentColor="#B6FF00"
          perChar={90}
          startDelay={200}
          className="font-bold uppercase leading-[0.95] tracking-[-0.04em] block"
          style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(38px, 4.6vw, 80px)", color: "#B6FF00", wordBreak: "keep-all" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        className="text-white/70 text-sm md:text-base leading-snug max-w-2xl mt-6 mb-7"
      >
        Четыре инструмента качества — без них сервис выглядит «как у новичка-вайбкодера», с ними — <span className="text-[#B6FF00]">«как у студии за 5 млн»</span>.
      </motion.div>

      <div className="flex flex-wrap gap-3 max-w-3xl">
        {TOOLS.map((t, i) => {
          const Icon = t.icon;
          return (
            <motion.div
              key={t.t}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.3 + i * 0.13, ease: [0.34, 1.4, 0.64, 1] }}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.22)", backdropFilter: "blur(6px)" }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(182,255,0,0.12)" }}>
                <Icon className="w-5 h-5 text-[#B6FF00]" strokeWidth={1.9} />
              </div>
              <div>
                <div className="text-white font-bold text-sm md:text-base leading-none">{t.t}</div>
                <div className="text-white/45 text-[11px] md:text-xs mt-1">{t.d}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}
