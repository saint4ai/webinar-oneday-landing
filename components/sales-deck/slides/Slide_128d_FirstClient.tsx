"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { MessageCircle, Phone, FileText, Banknote, Hash } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandLogo } from "../BrandLogo";

/**
 * Слайд 128d · «Твой первый клиент» — ОТКУДА заявки + схема до первого чека.
 * Источник потока даём мы: Threads Parser (парсит посты в Threads, где ищут вайбкодеров) + 5 готовых TG-каналов.
 * Дальше — действия ученика: написал → созвон → КП в нейросети → первый чек.
 * ⚠ Сумма 300 000 ₸ — со слов Александра, на проверку.
 */
const SOURCES: { Icon?: LucideIcon; logo?: string; name: string; desc: string }[] = [
  { logo: "threads", name: "Threads Parser", desc: "парсит посты в Threads, где ищут вайбкодеров → заявки в твою группу" },
  { Icon: Hash, name: "5 готовых Telegram-каналов", desc: "где бизнес ищет разработчиков и вайбкодеров" },
];

const STEPS = [
  { Icon: MessageCircle, label: "Написал клиенту", sub: "первый контакт" },
  { Icon: Phone, label: "Созвон — 15 минут", sub: "понял, что нужно" },
  { Icon: FileText, label: "Коммерческое за 30 минут", sub: "собрал в нейросети" },
];

export function Slide_128d_FirstClient() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="aura-tl" />} contentClassName="justify-center">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#B6FF00] mb-3">
        // КАК ПРИХОДИТ ПЕРВЫЙ КЛИЕНТ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.03] tracking-[-0.03em] mb-2"
        style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(28px, 3.5cqw, 56px)" }}
      >
        ТВОЙ <span className="text-[#B6FF00]">ПЕРВЫЙ КЛИЕНТ</span>
      </motion.h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="text-white/70 text-sm md:text-lg leading-snug max-w-2xl mb-5">
        Не «когда-нибудь». И заявки — не из воздуха: <span className="text-white/90">поток даём мы, ты доводишь до чека.</span>
      </motion.div>

      {/* ИСТОЧНИК — поток заявок даём мы (2 карточки) */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5, ease: [0.25, 1, 0.5, 1] }} className="rounded-2xl p-4 mb-5 max-w-3xl" style={{ background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.28)" }}>
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#B6FF00] mb-3">заявки даём мы</div>
        <div className="flex flex-col md:flex-row gap-3">
          {SOURCES.map((s) => (
            <div key={s.name} className="flex-1 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)" }}>
                {s.logo ? (
                  <BrandLogo name={s.logo} alt={s.name} className="w-[18px] h-[18px]" />
                ) : s.Icon ? (
                  <s.Icon className="w-[18px] h-[18px] text-[#B6FF00]" strokeWidth={2.2} />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="text-white font-semibold text-sm md:text-base leading-tight">{s.name}</div>
                <div className="text-white/55 text-xs md:text-sm leading-snug mt-0.5">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* СХЕМА — а дальше ты: написал → созвон → КП → чек */}
      <div className="relative flex flex-col gap-3 max-w-2xl">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40 mb-0.5">а дальше — ты</div>
        {/* соединяющая линия */}
        <motion.div
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.9, delay: 1.0, ease: [0.25, 1, 0.5, 1] }}
          className="absolute left-[22px] top-[44px] bottom-[42px] w-[2px] origin-top"
          style={{ background: "linear-gradient(180deg,rgba(182,255,0,0.5),rgba(182,255,0,0.15))" }}
        />
        {STEPS.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 1.0 + i * 0.16, ease: [0.25, 1, 0.5, 1] }} className="relative flex items-center gap-4">
            <div className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(182,255,0,0.08)", border: "1.5px solid rgba(182,255,0,0.45)" }}>
              <s.Icon className="w-5 h-5 text-[#B6FF00]" strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-base md:text-xl leading-tight">{s.label}</span>
              <span className="text-white/45 text-xs md:text-sm">{s.sub}</span>
            </div>
          </motion.div>
        ))}
        {/* финальный узел — первый чек */}
        <motion.div initial={{ opacity: 0, scale: 0.9, x: -16 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.6, delay: 1.55, ease: [0.25, 1, 0.5, 1] }} className="relative flex items-center gap-4 mt-0.5">
          <div className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#B6FF00", boxShadow: "0 0 36px -4px rgba(182,255,0,0.7)" }}>
            <Banknote className="w-5 h-5 text-black" strokeWidth={2.2} />
          </div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-bold leading-none whitespace-nowrap" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(30px,3.6cqw,52px)", color: "#B6FF00", textShadow: "0 0 50px rgba(182,255,0,0.4)" }}>300 000 ₸</span>
            <span className="text-white/60 text-sm md:text-base">первый чек — за то, что собрал сам</span>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.85 }} className="text-white/85 text-base md:text-lg leading-snug max-w-2xl mt-6">
        Без диплома, без портфолио, без согласований. <span className="text-[#B6FF00] font-semibold">И это ближе, чем кажется.</span>
      </motion.div>
    </SlideLayout>
  );
}
