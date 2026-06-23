"use client";

import { motion } from "framer-motion";
import { Spotlight } from "../Spotlight";
import { SlideLayout } from "../SlideLayout";
import { Laptop, Sparkles, Server, Globe } from "lucide-react";

/**
 * Слайд 22 · Сколько стоит вход — «СКОЛЬКО НА ЭТО НУЖНО».
 * Тема «цена/вход» → анимация: цены прилетают справа, чек-строки.
 * Текст 1-в-1 из STRUCTURE.
 */
const COSTS = [
  { icon: Laptop, t: "Ноутбук", price: "есть у всех", note: "необходим", accent: false },
  { icon: Sparkles, t: "Подписка Claude или ChatGPT", price: "от 10 000 ₸/мес", note: "Claude $100–$200 · ChatGPT 10–60 тыс ₸", accent: true },
  { icon: Server, t: "Хостинг на Vercel", price: "0 ₸", note: "бесплатно", accent: false },
  { icon: Globe, t: "Домен .kz", price: "~10 000 ₸", note: "разово в год", accent: false },
];

export function Slide_22_Cost() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={620}
      background={<Spotlight className="-top-40 right-0 md:-top-20" fill="#B6FF00" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-4"
      >
        // СТОИМОСТЬ ВХОДА
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-7"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(30px, 3.8cqw, 56px)",
        }}
      >
        СКОЛЬКО НА ЭТО <span className="text-[#B6FF00]">НУЖНО</span>
      </motion.h1>

      <div className="flex flex-col gap-3 max-w-2xl">
        {COSTS.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.15, ease: [0.25, 1, 0.5, 1] }}
              className="rounded-2xl p-4 flex items-center gap-4"
              style={{
                background: c.accent ? "rgba(182,255,0,0.07)" : "rgba(255,255,255,0.03)",
                border: c.accent ? "1px solid rgba(182,255,0,0.25)" : "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.25)" }}
              >
                <Icon className="w-5 h-5" style={{ color: "#B6FF00" }} strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-base md:text-lg leading-tight">{c.t}</div>
                <div className="text-white/45 text-xs md:text-sm mt-0.5 leading-snug">{c.note}</div>
              </div>
              <div
                className="font-bold text-right shrink-0 whitespace-nowrap"
                style={{
                  color: c.price === "0 ₸" ? "#B6FF00" : "#fff",
                  fontFamily: "var(--font-benzin), system-ui, sans-serif",
                  fontSize: "clamp(15px, 1.6cqw, 22px)",
                }}
              >
                {c.price}
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.25 }}
        className="mt-6 text-white/70 text-sm md:text-base leading-snug max-w-2xl"
      >
        Вход дешевле, чем кажется — <span className="text-[#B6FF00] font-semibold">никаких сотен тысяч</span>.
      </motion.div>
    </SlideLayout>
  );
}
