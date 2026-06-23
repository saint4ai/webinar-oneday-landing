"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Users, MapPin, Handshake } from "lucide-react";

/** Слайд 157 · 3 способа найти клиента за 7 дней. Текст по STRUCTURE 2184-2192 (сжато под слайд). */
const WAYS = [
  { icon: Users, t: "Свой круг", d: "50 человек в WhatsApp + Instagram. Личка: «делаю AI-сервисы для бизнеса за 2 недели».", out: "1-2 откликнутся — первый клиент" },
  { icon: MapPin, t: "Реестр 2GIS", d: "Ниша (салоны / автосервисы / стоматологии), 100 компаний, рассылка скрипта.", out: "из 100 → 5 ответов → 1 платит" },
  { icon: Handshake, t: "Партнёрство с агентством", d: "Пишешь SMM / digital-агентствам: «делаю под ваших клиентов, делим маржу».", out: "клиент без холодного трафика" },
];

export function Slide_157_ThreeWays() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={780} background={<SlideBg theme="dark" variant="lime-right" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // БОНУСНЫЙ КОНТЕНТ
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.02] tracking-[-0.02em] mb-5"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 1.95cqw, 37px)" }}
      >
        3 СПОСОБА НАЙТИ ПЕРВОГО КЛИЕНТА <span className="text-[#B6FF00]">ЗА 7 ДНЕЙ</span>
      </motion.h1>
      <div className="grid grid-cols-3 gap-3.5 max-w-4xl mb-4">
        {WAYS.map((w, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 + i * 0.15 }} className="rounded-2xl p-4 flex flex-col" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.3)" }}>
                <w.icon className="w-4.5 h-4.5 text-[#B6FF00]" strokeWidth={2} />
              </span>
              <span className="font-bold text-white text-sm md:text-base leading-tight" style={{ fontFamily: "var(--font-benzin), system-ui" }}>{w.t}</span>
            </div>
            <p className="text-white/65 text-xs md:text-[13px] leading-snug mb-2.5 flex-1">{w.d}</p>
            <div className="text-[#B6FF00] text-xs font-semibold rounded-lg px-2.5 py-1.5" style={{ background: "rgba(182,255,0,0.07)" }}>{w.out}</div>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.0 }} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 self-start" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}>
        <span className="text-[#B6FF00] font-bold text-sm md:text-base">7 дней — реальный срок. Не год маркетинга.</span>
      </motion.div>
    </SlideLayout>
  );
}
