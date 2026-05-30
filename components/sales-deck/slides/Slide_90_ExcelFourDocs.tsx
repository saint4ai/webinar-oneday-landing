"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Image as ImageIcon } from "lucide-react";
import { BrandLogo } from "../BrandLogo";

/**
 * Слайд 90 · Кейс 1 — один Excel, четыре артефакта. Текст 1-в-1 STRUCTURE 1099-1110.
 * + слот под скрин готового HTML-дашборда в бренд-коде (есть в репо / Александр).
 */
const CMDS = [
  ["Дай саммари", "топ-3 в плюсе, топ-3 в минусе"],
  ["Дашборд HTML", "в нашем бренд-коде, тёмная тема"],
  ["Перегони в PDF", "формата А4"],
  ["5 действий", "на неделю, с обоснованием"],
];

export function Slide_90_ExcelFourDocs() {
  return (
    <SlideLayout
      speakerSide="right"
      contentClassName="!justify-start !py-0"
      contentMinWidth={740}
      background={<SlideBg theme="dark" variant="climax" />}
    >
      <div className="flex flex-col h-full w-full" style={{ paddingTop: "clamp(34px,6vh,68px)", paddingBottom: "clamp(28px,4vh,52px)" }}>
        <div className="shrink-0">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3">
            // КЕЙС 1 · ОТЧЁТ
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
            style={{ fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif", fontSize: "clamp(26px, 3.2vw, 50px)" }}
          >
            ОДИН EXCEL — <span className="text-[#B6FF00]">ЧЕТЫРЕ ДОКУМЕНТА</span>
          </motion.h1>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-white/65 text-sm md:text-base mb-5">
            Скинул отчёт по рекламе → 4 команды: сводка → дашборд → PDF → план действий.
          </motion.div>

          <div className="flex items-stretch gap-3 flex-wrap mb-2">
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.55 }} className="flex flex-col items-center justify-center gap-1.5 rounded-xl px-4 py-3 shrink-0" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <BrandLogo name="excel" alt="Excel" className="w-6 h-6" />
              <span className="text-white/50 text-[11px]">отчёт.xlsx</span>
            </motion.div>
            {CMDS.map((c, i) => (
              <motion.div key={c[0]} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.7 + i * 0.12 }} className="flex-1 min-w-[150px] rounded-xl px-3.5 py-3" style={{ background: "rgba(182,255,0,0.05)", border: "1px solid rgba(182,255,0,0.2)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[#B6FF00] leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: 18 }}>{i + 1}</span>
                  <span className="text-white font-semibold text-sm leading-tight">{c[0]}</span>
                </div>
                <div className="text-white/45 text-[11px] md:text-xs leading-snug">{c[1]}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Слот под дашборд */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.2, ease: [0.25, 1, 0.5, 1] }} className="flex-1 min-h-0 flex flex-col justify-end mt-4">
          <div className="relative w-full rounded-xl overflow-hidden border border-dashed flex flex-col items-center justify-center gap-2" style={{ aspectRatio: "16/9", borderColor: "rgba(182,255,0,0.3)", background: "rgba(182,255,0,0.02)", maxHeight: "100%" }}>
            <ImageIcon className="w-8 h-8 text-white/30" strokeWidth={1.5} />
            <span className="text-white/45 text-xs font-mono uppercase tracking-[0.1em]">скрин готового HTML-дашборда (бренд-код)</span>
            <span className="text-white/30 text-[11px]">раньше — день в Excel + PowerPoint · сейчас — <span className="text-[#B6FF00]">30 минут</span></span>
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
