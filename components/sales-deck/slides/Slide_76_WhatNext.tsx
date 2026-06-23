"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { User, Store, Briefcase } from "lucide-react";

/**
 * Слайд 76 · Что можно делать дальше. Текст 1-в-1 STRUCTURE 938-945.
 */
const DIRS = [
  { icon: User, t: "Пользоваться самому", d: "экономить время или решать свою задачу", n: "01" },
  { icon: Store, t: "Выложить в Google Play", d: "получать пользователей и подписки — доп. доход", n: "02" },
  { icon: Briefcase, t: "Продавать как сервис", d: "компаниям под их задачи", n: "03" },
];

export function Slide_76_WhatNext() {
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
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // ПРАКТИКА · ДАЛЬШЕ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-8"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 3.8cqw, 56px)" }}
      >
        ЧТО МОЖНО ДЕЛАТЬ <span className="text-[#B6FF00]">ДАЛЬШЕ</span>
      </motion.h1>

      <div className="grid grid-cols-3 gap-4 max-w-4xl">
        {DIRS.map((d, i) => {
          const Icon = d.icon;
          return (
            <motion.div
              key={d.t}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.45 + i * 0.16, ease: [0.25, 1, 0.5, 1] }}
              whileHover={{ y: -6 }}
              className="relative rounded-2xl p-5 overflow-hidden"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(182,255,0,0.2)" }}
            >
              <div className="absolute -top-5 -right-3 font-bold opacity-[0.07] leading-none pointer-events-none" style={{ color: "#B6FF00", fontSize: 80, fontFamily: "var(--font-benzin), system-ui" }}>{d.n}</div>
              <div className="relative">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(182,255,0,0.12)", border: "1px solid rgba(182,255,0,0.25)" }}>
                  <Icon className="w-5 h-5 text-[#B6FF00]" strokeWidth={1.9} />
                </div>
                <div className="text-white font-bold text-base md:text-lg leading-tight">{d.t}</div>
                <div className="text-white/45 text-xs md:text-sm mt-1.5 leading-snug">{d.d}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}
