"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Plug, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandLogo } from "../BrandLogo";

/**
 * Слайд 67 · MCP — USB-розетка для Claude. Текст 1-в-1 STRUCTURE 829-838.
 * Визуал: Claude·MCP-узел → провода → логотипы сервисов (стилизованные чипы).
 */
const SERVICES: { n: string; logo?: string; icon?: LucideIcon; c?: string }[] = [
  { n: "Miro", logo: "miro" },
  { n: "Higgsfield", icon: Sparkles, c: "#B6FF00" },
  { n: "Notion", logo: "notion" },
  { n: "Figma", logo: "figma" },
  { n: "GitHub", logo: "github" },
  { n: "Slack", logo: "slack" },
];

export function Slide_67_MCP() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={740}
      background={<SlideBg theme="dark" variant="lime-right" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ИНСТРУМЕНТ 2 · MCP
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.4cqw, 52px)" }}
      >
        MCP — <span className="text-[#B6FF00]">USB-РОЗЕТКА</span> ДЛЯ CLAUDE
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mb-7"
      >
        Один протокол. Любой сервис. Claude работает внутри него за вас.
      </motion.div>

      {/* Поток: Claude·MCP → сервисы */}
      <div className="flex items-center gap-5 mb-7 flex-wrap">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.55, ease: [0.34, 1.4, 0.64, 1] }}
          className="flex flex-col items-center gap-2 rounded-2xl px-6 py-5 shrink-0"
          style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 50px -10px rgba(182,255,0,0.4)" }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#B6FF00" }}>
            <Plug className="w-6 h-6 text-black" strokeWidth={2} />
          </div>
          <span className="font-bold text-white text-sm">Claude · MCP</span>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.85 }} className="text-[#B6FF00] text-2xl shrink-0">→</motion.div>

        <div className="grid grid-cols-3 gap-2.5">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.95 + i * 0.1 }}
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {s.logo ? (
                  <BrandLogo name={s.logo} alt={s.n} className="w-4 h-4 shrink-0" />
                ) : Icon ? (
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.9} style={{ color: s.c }} />
                ) : null}
                <span className="text-white/85 text-xs md:text-sm font-medium">{s.n}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.5 }}
        className="text-white/55 text-sm md:text-base leading-snug max-w-3xl"
      >
        Подключаешь к Miro — он строит карты идей и схемы. К Higgsfield — генерит картинки, скачивает, складывает в папку. <span className="text-white/85">Один раз воткнул — Claude умеет работать в этом сервисе как вы сами. Только быстрее.</span>
      </motion.div>
    </SlideLayout>
  );
}
