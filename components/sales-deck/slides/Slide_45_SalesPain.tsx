"use client";

import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 45 · Боль — Отдел продаж.
 * «ВЛАДЕЛЕЦ СЛУШАЕТ 5 ЗВОНКОВ ИЗ 200». Визуал: сетка телефонов, 5 подсвечены
 * лаймом, остальные меркнут. Счётчик «30 ЧАСОВ НА ПРОСЛУШКУ».
 * Текст 1-в-1 из STRUCTURE.
 */
const TOTAL = 200;
const LIT = 5; // сколько реально слушают

export function Slide_45_SalesPain() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="32vw"
      background={<SlideBg theme="dark" variant="orange-pain" />}
      leftObject={
        <div className="w-[92%] max-w-[440px] flex flex-col items-center">
          {/* Сетка 200 телефонов (20×10), 5 случайных подсвечены лаймом */}
          <div
            className="grid gap-[3px]"
            style={{ gridTemplateColumns: "repeat(20, 1fr)" }}
          >
            {Array.from({ length: TOTAL }).map((_, i) => {
              const lit = [37, 88, 119, 156, 183].includes(i);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: lit ? 1 : 0.16 }}
                  transition={{ duration: 0.5, delay: 0.4 + (i / TOTAL) * 1.2 }}
                  className="rounded-[2px]"
                  style={{
                    aspectRatio: "1 / 1.7",
                    background: lit ? "#B6FF00" : "#2a2a2a",
                    boxShadow: lit ? "0 0 10px rgba(182,255,0,0.7)" : "none",
                  }}
                />
              );
            })}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.8 }}
            className="mt-6 text-center"
          >
            <div
              className="font-bold leading-none"
              style={{ fontFamily: "var(--font-benzin)", fontSize: "clamp(26px,3vw,40px)", color: "#FC5C02" }}
            >
              30 ЧАСОВ
            </div>
            <div className="text-white/45 text-xs uppercase tracking-[0.18em] font-mono mt-1.5">
              на прослушку
            </div>
          </motion.div>
        </div>
      }
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold text-[#FC5C02] mb-4"
      >
        // БОЛЬ · ОТДЕЛ ПРОДАЖ
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
        className="font-bold uppercase text-white leading-[1.02] tracking-[-0.03em]"
        style={{
          fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
          fontSize: "clamp(24px, 2.9vw, 44px)",
        }}
      >
        ВЛАДЕЛЕЦ СЛУШАЕТ{" "}
        <span style={{ color: "#B6FF00" }}>5 ЗВОНКОВ ИЗ 200</span>
        {" "}— ОСТАЛЬНОЕ ПРОПУСКАЕТ
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="text-white/80 text-base md:text-lg leading-snug mt-5 max-w-xl"
      >
        Менеджеры теряют клиентов на возражениях. Владелец не видит где именно.
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.85 }}
        className="text-white/60 text-sm md:text-base leading-relaxed mt-5 space-y-1.5 max-w-xl"
      >
        <p>200+ звонков в неделю. Послушать каждый — <span className="text-white font-semibold">30 часов</span>. Реально слушает 5-10 случайных.</p>
        <p><span style={{ color: "#FC5C02" }}>«Дорого»</span> не отрабатывают — клиент уходит. <span style={{ color: "#FC5C02" }}>«Я подумаю»</span> — не возвращают.</p>
        <p>Владелец узнаёт о косяках через месяц — когда уже потеряны <span className="text-white font-semibold">30+ клиентов</span> и часть выручки.</p>
      </motion.div>
    </SlideLayout>
  );
}
