"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";
import { NicheTag } from "../NicheTag";
import { PriceChip } from "../PriceChip";
import { Filter, Check, MessageSquare } from "lucide-react";

/**
 * Слайд 48 · Решение — HR. Текст 1-в-1 STRUCTURE 571-581.
 * Свежий приём «воронка»: 200 откликов (широко) → AI-фильтр по критериям →
 * 20 лучших (узко, по центру) + готовые сообщения. Пара к Slide 47 (боль).
 */
const CRITERIA = ["допуск СТ-1", "опыт 3+ лет", "родной русский"];
const SHORTLIST = ["А. Сериков", "М. Жумагали", "Д. Ким", "Р. Нур"];

export function Slide_48_HRSolution() {
  return (
    <SlideLayout
      speakerSide="right"
      contentMinWidth={680}
      background={<SlideBg theme="dark" variant="lime-right" />}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center gap-3 mb-3"
      >
        <NicheTag label="HR" tone="lime" />
        <span className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#B6FF00]">// РЕШЕНИЕ</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.02] tracking-[-0.03em] mb-3"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(24px, 2.9cqw, 44px)",
        }}
      >
        AI ОЦЕНИВАЕТ 200 РЕЗЮМЕ ПО ТВОИМ КРИТЕРИЯМ ЗА{" "}
        <span className="text-[#B6FF00]" style={{ whiteSpace: "nowrap" }}>5 МИНУТ</span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="text-white/65 text-sm md:text-base leading-snug max-w-2xl mb-6"
      >
        200 откликов с hh.kz → таблица из 20 лучших + готовые сообщения каждому.
      </motion.div>

      {/* ===== ВОРОНКА: 200 (широко) → фильтр → 20 (узко) ===== */}
      <div className="flex flex-col items-center max-w-3xl mb-6">
        {/* 200 откликов — широкая плотная сетка */}
        <div className="w-full">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40 mb-2">200 откликов с hh.kz</div>
          <div className="flex flex-wrap gap-[3px]">
            {Array.from({ length: 60 }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.6 + i * 0.006 }}
                className="rounded-[2px]"
                style={{ width: "calc((100% - 59*3px) / 60)", minWidth: 8, height: 14, background: "rgba(255,255,255,0.10)" }}
              />
            ))}
          </div>
        </div>

        {/* AI-фильтр + критерии (сужение) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="flex items-center gap-3 my-3"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "#B6FF00", boxShadow: "0 0 26px rgba(182,255,0,0.5)" }}>
            <Filter className="w-4 h-4 text-black" strokeWidth={2.2} />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#B6FF00]">AI-фильтр · идеальный кандидат:</span>
          <div className="flex gap-2 flex-wrap">
            {CRITERIA.map((c) => (
              <span key={c} className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: "rgba(182,255,0,0.08)", border: "1px solid rgba(182,255,0,0.25)", color: "#B6FF00" }}>{c}</span>
            ))}
          </div>
        </motion.div>

        {/* 20 лучших — узкий центр, карточки + шаблон сообщения */}
        <div className="w-full max-w-2xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40 mb-2 text-center">20 кандидатов · «звонить» + готовое сообщение</div>
          <div className="flex items-stretch justify-center gap-2.5 flex-wrap">
            {SHORTLIST.map((name, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 1.3 + i * 0.13, ease: [0.25, 1, 0.5, 1] }}
                className="rounded-xl px-3 py-2.5 flex flex-col gap-1.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(182,255,0,0.2)", width: 150 }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(182,255,0,0.14)", color: "#B6FF00" }}>
                    <Check className="w-3 h-3" strokeWidth={3} /> звонить
                  </span>
                </div>
                <div className="text-white text-xs font-semibold">{name}</div>
                <div className="flex items-center gap-1 text-white/40 text-[10px]">
                  <MessageSquare className="w-3 h-3 shrink-0" strokeWidth={1.8} />
                  <span className="truncate">«Здравствуйте, по вахте…»</span>
                </div>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.9 }}
              className="flex items-center justify-center text-white/50 text-sm font-semibold px-2"
            >
              +16
            </motion.div>
          </div>
        </div>
      </div>

      {/* ===== Нижняя строка ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.0 }}
        className="flex flex-wrap items-stretch gap-4 max-w-3xl"
      >
        <div className="flex-1 min-w-[220px] rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#B6FF00] mb-1.5">ЧТО ПОДКЛЮЧАЕМ</div>
          <div className="text-white/70 text-xs md:text-sm leading-snug">hh.kz (отклики) + Claude (оценка). Вакансия закрывается в <span className="text-white font-semibold">3 раза быстрее</span>.</div>
        </div>
        <PriceChip price="от 500 000 ₸" payback="окупается с одного нанятого" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 2.3 }}
        className="text-white/35 text-xs md:text-sm mt-4 max-w-2xl"
      >
        Зарубежные AI не работают с hh.kz и казахстанской спецификой (вахта, СТ-1, БИН).
      </motion.div>
    </SlideLayout>
  );
}
