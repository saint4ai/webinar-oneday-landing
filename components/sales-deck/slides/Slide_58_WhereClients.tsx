"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Users, MapPin, MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandLogo } from "../BrandLogo";

/**
 * Слайд 58 · Где брать первых клиентов. Текст 1-в-1 STRUCTURE 732-742.
 * 6 каналов карточками; первый (знакомые) — лайм-акцент «самый быстрый старт».
 */
const CHANNELS: { icon?: LucideIcon; logo?: string; t: string; d: string; hot?: boolean }[] = [
  { icon: Users, t: "Свои знакомые с бизнесом", d: "самый быстрый старт", hot: true },
  { logo: "instagram", t: "Рассылка в Instagram", d: "по своей нише" },
  { icon: MapPin, t: "Холодные рассылки в 2GIS", d: "контакты собираешь через Claude Code" },
  { icon: MessageCircle, t: "Сарафан", d: "после первого клиента" },
  { logo: "telegram", t: "Telegram-чаты заказчиков", d: "где сидят бизнесмены" },
  { logo: "threads", t: "Threads", d: "поиск по ключевым словам" },
];

export function Slide_58_WhereClients() {
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
        // ПЕРВЫЕ КЛИЕНТЫ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-7"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(30px, 3.8cqw, 58px)" }}
      >
        ГДЕ БРАТЬ <span className="text-[#B6FF00]">ПЕРВЫХ КЛИЕНТОВ</span>
      </motion.h1>

      <div className="grid grid-cols-3 gap-3 max-w-4xl">
        {CHANNELS.map((c, i) => {
          const Icon = c.icon;
          const accent = c.hot ? "#B6FF00" : "rgba(255,255,255,0.5)";
          return (
            <motion.div
              key={c.t}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.4 + i * 0.1, ease: [0.25, 1, 0.5, 1] }}
              className="relative rounded-2xl px-4 py-4 flex flex-col gap-2"
              style={{
                background: c.hot ? "rgba(182,255,0,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${c.hot ? "rgba(182,255,0,0.32)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: c.hot ? "rgba(182,255,0,0.14)" : "rgba(255,255,255,0.05)" }}>
                  {c.logo ? (
                    <BrandLogo name={c.logo} alt={c.t} className="w-5 h-5" />
                  ) : Icon ? (
                    <Icon className="w-4 h-4" strokeWidth={1.9} style={{ color: accent }} />
                  ) : null}
                </div>
                <span className="font-bold opacity-20 leading-none" style={{ color: accent, fontFamily: "var(--font-benzin), system-ui", fontSize: 30 }}>{i + 1}</span>
              </div>
              <div className="text-white font-semibold text-sm md:text-base leading-tight">{c.t}</div>
              <div className="text-[13px] leading-snug" style={{ color: c.hot ? "#B6FF00" : "rgba(255,255,255,0.55)" }}>{c.d}</div>
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}
