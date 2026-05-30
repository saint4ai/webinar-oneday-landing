"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { User, Building2 } from "lucide-react";

/**
 * Слайд 54 · Research 2/5 — «ДЛЯ ЛЮДЕЙ ИЛИ ДЛЯ БИЗНЕСА». Текст 1-в-1 STRUCTURE 648-660.
 * 2 колонки выезжают навстречу с разных сторон. Слева ЛЮДИ, справа БИЗНЕС.
 */
export function Slide_54_Research2() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={760}
      background={<SlideBg theme="dark" variant="aura-tl" />}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00] mb-3"
      >
        // RESEARCH · 2 / 5
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.0] tracking-[-0.03em] mb-2"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(28px, 3.4vw, 52px)",
        }}
      >
        ДЛЯ ЛЮДЕЙ ИЛИ <span className="text-[#B6FF00]">ДЛЯ БИЗНЕСА</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="text-white/65 text-sm md:text-base leading-snug mb-7"
      >
        Это два разных рынка. Их нельзя мешать.
      </motion.div>

      {/* 2 колонки навстречу */}
      <div className="grid grid-cols-2 gap-5 max-w-4xl">
        {/* ЛЮДИ — слева */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
              <User className="w-5 h-5 text-white/70" strokeWidth={1.8} />
            </div>
            <div>
              <div className="text-white font-bold text-lg uppercase leading-none" style={{ fontFamily: "var(--font-benzin), system-ui" }}>ДЛЯ ЛЮДЕЙ</div>
              <div className="text-white/60 text-[13px] mt-1">покупают эмоцией · чек $5-30/мес</div>
            </div>
          </div>
          <p className="text-white/70 text-sm leading-snug mb-3">Экономит личное время, упрощает быт, помогает с учёбой, контентом, деньгами, привычками.</p>
          <div className="text-white/45 text-xs leading-snug">Личные трекеры, планировщики, помощники для учёбы, заметки, бюджет, привычки.</div>
        </motion.div>

        {/* БИЗНЕС — справа */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 1, 0.5, 1] }}
          className="rounded-2xl p-5"
          style={{ background: "rgba(182,255,0,0.06)", border: "1px solid rgba(182,255,0,0.28)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(182,255,0,0.14)" }}>
              <Building2 className="w-5 h-5 text-[#B6FF00]" strokeWidth={1.8} />
            </div>
            <div>
              <div className="font-bold text-lg uppercase leading-none" style={{ fontFamily: "var(--font-benzin), system-ui", color: "#B6FF00" }}>ДЛЯ БИЗНЕСА</div>
              <div className="text-white/60 text-[13px] mt-1">покупают расчётом · чек 300 000 — 5 000 000 ₸</div>
            </div>
          </div>
          <p className="text-white/75 text-sm leading-snug mb-3">Экономит деньги компании, снижает ручной труд, уменьшает ошибки, даёт контроль и аналитику.</p>
          <div className="text-white/50 text-xs leading-snug">Внутренние панели, отчёты, дашборды, автоматизация процессов, нишевые сервисы под одну роль.</div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
