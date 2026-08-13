"use client";

import { motion } from "framer-motion";
import { SlideLayout } from "../SlideLayout";
import { GiftBox3D } from "../GiftBox3D";

/**
 * W60 · БОНУСНЫЙ МОДУЛЬ — премиальная подача подарка.
 *
 * Отличается от остальных семи слайдов программы намеренно: это подарок,
 * а не пункт списка. 3D-подарок слева, лаймовое свечение, крупная типографика.
 * Название — как в платформе: «Vibe coding: эра агентов на твоём компьютере».
 */

const INSIDE = [
  ["Установка с нуля", "Claude Code и OpenWhisper на ваш компьютер, шаг за шагом"],
  ["Работа с файлами", "Excel, CSV, PDF, договоры, отчёты — агент читает, сводит и переписывает в ваших папках"],
  ["Разбор реальных кейсов", "И набор инструментов вокруг агента"],
  ["AI-таргетолог внутри агента", "Отдельным бонусным уроком"],
];

export function W60_BonusModule() {
  return (
    <SlideLayout
      speakerSide="right"
      objectColumnSize="26cqw"
      contentMinWidth={520}
      objectOverflow="visible"
      contentClassName="!justify-start !py-0"
      background={
        <>
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(820px 600px at 22% 46%, rgba(182,255,0,0.16), transparent 62%), radial-gradient(600px 460px at 82% 8%, rgba(252,92,2,0.10), transparent 68%)",
            }}
          />
          {/* лучи от подарка */}
          <div
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: "4%",
              top: "50%",
              transform: "translateY(-50%)",
              width: 520,
              height: 520,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(182,255,0,0.22), transparent 66%)",
              filter: "blur(38px)",
            }}
          />
        </>
      }
      leftObject={
        <motion.div
          initial={{ opacity: 0, scale: 0.82, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.34, 1.4, 0.64, 1] }}
          className="relative w-full flex items-center justify-center"
        >
          <GiftBox3D />
        </motion.div>
      }
    >
      <div
        className="flex flex-col h-full w-full"
        style={{ paddingTop: "clamp(26px,4.2cqh,56px)", paddingBottom: "clamp(18px,2.6cqh,34px)" }}
      >
        <div className="shrink-0 flex items-start justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[11px] tracking-[0.2em] uppercase font-bold"
            style={{ color: "#B6FF00" }}
          >
            // ПОДАРОК К ОБУЧЕНИЮ
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="font-mono shrink-0"
            style={{ color: "#7E7E7E", fontSize: "clamp(11px,0.95cqw,15px)" }}
          >
            5 уроков · 2 ч 48 мин
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, clipPath: "inset(-18% 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(-18% 0% 0 0)" }}
          transition={{ duration: 0.85, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
          className="shrink-0 font-bold uppercase leading-[1.02] tracking-[-0.02em] text-white mt-2"
          style={{
            fontFamily: "var(--font-benzin), 'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(24px, 2.85cqw, 48px)",
          }}
        >
          VIBE CODING: ЭРА АГЕНТОВ
          <br />
          НА ТВОЁМ <span style={{ color: "#B6FF00" }}>КОМПЬЮТЕРЕ</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.42 }}
          className="shrink-0 mt-2 leading-snug font-semibold"
          style={{ color: "#B6FF00", fontSize: "clamp(14px,1.42cqw,25px)" }}
        >
          Для тех, у кого 3+ часа в день уходит на бумаги
        </motion.div>

        <div className="flex-1 min-h-0 mt-3.5 mb-2.5">
          <div className="w-full h-full flex flex-col gap-2 justify-center">
            {INSIDE.map(([head, tail], i) => (
              <motion.div
                key={head}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.55 + i * 0.11, ease: [0.25, 1, 0.5, 1] }}
                className="rounded-xl px-5 py-3.5"
                style={{
                  background: "rgba(182,255,0,0.055)",
                  border: "1px solid rgba(182,255,0,0.24)",
                }}
              >
                <span
                  className="font-semibold text-white leading-snug"
                  style={{ fontSize: "clamp(14px,1.3cqw,23px)" }}
                >
                  {head}.
                </span>{" "}
                <span
                  className="leading-snug"
                  style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(13px,1.18cqw,21px)" }}
                >
                  {tail}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 1.05, ease: [0.25, 1, 0.5, 1] }}
          className="shrink-0 rounded-2xl px-5 py-4"
          style={{
            background: "linear-gradient(135deg, rgba(182,255,0,0.14), rgba(182,255,0,0.05))",
            border: "1px solid rgba(182,255,0,0.42)",
            boxShadow: "0 0 40px rgba(182,255,0,0.10)",
          }}
        >
          <div
            className="font-mono uppercase tracking-[0.14em] mb-1.5"
            style={{ color: "#B6FF00", fontSize: "clamp(9.5px,0.8cqw,12px)" }}
          >
            На руках после модуля
          </div>
          <div
            className="font-semibold leading-tight text-white"
            style={{ fontSize: "clamp(14px,1.42cqw,25px)" }}
          >
            AI-сотрудник живёт в ваших папках и забирает рутину: таблицы, документы,
            отчёты. Без единой строчки кода
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}
