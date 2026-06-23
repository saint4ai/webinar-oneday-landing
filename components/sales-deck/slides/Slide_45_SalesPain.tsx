"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SlideBg } from "../SlideBg";
import { SlideLayout } from "../SlideLayout";

/**
 * Слайд 45 · Боль — Отдел продаж.
 * «РУКОВОДИТЕЛЬ СЛУШАЕТ ТОЛЬКО 5 ЗВОНКОВ ИЗ 200». Слева — Higgsfield-сцена:
 * руководитель отдела продаж в стрессе среди необработанных звонков + плашка «30 ЧАСОВ».
 */
export function Slide_45_SalesPain() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="22cqw"
      contentMinWidth={500}
      background={<SlideBg theme="dark" variant="orange-pain" />}
      leftObject={
        <div className="relative h-full w-full overflow-hidden">
          <Image
            src="/handouts/niches/pain_saleshead.png"
            alt="Руководитель отдела продаж в стрессе среди необработанных звонков"
            fill
            className="object-cover object-center"
            sizes="35vw"
            priority
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 48%, rgba(10,11,15,0.5) 80%, #0A0B0F)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,11,15,0.45), transparent 28%)" }} />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="absolute bottom-[7%] left-[8%] rounded-xl px-4 py-2.5"
            style={{ background: "rgba(10,11,15,0.72)", border: "1px solid rgba(252,92,2,0.5)", backdropFilter: "blur(6px)" }}
          >
            <div className="font-bold leading-none" style={{ fontFamily: "var(--font-benzin)", fontSize: "clamp(24px,2.6cqw,38px)", color: "#FC5C02" }}>30 ЧАСОВ</div>
            <div className="text-white/55 text-[10px] uppercase tracking-[0.18em] font-mono mt-1">на прослушку каждого</div>
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
          fontSize: "clamp(24px, 1.6cqw, 30px)",
        }}
      >
        РУКОВОДИТЕЛЬ ОП СЛУШАЕТ ТОЛЬКО{" "}
        <span style={{ color: "#B6FF00" }}>5 ЗВОНКОВ ИЗ 200</span>
        {" "}— ОСТАЛЬНОЕ ПРОПУСКАЕТ
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55 }}
        className="text-white/80 text-base md:text-lg leading-snug mt-5 max-w-xl"
      >
        Менеджеры теряют клиентов на возражениях. Руководитель не видит где именно.
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.85 }}
        className="text-white/60 text-sm md:text-base leading-relaxed mt-5 space-y-1.5 max-w-xl"
      >
        <p>200+ звонков в неделю. Послушать каждый — <span className="text-white font-semibold">30 часов</span>. Реально слушает 5-10 случайных.</p>
        <p><span style={{ color: "#FC5C02" }}>«Дорого»</span> не отрабатывают — клиент уходит. <span style={{ color: "#FC5C02" }}>«Я подумаю»</span> — не возвращают.</p>
        <p>Руководитель узнаёт о косяках через месяц — когда уже потеряны <span className="text-white font-semibold">30+ клиентов</span> и часть выручки.</p>
      </motion.div>
    </SlideLayout>
  );
}
