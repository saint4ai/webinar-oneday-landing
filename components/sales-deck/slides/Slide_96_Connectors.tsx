"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Mic, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BrandLogo } from "../BrandLogo";

/**
 * Слайд 96 · Коннекторы — голосом в свои сервисы. Текст 1-в-1 STRUCTURE 1175-1183.
 */
const SERVICES: { n: string; logo?: string; icon?: LucideIcon }[] = [
  { n: "Calendar", logo: "googlecalendar" }, { n: "Drive", logo: "googledrive" }, { n: "Notion", logo: "notion" },
  { n: "Asana", logo: "asana" }, { n: "Miro", logo: "miro" }, { n: "Higgsfield", icon: Sparkles }, { n: "Outlook", logo: "outlook" },
];

export function Slide_96_Connectors() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={740} background={<SlideBg theme="dark" variant="lime-right" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
        // КОННЕКТОРЫ
      </motion.div>
      <motion.h1 initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }} animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }} className="font-bold uppercase text-white leading-[1.04] tracking-[-0.02em] mb-2" style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(24px, 2.8vw, 44px)" }}>
        ГОЛОСОМ В КАЛЕНДАРЬ. В NOTION. <span className="text-[#B6FF00]">В MIRO.</span>
      </motion.h1>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mb-6">
        Подключаешь один раз, дальше просто говоришь. «Завтра в 15:00 встреча с клиентом» — событие создано в Google Calendar.
      </motion.div>

      {/* Голос → Claude → сервисы */}
      <div className="flex items-center gap-5 mb-6 flex-wrap">
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.55 }} className="flex flex-col items-center gap-1.5 rounded-2xl px-5 py-4 shrink-0" style={{ background: "rgba(182,255,0,0.1)", border: "1px solid rgba(182,255,0,0.4)", boxShadow: "0 0 50px -14px rgba(182,255,0,0.5)" }}>
          <Mic className="w-6 h-6 text-[#B6FF00]" strokeWidth={1.8} />
          <span className="text-[#B6FF00] text-xs font-semibold">голос → Claude</span>
        </motion.div>
        <span className="text-[#B6FF00] text-2xl shrink-0">→</span>
        <div className="grid grid-cols-4 gap-2.5">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.n} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.8 + i * 0.08, ease: [0.34, 1.4, 0.64, 1] }} className="flex items-center gap-1.5 rounded-lg px-2.5 py-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {s.logo ? (
                  <BrandLogo name={s.logo} alt={s.n} className="w-4 h-4 shrink-0" />
                ) : Icon ? (
                  <Icon className="w-3.5 h-3.5 text-[#B6FF00] shrink-0" strokeWidth={1.9} />
                ) : null}
                <span className="text-white/80 text-xs">{s.n}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.5 }} className="text-white/60 text-base md:text-lg">
        Доступны десятки сервисов. <span className="text-[#B6FF00] font-semibold">Личный ассистент без зарплаты.</span>
      </motion.div>
    </SlideLayout>
  );
}
