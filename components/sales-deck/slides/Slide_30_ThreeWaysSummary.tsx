"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";
import { Store, Rocket, Workflow } from "lucide-react";

/**
 * Слайд 30 · 3 направления вместе — «ВЫБИРАЕТЕ ОДНО ИЗ ТРЁХ».
 * 3 бенто-карточки, прогрессивное появление. Текст 1-в-1 из STRUCTURE.
 */
const WAYS = [
  { n: "01", icon: Store, t: "Сервис для бизнеса", s: "под бизнес-задачи, на заказ", c: "#B6FF00" },
  { n: "02", icon: Rocket, t: "Сервис на подписке", s: "свой продукт для всех", c: "#B6FF00" },
  { n: "03", icon: Workflow, t: "Приложение для себя", s: "+ автоматизация рутины", c: "#FC5C02" },
];

export function Slide_30_ThreeWaysSummary() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={680}
      background={<Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ИТОГ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-8"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(28px, 3.6vw, 52px)",
        }}
      >
        ВЫБИРАЕТЕ <span className="text-[#B6FF00]">ОДНО ИЗ ТРЁХ</span>
      </motion.h1>

      {/* 3 бенто-карточки */}
      <div className="grid grid-cols-3 gap-4 max-w-3xl">
        {WAYS.map((w, i) => {
          const Icon = w.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 + i * 0.18, ease: [0.25, 1, 0.5, 1] }}
              whileHover={{ y: -6 }}
              className="rounded-2xl p-5 group relative overflow-hidden"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${w.c}33` }}
            >
              <div className="absolute -top-6 -right-4 font-bold opacity-[0.07] leading-none pointer-events-none" style={{ color: w.c, fontSize: "80px", fontFamily: "var(--font-benzin), system-ui" }}>{w.n}</div>
              <div className="relative">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `${w.c}14`, border: `1px solid ${w.c}33` }}>
                  <Icon className="w-5 h-5" style={{ color: w.c }} strokeWidth={2} />
                </div>
                <div className="text-white font-bold text-base md:text-lg leading-tight">{w.t}</div>
                <div className="text-white/45 text-xs md:text-sm mt-1 leading-snug">{w.s}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}
