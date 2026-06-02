"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Eye, Terminal, FolderOpen, FileText } from "lucide-react";
import { BrandLogo } from "../BrandLogo";

/**
 * Слайд 84 · Claude Code — твой Джарвис. Текст 1-в-1 STRUCTURE 1027-1036.
 * + слот под реальный скрин десктоп-приложения Claude Code (Александр).
 */
const CAPS = [
  { icon: Eye, t: "Видит твои файлы" },
  { icon: Terminal, t: "Запускает команды" },
  { icon: FolderOpen, t: "Открывает программы" },
  { icon: FileText, t: "PDF · Word · Excel · скрины" },
];

export function Slide_84_ClaudeCodeJarvis() {
  return (
    <SlideLayout
      speakerSide="right"
      contentClassName="!justify-start !py-0"
      contentMinWidth={720}
      background={<SlideBg theme="dark" variant="lime-right" />}
    >
      <div className="flex flex-col h-full w-full" style={{ paddingTop: "clamp(34px,6vh,68px)", paddingBottom: "clamp(28px,4vh,52px)" }}>
        <div className="shrink-0">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
            // ГЛАВНЫЙ ИНСТРУМЕНТ
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
            style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.4vw, 52px)" }}
          >
            CLAUDE CODE — <span className="text-[#B6FF00]">ТВОЙ ДЖАРВИС</span>
          </motion.h1>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mb-4">
            AI-агент, который живёт у тебя на компьютере. Не браузерная вкладка — программа на Mac или Windows.
          </motion.div>
          <div className="flex flex-wrap gap-2.5 mb-3">
            {CAPS.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div key={c.t} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.55 + i * 0.1 }} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.22)" }}>
                  <Icon className="w-4 h-4 text-[#B6FF00] shrink-0" strokeWidth={1.9} />
                  <span className="text-white/85 text-xs md:text-sm font-medium">{c.t}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Слот под скрин Claude Code desktop */}
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, delay: 0.7, ease: [0.25, 1, 0.5, 1] }} className="flex-1 min-h-0 flex flex-col justify-end mt-4">
          <div className="relative w-full rounded-xl overflow-hidden border flex flex-col" style={{ aspectRatio: "16 / 9", borderColor: "rgba(182,255,0,0.3)", background: "#0b0e0a", maxHeight: "100%" }}>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border-b border-white/8 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <BrandLogo name="claude" alt="Claude" className="w-3.5 h-3.5 ml-2" />
              <span className="ml-1.5 font-mono text-[11px] text-white/45">Claude Code — ~/AI Workspace</span>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/handouts/screens/cc_screen.png" alt="Claude Code desktop" className="w-full h-full object-cover object-top" />
            </div>
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
