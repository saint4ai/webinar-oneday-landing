"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";

/**
 * W60 · «ЧТО ИМЕННО ОН ДЕЛАЕТ С ВАШИМИ ФАЙЛАМИ» — cream.
 * Конкретизирует абстракцию «агент работает с данными».
 * Механика: шесть типов рабочих файлов и что агент с ними делает.
 */
const INK = "#2A2520";

const JOBS = [
  { file: "прайс.xlsx", act: "собирает КП под клиента" },
  { file: "договор.docx", act: "вычитывает и правит формулировки" },
  { file: "выгрузка.csv", act: "считает и находит расхождения" },
  { file: "отчёт за месяц", act: "сводит цифры и пишет выводы" },
  { file: "папка с макетами", act: "переименовывает и раскладывает" },
  { file: "переписка с клиентом", act: "достаёт задачи и сроки" },
];

export function W60_WhatAgentDoes() {
  return (
    <SlideLayout
      speakerSide="right"
      contentClassName="!justify-start !py-0"
      style={{ background: "var(--brand-cream)" }}
      background={
        <>
          <div className="cream-grid" />
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: "-11rem",
              right: "10%",
              width: 600,
              height: 600,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(182,255,0,0.18), transparent 68%)",
              filter: "blur(16px)",
            }}
          />
          <div className="cream-grain" />
        </>
      }
    >
      <div
        className="flex flex-col h-full w-full"
        style={{ paddingTop: "clamp(38px,6.5cqh,86px)", paddingBottom: "clamp(26px,4cqh,52px)" }}
      >
        <div className="shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.18em] uppercase font-semibold mb-3"
            style={{ color: "#9A8A6E" }}
          >
            <span style={{ color: "#FC5C02", fontWeight: 700 }}>// </span>БЕЗ АБСТРАКЦИЙ
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
            animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
            transition={{ duration: 0.8, delay: 0.14, ease: [0.25, 1, 0.5, 1] }}
            className="font-bold uppercase leading-[1.02] tracking-[-0.02em]"
            style={{
              color: INK,
              fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(27px, 3.3cqw, 56px)",
            }}
          >
            ЧТО ОН ДЕЛАЕТ С <span style={{ color: "#FC5C02" }}>ВАШИМИ ФАЙЛАМИ</span>
          </motion.h1>
        </div>

        <div className="flex-1 min-h-0 mt-6 mb-5">
          <div
            className="w-full h-full grid gap-3"
            style={{
              gridTemplateColumns: "repeat(2, minmax(0,1fr))",
              gridTemplateRows: "repeat(3, minmax(0,1fr))",
            }}
          >
            {JOBS.map((j, i) => (
              <motion.div
                key={j.file}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.1, ease: [0.25, 1, 0.5, 1] }}
                className="rounded-xl px-6 py-5 flex flex-col justify-center"
                style={{ background: "#FBF6EC", border: "1px solid #E7DCC8" }}
              >
                <div
                  className="font-mono"
                  style={{ color: "#8B7B5E", fontSize: "clamp(12px,1.15cqw,20px)" }}
                >
                  {j.file}
                </div>
                <div
                  className="font-semibold leading-snug mt-1"
                  style={{ color: INK, fontSize: "clamp(15px,1.5cqw,27px)" }}
                >
                  {j.act}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="shrink-0 leading-snug"
          style={{ color: "rgba(42,37,32,0.7)", fontSize: "clamp(14px,1.25cqw,22px)" }}
        >
          Всё это лежит у вас на компьютере прямо сейчас. Агент открывает и делает.
        </motion.div>
      </div>
    </SlideLayout>
  );
}
