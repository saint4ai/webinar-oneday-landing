"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { ArrowRight } from "lucide-react";

/**
 * Слайд 69 · Дизайн UI приложений. Текст 1-в-1 STRUCTURE 857-869.
 * 3 пары «референс → готовый UI» (стилизованные мини-мокапы) со стрелкой «Claude».
 */
const PAIRS = [
  { ref: "Notion", refGrad: "linear-gradient(135deg,#FFFFFF,#E9E9E7)", refInk: "#37352F", result: "твой админ-кабинет" },
  { ref: "Linear", refGrad: "linear-gradient(135deg,#1C1C28,#5E6AD2)", refInk: "#fff", result: "твоя CRM" },
  { ref: "Apple Music", refGrad: "linear-gradient(135deg,#FB5C74,#FA233B)", refInk: "#fff", result: "твой плеер" },
];

function MiniWindow({ grad, ink, lime }: { grad: string; ink: string; lime?: boolean }) {
  return (
    <div className="rounded-lg overflow-hidden shrink-0" style={{ width: 96, height: 62, background: lime ? "#0E1207" : "#16181C", border: `1px solid ${lime ? "rgba(182,255,0,0.4)" : "rgba(255,255,255,0.12)"}` }}>
      <div className="h-[34%] flex items-center gap-1 px-1.5" style={{ background: lime ? "rgba(182,255,0,0.14)" : grad }}>
        <span className="w-1 h-1 rounded-full" style={{ background: lime ? "#B6FF00" : ink, opacity: 0.6 }} />
        <span className="w-1 h-1 rounded-full" style={{ background: lime ? "#B6FF00" : ink, opacity: 0.4 }} />
      </div>
      <div className="p-1.5 flex flex-col gap-1">
        <div className="h-1 rounded-full" style={{ width: "70%", background: lime ? "#B6FF00" : "rgba(255,255,255,0.25)" }} />
        <div className="h-1 rounded-full" style={{ width: "45%", background: lime ? "rgba(182,255,0,0.5)" : "rgba(255,255,255,0.15)" }} />
        <div className="h-1 rounded-full" style={{ width: "58%", background: "rgba(255,255,255,0.12)" }} />
      </div>
    </div>
  );
}

export function Slide_69_UIDesign() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={720}
      background={<SlideBg theme="dark" variant="aura-tl" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // ИНСТРУМЕНТ 4 · ДИЗАЙН UI
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(-16% 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(-16% 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.14] tracking-[-0.02em] mb-2 pt-1"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 2.9cqw, 44px)" }}
      >
        ТВОЁ ПРИЛОЖЕНИЕ БУДЕТ ВЫГЛЯДЕТЬ <span className="text-[#B6FF00]">КАК У APPLE</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-white/60 text-sm md:text-base leading-snug max-w-2xl mb-6"
      >
        Показал Claude скриншот любимого приложения → он повторил шрифты, цвета, отступы, анимации. Никакой Figma. Никакой команды дизайнеров.
      </motion.div>

      {/* 3 пары референс → результат */}
      <div className="flex flex-col gap-3 max-w-3xl">
        {PAIRS.map((p, i) => (
          <motion.div
            key={p.ref}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 + i * 0.18, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-center gap-4 rounded-xl px-4 py-3"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-2.5 shrink-0">
              <MiniWindow grad={p.refGrad} ink={p.refInk} />
              <span className="text-white/50 text-xs w-[80px]">скрин {p.ref}</span>
            </div>
            <div className="flex flex-col items-center shrink-0">
              <ArrowRight className="w-5 h-5 text-[#B6FF00]" strokeWidth={2.5} />
              <span className="text-[#B6FF00] text-[10px] font-mono uppercase tracking-[0.1em]">claude</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MiniWindow grad="" ink="#fff" lime />
              <span className="text-white font-semibold text-sm">{p.result} <span className="text-white/40 font-normal">в стиле {p.ref}</span></span>
            </div>
          </motion.div>
        ))}
      </div>
    </SlideLayout>
  );
}
