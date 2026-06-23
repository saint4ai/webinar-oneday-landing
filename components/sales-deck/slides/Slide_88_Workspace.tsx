"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Terminal } from "lucide-react";

/**
 * Слайд 88 · AI Workspace — структура папки. Текст 1-в-1 STRUCTURE 1076-1083.
 * Терминал Claude Code «печатает» дерево папки (по пометке Александра).
 */
const TREE = [
  { t: "~/AI Workspace", c: "#B6FF00" },
  { t: "├── AboutMe/", cm: "всё о тебе и твоей работе" },
  { t: "├── Inbox/", cm: "свалка" },
  { t: "├── Projects/", cm: "твои проекты" },
  { t: "└── Memory/", cm: "память каждого проекта" },
];

export function Slide_88_Workspace() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={740}
      background={<SlideBg theme="dark" variant="lime-right" />}
    >
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // AI WORKSPACE
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.04] tracking-[-0.02em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3cqw, 46px)" }}
      >
        ОДНА ПАПКА — <span className="text-[#B6FF00]">ВСЯ ТВОЯ РАБОЧАЯ ЖИЗНЬ</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mb-6">
        Готовый шаблон, который ты заберёшь с воркшопа.
      </motion.div>

      {/* Терминал — дерево папки */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="rounded-xl overflow-hidden max-w-2xl mb-6"
        style={{ background: "#0A0B0F", border: "1px solid rgba(182,255,0,0.25)" }}
      >
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8">
          <Terminal className="w-3.5 h-3.5 text-[#B6FF00]" strokeWidth={2} />
          <span className="font-mono text-[11px] text-white/45">claude code — tree ~/AI Workspace</span>
        </div>
        <div className="px-5 py-4 font-mono leading-relaxed" style={{ fontSize: "clamp(12px,1cqw,15px)" }}>
          {TREE.map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.8 + i * 0.18 }}
              className="flex items-baseline gap-3"
            >
              <span style={{ color: row.c ?? "rgba(255,255,255,0.85)", fontWeight: row.c ? 700 : 400 }}>{row.t}</span>
              {row.cm && <span className="text-white/35"># {row.cm}</span>}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.8 }} className="text-white/55 text-sm md:text-base leading-snug max-w-2xl">
        Один раз настроил — агент знает, кто ты, чем занимаешься и как с тобой общаться.
      </motion.div>
    </SlideLayout>
  );
}
