"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { Check } from "lucide-react";

/**
 * Слайд 108 · Вопрос 1 — «А Я СМОГУ?». Текст 1-в-1 STRUCTURE 1343-1352.
 * DESIGN-LANGUAGE: DL-4 brutalist / knockout. Доминанта — гигантский «95%» (split-stat
 * лайм vs оранж 5%), под ним 3 пруфа-чипа с галочками + «ВЫ?». Не дефолт-сетка.
 */
const PROOFS = ["Айдос не писал код", "Ренат не учил программирование", "Мерей — работник в найме"];

export function Slide_108_CanIDoIt() {
  return (
    <SlideLayout speakerSide="right" contentMinWidth={760} background={<SlideBg theme="dark" variant="aura-tl" />}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="font-mono text-[11px] tracking-[0.2em] uppercase font-semibold text-[#FC5C02] mb-4">
        // ВОПРОС 1 — «А Я <span className="text-white/70">СМОГУ?</span>»
      </motion.div>

      {/* HERO split-stat 95% / 5% */}
      <div className="flex items-end gap-6 md:gap-10 mb-6 flex-wrap">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}>
          <div className="font-bold leading-[0.85] tabular-nums" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(80px, 11vw, 184px)", color: "#B6FF00", textShadow: "0 0 70px rgba(182,255,0,0.4)" }}>
            95%
          </div>
          <div className="font-mono text-[12px] md:text-sm uppercase tracking-[0.16em] text-white/80 mt-1">шанс, что сможешь</div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.7 }} className="pb-2 max-w-[280px]">
          <div className="font-bold leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", fontSize: "clamp(30px, 3.2vw, 52px)", color: "rgba(252,92,2,0.7)" }}>5%</div>
          <div className="text-white/45 text-xs md:text-sm leading-snug mt-1.5">кто бросает на первой неделе — не «не дано», а «не хочу».</div>
        </motion.div>
      </div>

      {/* 3 пруфа-чипа + ВЫ? */}
      <div className="flex flex-wrap gap-2.5 mb-5 max-w-3xl">
        {PROOFS.map((p, i) => (
          <motion.span key={p} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.9 + i * 0.12, ease: [0.34, 1.4, 0.64, 1] }} className="inline-flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.28)" }}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: "#B6FF00" }}><Check className="w-2.5 h-2.5 text-black" strokeWidth={3.5} /></span>
            <span className="text-white/85 text-xs md:text-sm font-medium">{p}</span>
          </motion.span>
        ))}
        <motion.span initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.9 + PROOFS.length * 0.12 }} className="inline-flex items-center rounded-lg px-3 py-2 text-[#B6FF00] text-xs md:text-sm font-bold uppercase tracking-[0.1em]" style={{ border: "1.5px dashed rgba(182,255,0,0.55)" }}>
          + ВЫ?
        </motion.span>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.4 }} className="text-white text-base md:text-xl font-semibold leading-snug max-w-2xl">
        Вы только что увидели 5 ответов. Если читаешь это до сих пор — <span className="text-[#B6FF00]">ты в 95%</span>.
      </motion.div>
    </SlideLayout>
  );
}
